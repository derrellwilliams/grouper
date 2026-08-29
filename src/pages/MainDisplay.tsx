import { RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { GroupCard } from '@/components/GroupCard'
import { SettingsMenu } from '@/components/SettingsMenu'
import { ShaderBackground } from '@/components/ShaderBackground'
import { Button } from '@/components/ui/button'
import { generateGroups, applyGroupsToHistory } from '@/lib/grouping'
import {
  clearCurrentGroups,
  clearPairHistory,
  getCurrentGroups,
  getPairHistory,
  getRoster,
  nameLookup,
  setCurrentGroups,
  setPairHistory,
  setRoster,
} from '@/lib/storage'
import { broadcast, subscribe } from '@/lib/sync'
import { groupNumberForIndex } from '@/lib/theme'
import { GROUP_COUNT, type CurrentGroups, type Roster } from '@/types'

// Matches the refresh button's spin transition duration below, so the new
// names reveal (and start their split-flap animation) right as it's finishing.
const SPIN_DURATION_MS = 1100
const REVEAL_LEAD_MS = 500
const SPIN_DEGREES = 2160

function computeGroups(roster: Roster): CurrentGroups {
  const history = getPairHistory()
  const groups = generateGroups(
    roster.filter((s) => s.present).map((s) => s.id),
    history,
  )
  const nextHistory = applyGroupsToHistory(groups, history)
  const next: CurrentGroups = { generatedAt: new Date().toISOString(), groups }

  setPairHistory(nextHistory)
  setCurrentGroups(next)
  return next
}

export function MainDisplay() {
  const [roster, setRosterState] = useState<Roster>(() => getRoster())
  // Null means no groups yet — nothing renders until the refresh button is
  // pressed, so the first-ever groups still get their entrance/flap-in.
  const [currentGroups, setCurrentGroupsState] = useState<CurrentGroups | null>(() => getCurrentGroups())
  const [spins, setSpins] = useState(0)

  useEffect(() => {
    return subscribe((message) => {
      if (message.type === 'roster-updated') setRosterState(getRoster())
      if (message.type === 'groups-updated') setCurrentGroupsState(getCurrentGroups())
      if (message.type === 'history-reset') setCurrentGroupsState(getCurrentGroups())
    })
  }, [])

  function invalidatesCurrentGroups(nextRoster: Roster, groups: CurrentGroups | null): boolean {
    if (!groups) return false
    // Covers both a renamed student (id disappears) and one just marked
    // absent (id stays but is no longer present) — either way the displayed
    // groups no longer reflect the roster and should be cleared.
    const presentIds = new Set(nextRoster.filter((s) => s.present).map((s) => s.id))
    return groups.groups.some((group) => group.some((id) => !presentIds.has(id)))
  }

  const names = useMemo(() => nameLookup(roster), [roster])
  const presentCount = useMemo(() => roster.filter((s) => s.present).length, [roster])
  const canGenerate = presentCount >= GROUP_COUNT

  function handleGenerate() {
    if (!canGenerate) return

    // Kick the spin off first and let the browser paint it before the
    // (synchronous, CPU-bound) generation runs — otherwise the click handler
    // blocks the main thread and the spin never gets a frame to start on.
    setSpins((s) => s + 1)
    setTimeout(() => {
      const next = computeGroups(roster)
      setTimeout(() => {
        setCurrentGroupsState(next)
        broadcast({ type: 'groups-updated' })
      }, SPIN_DURATION_MS - REVEAL_LEAD_MS)
    }, 0)
  }

  function handleRosterSaved(nextRoster: Roster) {
    setRoster(nextRoster)
    setRosterState(nextRoster)

    // A renamed student gets a fresh id (see RosterEditorSheet) so old pair
    // history isn't misattributed — but that also orphans any in-progress
    // grouping that referenced the old id. Clear it rather than show gaps.
    if (invalidatesCurrentGroups(nextRoster, currentGroups)) {
      clearCurrentGroups()
      setCurrentGroupsState(null)
    }

    broadcast({ type: 'roster-updated' })
  }

  function handleHistoryReset() {
    clearPairHistory()
    clearCurrentGroups()
    setCurrentGroupsState(null)
    broadcast({ type: 'history-reset' })
  }

  return (
    <div className="relative flex h-svh flex-col gap-4 overflow-hidden p-8 sm:p-12">
      <ShaderBackground />

      <div className="absolute top-4 right-4 z-10">
        <SettingsMenu roster={roster} onRosterSaved={handleRosterSaved} onHistoryReset={handleHistoryReset} />
      </div>

      <div className="relative min-h-0 flex-1">
        {currentGroups && (
          <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-24 sm:gap-28">
            {currentGroups.groups.map((group, i) => (
              <GroupCard
                key={i}
                groupNumber={groupNumberForIndex(i)}
                names={group.map((id) => names.get(id) ?? '?')}
              />
            ))}
          </div>
        )}

        <Button
          size="icon"
          onClick={handleGenerate}
          disabled={!canGenerate}
          aria-label={canGenerate ? 'Generate new groups' : `Need at least ${GROUP_COUNT} students present`}
          title={canGenerate ? undefined : `Need at least ${GROUP_COUNT} students present`}
          className="absolute inset-0 z-20 m-auto size-16 cursor-pointer rounded-full shadow-lg transition-transform duration-150 ease-out hover:scale-125 active:translate-y-0! active:scale-75 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className="size-7"
            style={{
              transform: `rotate(${spins * SPIN_DEGREES}deg)`,
              transition: `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
            }}
          />
        </Button>
      </div>
    </div>
  )
}
