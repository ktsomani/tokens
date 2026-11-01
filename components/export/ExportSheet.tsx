'use client'

import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { useStudio } from '@/lib/store'
import {
  toCssFile,
  toTailwindConfig,
  toComponentFile,
  toJsonFile,
} from '@/lib/tokens/serialize'
import { CopyButton } from './CopyButton'

type TabId = 'tailwind' | 'css' | 'component' | 'json'

const TABS: { id: TabId; label: string; filename: string; lang: string }[] = [
  { id: 'tailwind', label: 'Tailwind config', filename: 'tailwind.config.js', lang: 'js' },
  { id: 'css', label: 'CSS variables', filename: 'tokens.css', lang: 'css' },
  { id: 'component', label: 'Component', filename: 'Component.tsx', lang: 'tsx' },
  { id: 'json', label: 'JSON', filename: 'tokens.json', lang: 'json' },
]

export function ExportSheet() {
  const overlay = useStudio((s) => s.ui.overlay)
  const setOverlay = useStudio((s) => s.setOverlay)
  const tokens = useStudio((s) => s.tokens)
  const components = useStudio((s) => s.components)
  const activeId = useStudio((s) => s.activeId)
  const [tab, setTab] = useState<TabId>('tailwind')
  const reduced = useReducedMotion()

  const open = overlay === 'export'
  const active = components.find((c) => c.id === activeId)

  const contents = useMemo<Record<TabId, string>>(
    () => ({
      tailwind: toTailwindConfig(tokens),
      css: toCssFile(tokens),
      component: active
        ? toComponentFile(active.name, active.code)
        : '// No component selected.',
      json: toJsonFile(tokens),
    }),
    [tokens, active],
  )

  const current = TABS.find((t) => t.id === tab)!

  return (
    <AnimatePresence>
      {open && (
        <m.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          <div
            className="absolute inset-0 bg-ink/20 backdrop-blur-[2px]"
            onClick={() => setOverlay('none')}
            aria-hidden
          />
          <m.div
            role="dialog"
            aria-modal="true"
            aria-label="Export"
            className="elevated relative flex h-[76vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-hairline bg-raised"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
          >
            <header className="hairline-b flex shrink-0 items-center justify-between px-3 py-2">
              <div role="tablist" aria-label="Export format" className="flex gap-0.5">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    role="tab"
                    type="button"
                    aria-selected={tab === t.id}
                    onClick={() => setTab(t.id)}
                    className={`rounded-md px-2.5 py-1.5 text-xs transition-colors duration-state ${
                      tab === t.id ? 'bg-iris-soft text-iris' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setOverlay('none')}
                aria-label="Close export"
                className="rounded-xs px-2 py-1 text-xs text-dim transition-colors duration-state hover:text-ink"
              >
                ✕
              </button>
            </header>

            <div className="flex shrink-0 items-center justify-between px-4 py-2">
              <span className="font-mono text-2xs text-dim">{current.filename}</span>
              <CopyButton text={contents[tab]} label={current.label} />
            </div>

            <pre
              role="tabpanel"
              aria-label={current.label}
              tabIndex={0}
              className="min-h-0 flex-1 overflow-auto bg-surface px-4 py-3 font-mono text-2xs leading-relaxed text-ink"
            >
              <code>{contents[tab]}</code>
            </pre>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
