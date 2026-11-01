import { createHmac } from 'node:crypto'
import { serviceClient, isSupabaseConfigured } from '@/lib/supabase/server'

export const WINDOW_SECONDS = 60
export const MAX_PER_WINDOW = 8

/**
 * IPs are never stored in the clear. The hash is keyed with a server secret,
 * so the stored value is useless without it and cannot be reversed by
 * enumerating the address space.
 */
function hashIp(ip: string): string {
  const salt = process.env.RATE_LIMIT_SALT ?? 'tokens-dev-salt'
  return createHmac('sha256', salt).update(ip).digest('hex').slice(0, 32)
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return headers.get('x-real-ip') ?? '0.0.0.0'
}

export type RateVerdict = { allowed: true } | { allowed: false; retryAfter: number }

/* Vercel's functions share no memory between invocations, so an in-process
   counter would not actually limit anything in production. It exists only as a
   dev fallback for when Supabase is not configured. */
const memory = new Map<string, { count: number; resetAt: number }>()

function memoryLimit(key: string): RateVerdict {
  const now = Date.now()
  const entry = memory.get(key)
  if (!entry || entry.resetAt < now) {
    memory.set(key, { count: 1, resetAt: now + WINDOW_SECONDS * 1000 })
    return { allowed: true }
  }
  if (entry.count >= MAX_PER_WINDOW) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }
  entry.count += 1
  return { allowed: true }
}

export async function checkRateLimit(ip: string): Promise<RateVerdict> {
  const key = hashIp(ip)

  if (!isSupabaseConfigured()) return memoryLimit(key)

  try {
    const { data, error } = await serviceClient().rpc('check_rate_limit', {
      p_key: key,
      p_limit: MAX_PER_WINDOW,
      p_window_seconds: WINDOW_SECONDS,
    })
    if (error) throw error
    const row = Array.isArray(data) ? data[0] : data
    if (row?.allowed) return { allowed: true }
    return { allowed: false, retryAfter: row?.retry_after ?? WINDOW_SECONDS }
  } catch {
    // A limiter that fails closed would take the whole studio down with it.
    // Fall back to the in-process counter rather than refusing everyone.
    return memoryLimit(key)
  }
}
