import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { GROUP_SIZE, type Roster } from '@/types'

interface RosterEditorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roster: Roster
  onSave: (roster: Roster) => void
}

export function RosterEditorSheet({ open, onOpenChange, roster, onSave }: RosterEditorSheetProps) {
  const [names, setNames] = useState<string[]>(() => roster.map((s) => s.name))

  useEffect(() => {
    if (open) setNames(roster.map((s) => s.name))
  }, [open, roster])

  const allFilled = names.every((n) => n.trim().length > 0)

  function handleSave() {
    if (!allFilled) return
    const nextRoster: Roster = roster.map((student, i) => {
      const trimmed = names[i].trim()
      if (trimmed === student.name) return student
      return { id: `s-${Date.now()}-${i}`, name: trimmed }
    })
    onSave(nextRoster)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit roster</SheetTitle>
          <SheetDescription>All {roster.length} names are required before groups can be generated.</SheetDescription>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1 px-6">
          <div className="flex flex-col gap-4 py-2">
            {names.map((name, i) => (
              <div key={i} className="flex flex-col gap-4">
                {i > 0 && i % GROUP_SIZE === 0 && <Separator />}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`student-${i}`}>Student {i + 1}</Label>
                  <Input
                    id={`student-${i}`}
                    value={name}
                    onChange={(e) => {
                      const next = names.slice()
                      next[i] = e.target.value
                      setNames(next)
                    }}
                  />
                </div>
              </div>
            ))}
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
