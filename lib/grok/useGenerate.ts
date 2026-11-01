'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useStudio } from '@/lib/store'
import { GenerationSchema, type Generation } from './schema'
import { extractPartialString, looksComplete } from './partial'

type Frame =
  | { t: 'delta'; v: string }
  | { t: 'done'; v: unknown }
  | { t: 'error'; kind: string; message: string }

/**
 * Drives one generation end to end.
 *
 * Two things are happening at once and they are deliberately different in
 * kind. The streaming path is best-effort: it shows text as it lands and
 * pushes an optimistic preview so the user sees something take shape. The
 * completion path is authoritative: only a clean Zod parse is allowed to
 * touch the store, the token panel or the history.
 */
export function useGenerate() {
  const abortRef = useRef<AbortController | null>(null)
  const setGeneration = useStudio((s) => s.setGeneration)
  const addComponent = useStudio((s) => s.addComponent)

  useEffect(() => () => abortRef.current?.abort(), [])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setGeneration({ status: 'idle' })
  }, [setGeneration])

  const generate = useCallback(
    async (prompt: string) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const tokens = useStudio.getState().tokens
      setGeneration({
        status: 'streaming',
        prompt,
        raw: '',
        error: null,
        retryAfter: 0,
        lastFailedPrompt: null,
      })

      let response: Response
      try {
        response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, tokens }),
          signal: controller.signal,
        })
      } catch {
        if (controller.signal.aborted) return
        setGeneration({
          status: 'error',
          error: 'Could not reach the server.',
          lastFailedPrompt: prompt,
        })
        return
      }

      if (response.status === 429) {
        const data = await response.json().catch(() => ({}))
        setGeneration({
          status: 'rate-limited',
          error: data.error ?? 'Rate limit reached.',
          retryAfter: data.retryAfter ?? 60,
          lastFailedPrompt: prompt,
        })
        return
      }

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}))
        setGeneration({
          status: 'error',
          error: data.error ?? `Request failed (${response.status}).`,
          lastFailedPrompt: prompt,
        })
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let raw = ''
      let settled = false

      /* Optimistic preview. Debounced because re-transpiling on every token
         would be wasted work, and failures here are intentionally silent. */
      let lastPushed = ''
      let pushTimer: ReturnType<typeof setTimeout> | null = null
      const pushOptimistic = () => {
        const partial = extractPartialString(raw, 'code')
        if (!partial || partial === lastPushed || partial.length < 80) return
        lastPushed = partial
        setGeneration({ raw })
      }

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.trim()) continue
            let f: Frame
            try {
              f = JSON.parse(line)
            } catch {
              continue
            }

            if (f.t === 'delta') {
              raw += f.v
              setGeneration({ raw })
              if (pushTimer) clearTimeout(pushTimer)
              pushTimer = setTimeout(pushOptimistic, 300)
            } else if (f.t === 'error') {
              settled = true
              setGeneration({ status: 'error', error: f.message, lastFailedPrompt: prompt })
            } else if (f.t === 'done') {
              settled = true
              setGeneration({ status: 'validating' })
              commit(f.v, prompt)
            }
          }
        }
      } catch {
        if (controller.signal.aborted) return
        if (!settled) {
          setGeneration({
            status: 'error',
            error: 'The connection dropped mid-generation.',
            lastFailedPrompt: prompt,
          })
        }
        return
      } finally {
        if (pushTimer) clearTimeout(pushTimer)
      }

      // Stream ended without a terminal frame — treat it as a failure rather
      // than leaving the UI spinning.
      if (!settled) {
        if (looksComplete(raw)) {
          setGeneration({ status: 'validating' })
          try {
            commit(JSON.parse(raw), prompt)
            return
          } catch {
            /* fall through to the error below */
          }
        }
        setGeneration({
          status: 'error',
          error: 'The model stopped before finishing.',
          lastFailedPrompt: prompt,
        })
      }

      function commit(payload: unknown, forPrompt: string) {
        const result = GenerationSchema.safeParse(payload)
        if (!result.success) {
          setGeneration({
            status: 'error',
            error: 'The response did not match the expected shape.',
            lastFailedPrompt: forPrompt,
          })
          return
        }
        const gen: Generation = result.data
        // One call: the component and the tokens it assumes land together, so
        // the panel is never showing values the preview is not using.
        addComponent(
          {
            name: gen.name,
            description: gen.description,
            code: gen.code,
            a11yNotes: gen.a11yNotes,
            prompt: forPrompt,
          },
          gen.tokens,
        )
        setGeneration({ status: 'idle', raw: '', error: null })
      }
    },
    [setGeneration, addComponent],
  )

  return { generate, cancel }
}
