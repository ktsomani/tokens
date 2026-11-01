'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useStudio } from '@/lib/store'
import { toCssVars } from '@/lib/tokens/serialize'
import { guardComponentCode } from '@/lib/sandbox/guard'
import { SANDBOX_SRC } from '@/lib/sandbox/protocol'
import { useSandbox, type SandboxFault } from './useSandbox'
import { PreviewFault } from './PreviewFault'
import { WidthPicker, type WidthPreset, WIDTHS } from './WidthPicker'

export function PreviewFrame() {
  const tokens = useStudio((s) => s.tokens)
  const theme = useStudio((s) => s.ui.theme)
  const components = useStudio((s) => s.components)
  const activeId = useStudio((s) => s.activeId)
  const streaming = useStudio((s) => s.generation.status === 'streaming')

  const active = useMemo(
    () => components.find((c) => c.id === activeId) ?? null,
    [components, activeId],
  )

  const [fault, setFault] = useState<SandboxFault>(null)
  const [stalled, setStalled] = useState(false)
  const [width, setWidth] = useState<WidthPreset>('full')
  const [mounted, setMounted] = useState(false)
  const { frameRef, ready, post } = useSandbox(setFault)

  // Keep the 600 KB of iframe runtime off the critical path. The studio chrome
  // paints first; the frame boots once the browser is idle.
  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
    }
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(() => setMounted(true), { timeout: 1200 })
      return () => window.cancelIdleCallback?.(id)
    }
    const t = setTimeout(() => setMounted(true), 200)
    return () => clearTimeout(t)
  }, [])

  // ── Token channel. Fires on every slider tick; costs one setProperty each. ──
  const vars = useMemo(() => toCssVars(tokens, theme), [tokens, theme])
  useEffect(() => {
    post({ type: 'tokens', vars })
  }, [vars, post])

  useEffect(() => {
    post({ type: 'theme', mode: theme })
  }, [theme, post])

  useEffect(() => {
    post({ type: 'fonts', sans: tokens.fontFamily.sans, mono: tokens.fontFamily.mono })
  }, [tokens.fontFamily.sans, tokens.fontFamily.mono, post])

  // ── Code channel. Only fires when the component itself changes. ──
  const nonce = useRef(0)
  useEffect(() => {
    if (!active) return
    const verdict = guardComponentCode(active.name, active.code)
    if (!verdict.ok) {
      setFault({ phase: 'compile', message: verdict.reason })
      return
    }
    nonce.current += 1
    post({ type: 'render', name: active.name, code: active.code, nonce: nonce.current })
  }, [active?.id, active?.code, active?.name, post]) // eslint-disable-line react-hooks/exhaustive-deps

  /* If the frame never reports `ready`, the browser's own broken-page icon
     is all the user gets, and it looks identical whether the server died or
     the document was refused. Say what to check instead. */
  useEffect(() => {
    if (!mounted || ready) return
    const t = setTimeout(() => setStalled(true), 6000)
    return () => clearTimeout(t)
  }, [mounted, ready])

  useEffect(() => {
    if (ready) setStalled(false)
  }, [ready])

  const frameWidth = WIDTHS[width]

  return (
    <section
      className="relative flex min-h-0 flex-1 flex-col bg-paper"
      aria-label="Live preview"
    >
      <header className="hairline-b flex h-11 shrink-0 items-center justify-between px-4">
        <div className="flex items-center gap-2 text-2xs font-medium uppercase tracking-widest text-dim">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full transition-colors duration-state"
            style={{
              background: streaming
                ? 'var(--chrome-iris)'
                : ready
                  ? 'var(--chrome-pass)'
                  : 'var(--chrome-dim)',
            }}
          />
          <span>{active?.name ?? 'No component'}</span>
        </div>
        <WidthPicker value={width} onChange={setWidth} />
      </header>

      <div className="stage-grid relative min-h-0 flex-1 overflow-auto p-6">
        <div
          className="mx-auto h-full transition-[max-width] duration-layout ease-studio"
          style={{ maxWidth: frameWidth }}
        >
          {mounted ? (
            <iframe
              ref={frameRef}
              src={SANDBOX_SRC}
              title={`Live preview of ${active?.name ?? 'component'}`}
              /* No allow-same-origin: the frame gets an opaque origin and cannot
                 reach the studio's DOM, cookies or storage. allow-forms lets
                 generated form components behave normally inside the frame;
                 form-action 'none' in the CSP stops submissions going anywhere. */
              sandbox="allow-scripts allow-forms"
              className="h-full min-h-[360px] w-full rounded-lg border border-hairline bg-white shadow-sm"
              style={{ colorScheme: theme }}
            />
          ) : (
            <div
              className="h-full min-h-[360px] w-full animate-pulse rounded-lg border border-hairline bg-surface"
              aria-hidden
            />
          )}
        </div>
      </div>

      {stalled && !ready && (
        <div
          role="alert"
          className="elevated absolute inset-x-4 bottom-4 rounded-lg border border-hairline bg-raised p-4"
        >
          <p className="text-2xs font-medium uppercase tracking-widest text-fail">
            Preview did not start
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            The preview document never loaded. Check that the dev server is still
            running, then open{' '}
            <code className="font-mono text-ink">/sandbox.html</code> directly in a
            tab to see the real error.
          </p>
          <p className="mt-1.5 text-2xs text-dim">
            If that page loads on its own but not here, a response header is blocking
            the embed.
          </p>
        </div>
      )}

      {fault && <PreviewFault fault={fault} onDismiss={() => setFault(null)} />}
    </section>
  )
}