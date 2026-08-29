import type { CurrentGroups, PairHistory, Roster } from '@/types'
import { ROSTER_SIZE } from '@/types'

// Bumped from v1: the default roster changed from placeholder "Student N"
// names to real names, and only a missing key gets seeded with the default —
// bumping the version forces that reseed for anyone who already had v1 saved.
const ROSTER_KEY = 'grouper.roster.v2'
const PAIR_HISTORY_KEY = 'grouper.pairHistory.v1'
const CURRENT_GROUPS_KEY = 'grouper.currentGroups.v1'

const DEFAULT_STUDENT_NAMES = [
  'REDACTED',
  'REDACTED',
  'REDACTED',
  'REDACTED',
  'REDACTED',
  'REDACTED',
  'REDACTED',
  'REDACTED',
  'REDACTED',
  'REDACTED',
  'REDACTED',
  'REDACTED',
  'REDACTED',
  'REDACTED',
  'REDACTED',
  'REDACTED',
  'REDACTED',
  'REDACTED',
  'REDACTED',
  'REDACTED',
]

function defaultRoster(): Roster {
  return Array.from({ length: ROSTER_SIZE }, (_, i) => ({
    id: `s${String(i + 1).padStart(2, '0')}`,
    name: DEFAULT_STUDENT_NAMES[i] ?? `Student ${i + 1}`,
    present: true,
  }))
}

export function pairKey(idA: string, idB: string): string {
  return idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`
}

export function getRoster(): Roster {
  const raw = localStorage.getItem(ROSTER_KEY)
  if (!raw) {
    const seeded = defaultRoster()
    localStorage.setItem(ROSTER_KEY, JSON.stringify(seeded))
    return seeded
  }
  try {
    // `present` is a newer field: older saved rosters won't have it, so
    // default anyone missing it to present rather than migrating on read.
    const parsed = JSON.parse(raw) as Roster
    return parsed.map((s) => ({ ...s, present: s.present ?? true }))
  } catch {
    const seeded = defaultRoster()
    localStorage.setItem(ROSTER_KEY, JSON.stringify(seeded))
    return seeded
  }
}

export function setRoster(roster: Roster): void {
  localStorage.setItem(ROSTER_KEY, JSON.stringify(roster))
}

export function getPairHistory(): PairHistory {
  const raw = localStorage.getItem(PAIR_HISTORY_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as PairHistory
  } catch {
    return {}
  }
}

export function setPairHistory(history: PairHistory): void {
  localStorage.setItem(PAIR_HISTORY_KEY, JSON.stringify(history))
}

export function clearPairHistory(): void {
  localStorage.setItem(PAIR_HISTORY_KEY, JSON.stringify({}))
}

export function getCurrentGroups(): CurrentGroups | null {
  const raw = localStorage.getItem(CURRENT_GROUPS_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as CurrentGroups
  } catch {
    return null
  }
}

export function setCurrentGroups(groups: CurrentGroups): void {
  localStorage.setItem(CURRENT_GROUPS_KEY, JSON.stringify(groups))
}

export function clearCurrentGroups(): void {
  localStorage.removeItem(CURRENT_GROUPS_KEY)
}

export function nameLookup(roster: Roster): Map<string, string> {
  return new Map(roster.map((s) => [s.id, s.name]))
}

export const STORAGE_KEYS = {
  roster: ROSTER_KEY,
  pairHistory: PAIR_HISTORY_KEY,
  currentGroups: CURRENT_GROUPS_KEY,
} as const
