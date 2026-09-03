import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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

  useEffect(() => {
    if (open) {
      setStudents(roster)
      setGuestEnabled(false)
      setImportSummary(null)
      setSyncError(null)
    }
  }, [open, roster])

  const sortedIndices = useMemo(
    () =>
      students
        .map((_, i) => i)
        .sort((a, b) => firstName(students[a].name).localeCompare(firstName(students[b].name))),
    [students],
  )

  const presentCount = students.filter((s) => s.present).length
  const allFilled = students.every((s) => s.name.trim().length > 0)

  function updateStudent(index: number, patch: Partial<Student>) {
    setStudents((cur) => cur.map((s, i) => (i === index ? { ...s, ...patch } : s)))
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
    const nextRoster: Roster = roster.map((student, i) => {
      const trimmed = students[i].name.trim()
      const present = students[i].present
      // A renamed student gets a fresh id (see MainDisplay) so old pair
      // history isn't misattributed to them.
      if (trimmed === student.name) return { ...student, present }
      return { id: `s-${Date.now()}-${i}`, name: trimmed, present }
    })
    onSave(nextRoster, guestEnabled)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit roster</SheetTitle>
          <SheetDescription>
            {presentCount} of {students.length} in class today — uncheck anyone who&apos;s not here.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 border-b px-6 pb-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleSyncFromCanvas} disabled={syncing}>
              {syncing ? 'Syncing…' : 'Sync from Canvas'}
            </Button>
          </div>
          {syncError && <p className="text-destructive text-sm">{syncError}</p>}
          {importSummary && (
            <p className="text-muted-foreground text-sm">
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
              return (
                <div key={student.id} className="flex items-center gap-3">
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
            </div>
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
