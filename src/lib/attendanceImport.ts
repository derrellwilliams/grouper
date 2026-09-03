import type { Roster } from '@/types'

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'unknown'

export interface AttendanceRecord {
  name: string
  status: AttendanceStatus
}

export interface AttendanceMatchResult {
  updated: Roster
  matchedCount: number
  /** Roster names with no corresponding attendance record (or an unrecognized status) — left untouched. */
  unmatchedRosterNames: string[]
  /** Attendance records that didn't match anyone in the roster — likely a spelling mismatch. */
  unmatchedRecordNames: string[]
}

/** They're in the room — flip this if your class should treat "Late" as absent for grouping. */
const LATE_COUNTS_AS_PRESENT = true

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

function normalizeStatus(raw: string): AttendanceStatus {
  const s = raw.trim().toLowerCase()
  if (s.startsWith('present') || s === 'p') return 'present'
  if (s.startsWith('late') || s.startsWith('tardy') || s === 'l') return 'late'
  if (s.startsWith('absent') || s === 'a') return 'absent'
  return 'unknown'
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      fields.push(cur)
      cur = ''
    } else {
      cur += c
    }
  }
  fields.push(cur)
  return fields
}

/**
 * Parses Canvas's "Attendance Report" CSV export. Columns are looked up by
 * header name (not position) since the exact layout varies by export and
 * hasn't been verified against a live sample yet.
 */
export function parseAttendanceCsv(csvText: string): AttendanceRecord[] {
  const lines = csvText.split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0)
  if (lines.length < 2) return []

  const header = parseCsvLine(lines[0]).map((h) => h.trim())
  const nameIndex = header.findIndex((h) => /^(student|name)/i.test(h))
  if (nameIndex === -1) return []

  const statusIndex = header.findIndex((h) => /status/i.test(h))
  // Wide format (no dedicated status column): the attendance value lives in
  // a per-date column. Canvas orders those chronologically, so the
  // right-most one is the most recent day.
  const nonMetaIndices = header
    .map((_, i) => i)
    .filter((i) => i !== nameIndex && !/^(id|sis|section|login)/i.test(header[i]))
  const fallbackIndex = nonMetaIndices[nonMetaIndices.length - 1]

  const records: AttendanceRecord[] = []
  for (const line of lines.slice(1)) {
    const fields = parseCsvLine(line)
    const name = fields[nameIndex]?.trim()
    if (!name) continue
    const rawStatus = (statusIndex !== -1 ? fields[statusIndex] : fields[fallbackIndex]) ?? ''
    records.push({ name, status: normalizeStatus(rawStatus) })
  }
  return records
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
