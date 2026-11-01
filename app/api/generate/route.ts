import { NextResponse } from 'next/server'
import { grokClient, grokModel, tokenLimit, MissingConfig } from '@/lib/grok/client'
import { GROK_JSON_SCHEMA, GenerationSchema } from '@/lib/grok/schema'
import { SYSTEM_PROMPT, userPrompt } from '@/lib/grok/prompt'
import { guardComponentCode } from '@/lib/sandbox/guard'
import { checkRateLimit, clientIp } from '@/lib/ratelimit'
import { TokensSchema } from '@/lib/tokens/schema'
import { transform } from 'sucrase'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

const RequestSchema = z.object({
  prompt: z.string().min(3).max(1000),
  tokens: TokensSchema,
})

type Frame =
  | { t: 'delta'; v: string }
  | { t: 'done'; v: unknown }
  | { t: 'error'; kind: 'upstream' | 'invalid'; message: string }

function frame(f: Frame): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(f) + '\n')
}

export async function POST(request: Request) {
  // ── Gate 0: rate limit, before a single token is spent ──
  const verdict = await checkRateLimit(clientIp(request.headers))
  if (!verdict.allowed) {
    return NextResponse.json(
      { error: 'Too many generations. Give it a moment.', retryAfter: verdict.retryAfter },
      { status: 429, headers: { 'Retry-After': String(verdict.retryAfter) } },
    )
  }

  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 })
  }

  let client, model
  try {
    client = grokClient()
    model = grokModel()
  } catch (err) {
    if (err instanceof MissingConfig) {
      return NextResponse.json(
        { error: `${err.message} Add it to .env.local and restart the server.` },
        { status: 503 },
      )
    }
    throw err
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let raw = ''
      try {
        const completion = await client.chat.completions.create({
          model,
          stream: true,
          // Named differently per provider; see tokenLimit().
          ...tokenLimit(6000),
          temperature: 0.7,
          response_format: { type: 'json_schema', json_schema: GROK_JSON_SCHEMA },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt(body.prompt, body.tokens) },
          ],
        })

        for await (const chunk of completion) {
          const delta = chunk.choices?.[0]?.delta?.content
          if (!delta) continue
          raw += delta
          controller.enqueue(frame({ t: 'delta', v: delta }))
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'The model call failed.'
        controller.enqueue(frame({ t: 'error', kind: 'upstream', message }))
        controller.close()
        return
      }

      // ── Gates 1–3: nothing becomes state until all of them pass ──
      try {
        // Gate 1: is it JSON at all, and does it have our shape?
        const parsed = GenerationSchema.parse(JSON.parse(raw))

        // Gate 2: static scan for things the sandbox exists to contain anyway.
        const guarded = guardComponentCode(parsed.name, parsed.code)
        if (!guarded.ok) {
          controller.enqueue(frame({ t: 'error', kind: 'invalid', message: guarded.reason }))
          controller.close()
          return
        }

        // Gate 3: does it actually compile? Catching this here means a
        // syntax error becomes a clean retry instead of a broken preview.
        try {
          transform(parsed.code, { transforms: ['jsx'], jsxRuntime: 'classic', production: true })
        } catch (syntax) {
          const detail = syntax instanceof Error ? syntax.message : 'syntax error'
          controller.enqueue(
            frame({ t: 'error', kind: 'invalid', message: `Generated code did not compile: ${detail}` }),
          )
          controller.close()
          return
        }

        controller.enqueue(frame({ t: 'done', v: parsed }))
      } catch (err) {
        const message =
          err instanceof z.ZodError
            ? `Model returned an unexpected shape: ${err.issues[0]?.path.join('.')} ${err.issues[0]?.message}`
            : 'Model returned something that was not valid JSON.'
        controller.enqueue(frame({ t: 'error', kind: 'invalid', message }))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
