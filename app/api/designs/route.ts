import { NextResponse } from 'next/server'
import { customAlphabet } from 'nanoid'
import { z } from 'zod'
import { serviceClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { TokensSchema } from '@/lib/tokens/schema'
import { guardComponentCode, MAX_CODE_BYTES } from '@/lib/sandbox/guard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// No lookalike characters: these ids get read aloud and typed by hand.
const newId = customAlphabet('23456789abcdefghjkmnpqrstuvwxyz', 10)

const ComponentSchema = z.object({
  id: z.string().max(40),
  name: z.string().max(60),
  description: z.string().max(240),
  code: z.string().max(MAX_CODE_BYTES),
  a11yNotes: z.array(z.string().max(200)).max(8),
  prompt: z.string().max(1000),
  createdAt: z.number(),
})

const PayloadSchema = z.object({
  title: z.string().min(1).max(80).default('Untitled'),
  tokens: TokensSchema,
  components: z.array(ComponentSchema).min(1).max(30),
})

const UpdateSchema = PayloadSchema.extend({
  id: z.string().min(4).max(32),
  editToken: z.string().uuid(),
})

function unconfigured() {
  return NextResponse.json(
    { error: 'Saving needs Supabase. Add the Supabase keys to .env.local to enable sharing.' },
    { status: 503 },
  )
}

/** Stored components are replayed into an iframe later, so they get the same guard now. */
function validateComponents(components: z.infer<typeof ComponentSchema>[]): string | null {
  for (const c of components) {
    const verdict = guardComponentCode(c.name, c.code)
    if (!verdict.ok) return `"${c.name}": ${verdict.reason}`
  }
  return null
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return unconfigured()

  let payload: z.infer<typeof PayloadSchema>
  try {
    payload = PayloadSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Malformed design payload.' }, { status: 400 })
  }

  const invalid = validateComponents(payload.components)
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })

  const id = newId()
  const { data, error } = await serviceClient()
    .from('designs')
    .insert({
      id,
      title: payload.title,
      tokens: payload.tokens,
      components: payload.components,
    })
    .select('id, edit_token')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Could not save the design.' }, { status: 500 })
  }

  // edit_token is returned exactly once, here, to whoever created the design.
  return NextResponse.json({ id: data.id, editToken: data.edit_token })
}

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) return unconfigured()

  let payload: z.infer<typeof UpdateSchema>
  try {
    payload = UpdateSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Malformed update payload.' }, { status: 400 })
  }

  const invalid = validateComponents(payload.components)
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })

  // The token is matched in the WHERE clause, so a wrong one updates zero rows
  // rather than being compared in application code.
  const { data, error } = await serviceClient()
    .from('designs')
    .update({
      title: payload.title,
      tokens: payload.tokens,
      components: payload.components,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payload.id)
    .eq('edit_token', payload.editToken)
    .select('id')

  if (error) return NextResponse.json({ error: 'Could not update.' }, { status: 500 })
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Not allowed to edit this design.' }, { status: 403 })
  }

  return NextResponse.json({ id: payload.id })
}
