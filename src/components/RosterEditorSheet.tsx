import { Plus, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { matchAttendanceToRoster, type AttendanceMatchResult } from '@/lib/attendanceImport'
import { fetchCanvasAttendance } from '@/lib/attendanceSync'
import type { Roster, Student } from '@/types'

interface RosterEditorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roster: Roster
  onSave: (roster: Roster, includeGuest: boolean) => void
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? ''
}

function randomStudentId(): string {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

// Matches the row's exit animation duration below — the row is only
// actually removed from state once its animate-out has had time to play.
const ROW_EXIT_MS = 150

export function RosterEditorSheet({ open, onOpenChange, roster, onSave }: RosterEditorSheetProps) {
  // Indexed the same as `roster` throughout — only the rendered order is
  // alphabetized, so ids/order stay stable for saving.
  const [students, setStudents] = useState<Roster>(roster)
  // A one-off addition for today, not a roster member — always starts
  // unchecked so a forgotten guest doesn't silently keep reappearing.
  const [guestEnabled, setGuestEnabled] = useState(false)
  const [importSummary, setImportSummary] = useState<AttendanceMatchResult | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  // Rows mid-exit-animation — still in `students` until their timer below
  // actually removes them, so the row can animate out instead of vanishing.
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())
  const removeTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    if (open) {
      setStudents(roster)
      setGuestEnabled(false)
      setImportSummary(null)
      setSyncError(null)
      // Reopening should reflect the saved roster immediately, not finish
      // animating out a row from whatever was happening last time it was open.
      removeTimers.current.forEach(clearTimeout)
      removeTimers.current.clear()
      setRemovingIds(new Set())
    }
  }, [open, roster])

  useEffect(() => {
    const timers = removeTimers.current
    return () => {
      timers.forEach(clearTimeout)
    }
  }, [])

  const sortedIndices = useMemo(
    () =>
      students
        .map((_, i) => i)
        .sort((a, b) => firstName(students[a].name).localeCompare(firstName(students[b].name))),
    [students],
  )

  const allFilled = students.every((s) => s.name.trim().length > 0)

  function updateStudent(index: number, patch: Partial<Student>) {
    setStudents((cur) => cur.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  function addStudent() {
    setStudents((cur) => [...cur, { id: randomStudentId(), name: '', present: true }])
  }

  function removeStudent(id: string) {
    setRemovingIds((cur) => new Set(cur).add(id))
    const timer = setTimeout(() => {
      setStudents((cur) => cur.filter((s) => s.id !== id))
      setRemovingIds((cur) => {
        const next = new Set(cur)
        next.delete(id)
        return next
      })
      removeTimers.current.delete(id)
    }, ROW_EXIT_MS)
    removeTimers.current.set(id, timer)
  }

  async function handleSyncFromCanvas() {
    setSyncing(true)
    setSyncError(null)
    try {
      const { records } = await fetchCanvasAttendance()
      const result = matchAttendanceToRoster(students, records)
      setStudents(result.updated)
      setImportSummary(result)
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  function handleSave() {
    if (!allFilled) return
    const originalById = new Map(roster.map((s) => [s.id, s]))
    const nextRoster: Roster = students.map((student) => {
      const trimmed = student.name.trim()
      const original = originalById.get(student.id)
      // A renamed student gets a fresh id (see MainDisplay) so old pair
      // history isn't misattributed to them. Newly added students (no
      // original to compare against) just keep the id they were created with.
      if (!original || trimmed === original.name) return { ...student, name: trimmed }
      return { id: randomStudentId(), name: trimmed, present: student.present }
    })
    onSave(nextRoster, guestEnabled)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit roster</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-2 border-b px-6 pb-4">
          <Button type="button" variant="outline" className="h-9 w-full" onClick={handleSyncFromCanvas} disabled={syncing}>
            {syncing ? 'Syncing…' : 'Sync from Canvas'}
          </Button>
          {syncError && (
            <p className="animate-in fade-in slide-in-from-top-1 text-destructive text-sm duration-200 ease-out">
              {syncError}
            </p>
          )}
          {importSummary && (
            <p className="animate-in fade-in slide-in-from-top-1 text-muted-foreground text-sm duration-200 ease-out">
              Matched {importSummary.matchedCount} of {students.length}
              {importSummary.unmatchedRosterNames.length > 0 && (
                <> · unmatched: {importSummary.unmatchedRosterNames.join(', ')}</>
              )}
            </p>
          )}
        </div>
        <ScrollArea className="min-h-0 flex-1 px-6">
          <div className="flex flex-col gap-3 py-2">
            {sortedIndices.map((i) => {
              const student = students[i]
              const removing = removingIds.has(student.id)
              return (
                <div
                  key={student.id}
                  data-removing={removing || undefined}
                  className="animate-in fade-in slide-in-from-top-1 data-removing:animate-out data-removing:fade-out data-removing:slide-out-to-top-1 flex items-center gap-3 duration-200 ease-out data-removing:pointer-events-none data-removing:duration-150"
                >
                  <Checkbox
                    id={`present-${student.id}`}
                    checked={student.present}
                    onCheckedChange={(checked) => updateStudent(i, { present: checked === true })}
                  />
                  <Label htmlFor={`present-${student.id}`} className="sr-only">
                    {student.name.trim() || `Student ${i + 1}`} present today
                  </Label>
                  <Input
                    value={student.name}
                    onChange={(e) => updateStudent(i, { name: e.target.value })}
                    className={student.present ? undefined : 'text-muted-foreground line-through'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${student.name.trim() || 'student'}`}
                    onClick={() => removeStudent(student.id)}
                  >
                    <X />
                  </Button>
                </div>
              )
            })}
            <div className="flex items-center gap-3">
              <Checkbox
                id="present-guest"
                checked={guestEnabled}
                onCheckedChange={(checked) => setGuestEnabled(checked === true)}
              />
              <Label htmlFor="present-guest" className="sr-only">
                Guest present today
              </Label>
              <Input
                value="Guest"
                readOnly
                className={guestEnabled ? undefined : 'text-muted-foreground line-through'}
              />
              <div className="size-7 shrink-0" />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addStudent} className="self-start">
              <Plus /> Add student
            </Button>
          </div>
        </ScrollArea>
        <SheetFooter>
          <Button onClick={handleSave} disabled={!allFilled} size="lg">
            Save roster
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
