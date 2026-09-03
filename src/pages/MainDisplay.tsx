import { RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { GroupCard } from '@/components/GroupCard'
import { GroupSizePicker } from '@/components/GroupSizePicker'
import { SettingsMenu } from '@/components/SettingsMenu'
import { ShaderBackground } from '@/components/ShaderBackground'
import { Button } from '@/components/ui/button'
import { useUniformNameFontSize } from '@/hooks/useUniformNameFontSize'
import { generateGroups, applyGroupsToHistory } from '@/lib/grouping'
import {
  clearCurrentGroups,
  clearPairHistory,
  getCurrentGroups,
  getGroupSize,
  getPairHistory,
  getRoster,
  nameLookup,
  setCurrentGroups,
  setGroupSize,
  setPairHistory,
  setRoster,
} from '@/lib/storage'
import { broadcast, subscribe } from '@/lib/sync'
import { groupNumberForIndex } from '@/lib/theme'
import { MIN_PRESENT_TO_GENERATE, type CurrentGroups, type GroupSizeOption, type Roster } from '@/types'

// Matches the refresh button's spin transition duration below, so the new
// names reveal (and start their split-flap animation) right as it's finishing.
const SPIN_DURATION_MS = 1100
const REVEAL_LEAD_MS = 500
const SPIN_DEGREES = 2160

function computeGroups(roster: Roster, groupSize: GroupSizeOption, guestId: string | null): CurrentGroups {
  const history = getPairHistory()
  const presentIds = roster.filter((s) => s.present).map((s) => s.id)
  if (guestId) presentIds.push(guestId)

  const groups = generateGroups(presentIds, history, groupSize)
  const nextHistory = applyGroupsToHistory(groups, history)
  const next: CurrentGroups = { generatedAt: new Date().toISOString(), groups }

  setPairHistory(nextHistory)
  setCurrentGroups(next)
  return next
}

/**
 * Near-square grid dimensions biased for landscape displays. Groups with
 * many members (5+) need more vertical room per card than a square grid
 * gives them, so that specific shape (exactly 4 groups, 5+ each) gets a
 * single wide row of taller cards instead — every other group count/size
 * keeps the standard square-ish arrangement.
 */
function gridDimensions(groupCount: number, namesPerCard: number): { cols: number; rows: number } {
  if (groupCount === 4 && namesPerCard >= 5) {
    return { cols: 4, rows: 1 }
  }
  const rows = Math.max(1, Math.round(Math.sqrt(groupCount / 1.6)))
  const cols = Math.ceil(groupCount / rows)
  return { cols, rows }
}

function gapClassForCount(groupCount: number, namesPerCard: number): string {
  if (groupCount === 4 && namesPerCard >= 5) return 'gap-8 sm:gap-10'
  if (groupCount <= 4) return 'gap-24 sm:gap-28'
  if (groupCount <= 6) return 'gap-14 sm:gap-16'
  return 'gap-8 sm:gap-10'
}

export function MainDisplay() {
  const [roster, setRosterState] = useState<Roster>(() => getRoster())
  // Null means no groups yet — nothing renders until the refresh button is
  // pressed, so the first-ever groups still get their entrance/flap-in.
  const [currentGroups, setCurrentGroupsState] = useState<CurrentGroups | null>(() => getCurrentGroups())
  const [groupSize, setGroupSizeState] = useState<GroupSizeOption>(() => getGroupSize())
  // A one-off addition for today, not a roster member — never persisted.
  const [guestId, setGuestId] = useState<string | null>(null)
  const [spins, setSpins] = useState(0)

  useEffect(() => {
    return subscribe((message) => {
      if (message.type === 'roster-updated') setRosterState(getRoster())
      if (message.type === 'groups-updated') setCurrentGroupsState(getCurrentGroups())
      if (message.type === 'history-reset') setCurrentGroupsState(getCurrentGroups())
      if (message.type === 'group-size-updated') setGroupSizeState(getGroupSize())
    })
  }, [])

  function invalidatesCurrentGroups(validIds: Set<string>, groups: CurrentGroups | null): boolean {
    if (!groups) return false
    // Covers a renamed student (id disappears), one just marked absent (id
    // stays but is no longer present), and a guest being removed/replaced —
    // any of those means the displayed groups no longer reflect reality.
    return groups.groups.some((group) => group.some((id) => !validIds.has(id)))
  }

  const names = useMemo(() => {
    const map = nameLookup(roster)
    if (guestId) map.set(guestId, 'Guest')
    return map
  }, [roster, guestId])
  const presentCount = useMemo(() => roster.filter((s) => s.present).length, [roster])
  const canGenerate = presentCount >= MIN_PRESENT_TO_GENERATE

  const groupNames = useMemo(
    () => currentGroups?.groups.map((group) => group.map((id) => names.get(id) ?? '?')) ?? null,
    [currentGroups, names],
  )
  const { fontSizePx, registerCard } = useUniformNameFontSize(groupNames)

  function handleGenerate() {
    if (!canGenerate) return

    // Kick the spin off first and let the browser paint it before the
    // (synchronous, CPU-bound) generation runs — otherwise the click handler
    // blocks the main thread and the spin never gets a frame to start on.
    setSpins((s) => s + 1)
    setTimeout(() => {
      const next = computeGroups(roster, groupSize, guestId)
      setTimeout(() => {
        setCurrentGroupsState(next)
        broadcast({ type: 'groups-updated' })
      }, SPIN_DURATION_MS - REVEAL_LEAD_MS)
    }, 0)
  }

  function handleGroupSizeChange(size: GroupSizeOption) {
    setGroupSize(size)
    setGroupSizeState(size)
    broadcast({ type: 'group-size-updated' })
  }

  function handleRosterSaved(nextRoster: Roster, includeGuest: boolean) {
    setRoster(nextRoster)
    setRosterState(nextRoster)

    // Fresh id each time so a past guest's history never gets attributed to
    // whoever checks the box next.
    const nextGuestId = includeGuest ? `guest-${Date.now()}` : null

    // A renamed student gets a fresh id (see RosterEditorSheet) so old pair
    // history isn't misattributed — but that also orphans any in-progress
    // grouping that referenced the old id. Clear it rather than show gaps.
    const validIds = new Set(nextRoster.filter((s) => s.present).map((s) => s.id))
    if (nextGuestId) validIds.add(nextGuestId)
    if (invalidatesCurrentGroups(validIds, currentGroups)) {
      clearCurrentGroups()
      setCurrentGroupsState(null)
    }

    setGuestId(nextGuestId)
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

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-8">
        {currentGroups &&
          groupNames &&
          (() => {
            const groupCount = currentGroups.groups.length
            const namesPerCard = Math.max(...currentGroups.groups.map((g) => g.length))
            const { cols, rows } = gridDimensions(groupCount, namesPerCard)
            return (
              <div
                className={`grid min-h-0 w-full flex-1 ${gapClassForCount(groupCount, namesPerCard)}`}
                style={{
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                }}
              >
                {groupNames.map((names, i) => (
                  <GroupCard
                    key={i}
                    groupNumber={groupNumberForIndex(i)}
                    names={names}
                    fontSizePx={fontSizePx}
                    contentRef={registerCard(i)}
                  />
                ))}
              </div>
            )
          })()}

        <div className="z-20 flex shrink-0 flex-row items-center gap-4">
          <GroupSizePicker value={groupSize} onChange={handleGroupSizeChange} />
          <Button
            size="icon"
            onClick={handleGenerate}
            disabled={!canGenerate}
            aria-label={canGenerate ? 'Generate new groups' : `Need at least ${MIN_PRESENT_TO_GENERATE} students present`}
            title={canGenerate ? undefined : `Need at least ${MIN_PRESENT_TO_GENERATE} students present`}
            className="size-14 cursor-pointer rounded-full shadow-lg transition-transform duration-150 ease-out hover:scale-125 active:translate-y-0! active:scale-75 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className="size-6"
              style={{
                transform: `rotate(${spins * SPIN_DEGREES}deg)`,
                transition: `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
              }}
            />
          </Button>
        </div>
      </div>
    </div>
  )
}
