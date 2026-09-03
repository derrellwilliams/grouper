import { Settings } from 'lucide-react'
import { useState } from 'react'
import { ResetHistoryDialog } from '@/components/ResetHistoryDialog'
import { RosterEditorSheet } from '@/components/RosterEditorSheet'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Roster } from '@/types'

interface SettingsMenuProps {
  roster: Roster
  onRosterSaved: (roster: Roster, includeGuest: boolean) => void
  onHistoryReset: () => void
}

export function SettingsMenu({ roster, onRosterSaved, onHistoryReset }: SettingsMenuProps) {
  const [rosterOpen, setRosterOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-10 text-foreground/70 hover:text-foreground"
            aria-label="Settings"
          >
            <Settings className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setRosterOpen(true)}>Edit roster</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setResetOpen(true)}>
            Reset history
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RosterEditorSheet open={rosterOpen} onOpenChange={setRosterOpen} roster={roster} onSave={onRosterSaved} />
      <ResetHistoryDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        onConfirm={() => {
          onHistoryReset()
          setResetOpen(false)
        }}
      />
    </>
  )
}
