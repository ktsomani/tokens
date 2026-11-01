import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase access.
 *
 * All writes go through here with the service role key, and the `designs`
 * table has no anon insert or update policy. That means the browser cannot
 * write rows directly, so nobody can spray arbitrary data into the table by
 * reading the anon key out of the page source.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

let cached: SupabaseClient | null = null

export function serviceClient(): SupabaseClient {
  if (cached) return cached
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase is not configured on the server.')
  cached = createClient(url, key, { auth: { persistSession: false } })
  return cached
}

/** Anonymous read client, for fetching a public design in a server component. */
export function readClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}
