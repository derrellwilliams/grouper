import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'

const STORE_KEY = 'grouper:attendance:latest'

type AttendanceStatus = 'present' | 'late' | 'absent' | 'unknown'

interface AttendanceRecord {
  name: string
  status: AttendanceStatus
}

interface StoredAttendance {
  records: AttendanceRecord[]
  updatedAt: string | null
}

// Vercel's Redis marketplace integration has injected credentials under
// different env var names depending on how it was connected — the current
// Upstash SDK convention (UPSTASH_REDIS_REST_URL/TOKEN) and the older
// Vercel KV naming some integrations still use (KV_REST_API_URL/TOKEN).
// Support both instead of guessing which one shows up.
function getRedis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  if (!url || !token) {
    throw new Error('Redis credentials not found in environment (checked UPSTASH_REDIS_REST_* and KV_REST_API_*)')
  }
  return new Redis({ url, token })
}

function isAttendanceRecordArray(value: unknown): value is AttendanceRecord[] {
  return (
    Array.isArray(value) &&
    value.every(
      (r) =>
        r &&
        typeof r === 'object' &&
        typeof (r as { name?: unknown }).name === 'string' &&
        ['present', 'late', 'absent', 'unknown'].includes((r as { status?: unknown }).status as string),
    )
  )
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const expectedSecret = process.env.ATTENDANCE_SYNC_SECRET
  if (!expectedSecret || req.headers['x-attendance-secret'] !== expectedSecret) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }

  const redis = getRedis()

  if (req.method === 'POST') {
    if (!isAttendanceRecordArray(req.body)) {
      res.status(400).json({ error: 'expected an array of { name, status } records' })
      return
    }
    const payload: StoredAttendance = { records: req.body, updatedAt: new Date().toISOString() }
    await redis.set(STORE_KEY, payload)
    res.status(200).json({ ok: true, count: payload.records.length })
    return
  }

  if (req.method === 'GET') {
    const stored = await redis.get<StoredAttendance>(STORE_KEY)
    res.status(200).json(stored ?? { records: [], updatedAt: null })
    return
  }

  res.status(405).json({ error: 'method not allowed' })
}
