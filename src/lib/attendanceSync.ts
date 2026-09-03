import type { AttendanceRecord } from '@/lib/attendanceImport'

const SECRET_STORAGE_KEY = 'grouper.attendanceSyncSecret.v1'

function getStoredSecret(): string | null {
  return localStorage.getItem(SECRET_STORAGE_KEY)
}

function ensureSecret(): string | null {
  const stored = getStoredSecret()
  if (stored) return stored
  const entered = window.prompt('Canvas sync key (set up once — must match the key in the userscript):')?.trim()
  if (!entered) return null
  localStorage.setItem(SECRET_STORAGE_KEY, entered)
  return entered
}

export interface CanvasAttendanceResult {
  records: AttendanceRecord[]
  updatedAt: string | null
}

/**
 * Pulls whatever attendance state the Canvas-side userscript last pushed.
 * Prompts for and remembers a shared secret on first use — it's typed in
 * once and stored locally, never shipped in the app bundle.
 */
export async function fetchCanvasAttendance(): Promise<CanvasAttendanceResult> {
  const secret = ensureSecret()
  if (!secret) throw new Error('A sync key is required to pull attendance from Canvas.')

  const res = await fetch('/api/attendance', {
    headers: { 'x-attendance-secret': secret },
  })

  if (res.status === 401) {
    localStorage.removeItem(SECRET_STORAGE_KEY)
    throw new Error('That sync key was rejected — try again with the correct key.')
  }
  if (!res.ok) {
    throw new Error(`Sync failed (${res.status})`)
  }

  return res.json()
}
