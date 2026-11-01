'use client'

import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useStudio } from '@/lib/store'
import { useGenerate } from '@/lib/grok/useGenerate'
import { extractPartialString } from '@/lib/grok/partial'
import { Kbd } from '@/components/ui/primitives'

const EXAMPLES = [
  'A pricing table with three tiers and a highlighted middle plan',
  'A settings form with grouped toggles and a destructive delete zone',
  'An empty state for a project list, with an illustration slot',
  'A toast notification with an icon, message and dismiss control',
]

export function CommandBar() {
  const overlay = useStudio((s) => s.ui.overlay)
  const setOverlay = useStudio((s) => s.setOverlay)
  const generation = useStudio((s) => s.generation)
  const resetGeneration = useStudio((s) => s.resetGeneration)
  const { generate, cancel } = useGenerate()

  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const reduced = useReducedMotion()
  const open = overlay === 'prompt'

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  // Live countdown on a 429, so the user sees time passing rather than a wall.
  const retryAfter = generation.retryAfter
  const setGeneration = useStudio((s) => s.setGeneration)
  useEffect(() => {
    if (generation.status !== 'rate-limited' || retryAfter <= 0) return
    const t = setInterval(() => {
      const next = useStudio.getState().generation.retryAfter - 1
      if (next <= 0) {
        setGeneration({ status: 'idle', retryAfter: 0, error: null })
      } else {
        setGeneration({ retryAfter: next })
      }
    }, 1000)
    return () => clearInterval(t)
  }, [generation.status, retryAfter, setGeneration])

  const busy = generation.status === 'streaming' || generation.status === 'validating'
  const partialCode = busy ? extractPartialString(generation.raw, 'code') : null

  function submit() {
    const prompt = value.trim()
    if (!prompt || busy) return
    generate(prompt)
  }

  function close() {
    if (busy) cancel()
    setOverlay('none')
    resetGeneration()
    setValue('')
  }

  // Generation finishing closes the bar; a failure keeps it open to retry in place.
  useEffect(() => {
    if (open && generation.status === 'idle' && generation.raw === '' && value && !busy) {
      setOverlay('none')
      setValue('')
    }
  }, [generation.status, generation.raw]) // eslint-disable-line react-hooks/exhaustive-deps

  const motionProps = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: -8, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -8, scale: 0.98 },
      }

  return (
    <AnimatePresence>
      {open && (
        <m.div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          <div
            className="absolute inset-0 bg-ink/20 backdrop-blur-[2px]"
            onClick={close}
            aria-hidden
          />

          <m.div
            role="dialog"
            aria-modal="true"
            aria-label="Generate a component"
            className="elevated relative w-full max-w-2xl overflow-hidden rounded-xl border border-hairline bg-raised"
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            {...motionProps}
          >
            <div className="flex items-start gap-3 p-4">
              <span className="mt-2 select-none font-mono text-xs text-dim" aria-hidden>
                ⌘K
              </span>
              <textarea
                ref={inputRef}
                rows={2}
                value={value}
                disabled={busy}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    submit()
                  }
                }}
                placeholder="Describe a component…"
                aria-describedby="prompt-hint"
                className="min-h-[3rem] flex-1 resize-none bg-transparent text-sm leading-relaxed text-ink placeholder:text-dim focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* ── Streaming ─────────────────────────────────────── */}
            {busy && (
              <div className="hairline-t">
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="flex items-center gap-2 text-2xs text-muted">
                    <span className="relative flex h-1.5 w-1.5" aria-hidden>
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-iris opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-iris" />
                    </span>
                    {generation.status === 'validating' ? 'Validating' : 'Generating'}
                    <span className="font-mono tabular-nums text-dim">
                      {generation.raw.length.toLocaleString()} chars
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={cancel}
                    className="rounded-xs px-2 py-0.5 text-2xs text-dim transition-colors duration-state hover:text-ink"
                  >
                    Cancel
                  </button>
                </div>
                {partialCode && (
                  <pre className="max-h-48 overflow-auto border-t border-hairline bg-surface px-4 py-3 font-mono text-2xs leading-relaxed text-muted">
                    <code>{partialCode.slice(-1400)}</code>
                  </pre>
                )}
              </div>
            )}

            {/* ── Rate limited ──────────────────────────────────── */}
            {generation.status === 'rate-limited' && (
              <div className="hairline-t flex items-center justify-between px-4 py-3" role="alert">
                <p className="text-2xs text-muted">
                  {generation.error} Try again in{' '}
                  <span className="font-mono tabular-nums text-ink">{generation.retryAfter}s</span>.
                </p>
              </div>
            )}

            {/* ── Error, with the prompt kept so retry is one click ─ */}
            {generation.status === 'error' && (
              <div className="hairline-t flex items-start justify-between gap-4 px-4 py-3" role="alert">
                <p className="min-w-0 flex-1 text-2xs leading-relaxed text-fail">
                  {generation.error}
                </p>
                <button
                  type="button"
                  onClick={() => generation.lastFailedPrompt && generate(generation.lastFailedPrompt)}
                  className="shrink-0 rounded-md px-2.5 py-1 text-2xs font-medium text-iris transition-colors duration-state hover:bg-iris-soft"
                >
                  Retry
                </button>
              </div>
            )}

            {/* ── Idle: examples ────────────────────────────────── */}
            {generation.status === 'idle' && !busy && (
              <div className="hairline-t px-4 py-3">
                <p className="mb-2 text-2xs uppercase tracking-widest text-dim">Try</p>
                <div className="space-y-0.5">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setValue(ex)}
                      className="block w-full truncate rounded-md px-2 py-1.5 text-left text-2xs text-muted transition-colors duration-state hover:bg-surface hover:text-ink"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div
              id="prompt-hint"
              className="hairline-t flex items-center justify-between px-4 py-2 text-2xs text-dim"
            >
              <span className="flex items-center gap-1.5">
                <Kbd keys="enter" /> to generate
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd keys="escape" /> to close
              </span>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
