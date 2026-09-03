import type { Roster } from '@/types'

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'unknown'

export interface AttendanceRecord {
  name: string
  status: AttendanceStatus
}

export interface AttendanceMatchResult {
  updated: Roster
  matchedCount: number
  /** Roster names with no corresponding attendance record — likely a spelling mismatch, left untouched. */
  unmatchedRosterNames: string[]
  /** Attendance records that didn't match anyone in the roster — likely a spelling mismatch. */
  unmatchedRecordNames: string[]
}

/** They're in the room — flip this if your class should treat "Late" as absent for grouping. */
const LATE_COUNTS_AS_PRESENT = true

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Applies attendance records onto a roster by exact (case/whitespace
 * insensitive) name match. Never guesses at a fuzzy match — anything that
 * doesn't match exactly is reported back instead of silently applied.
 */
export function matchAttendanceToRoster(roster: Roster, records: AttendanceRecord[]): AttendanceMatchResult {
  const byName = new Map<string, AttendanceRecord>()
  for (const record of records) {
    byName.set(normalizeName(record.name), record)
  }

  const matchedRecordKeys = new Set<string>()
  const unmatchedRosterNames: string[] = []
  let matchedCount = 0

  const updated = roster.map((student) => {
    const key = normalizeName(student.name)
    const record = byName.get(key)
    // No record at all means we couldn't find this roster name in the
    // Canvas data (likely a spelling mismatch) — leave it untouched rather
    // than guess. A record with status "unknown" (Canvas shows them as not
    // yet marked) is a real match, just not a present one — Canvas has no
    // confirmation they're here, so default to unchecked.
    if (!record) {
      unmatchedRosterNames.push(student.name)
      return student
    }
    matchedRecordKeys.add(key)
    matchedCount++
    const present = record.status === 'present' || (record.status === 'late' && LATE_COUNTS_AS_PRESENT)
    return { ...student, present }
  })

  const unmatchedRecordNames = records
    .filter((r) => !matchedRecordKeys.has(normalizeName(r.name)))
    .map((r) => r.name)

  return { updated, matchedCount, unmatchedRosterNames, unmatchedRecordNames }
}
