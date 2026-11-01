'use client'

import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import { useStudio } from '@/lib/store'
import { GROUPS, SHORTCUTS } from '@/lib/keys/registry'
import { Kbd } from '@/components/ui/primitives'

/** Rendered straight from the registry, so it cannot drift from the real bindings. */
export function HelpSheet() {
  const overlay = useStudio((s) => s.ui.overlay)
  const setOverlay = useStudio((s) => s.setOverlay)
  const reduced = useReducedMotion()
  const open = overlay === 'help'

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
            aria-label="Keyboard shortcuts"
            className="elevated relative w-full max-w-md overflow-hidden rounded-xl border border-hairline bg-raised p-5"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
          >
            <h2 className="mb-4 text-sm font-medium text-ink">Keyboard</h2>
            <div className="space-y-4">
              {GROUPS.map((group) => (
                <div key={group}>
                  <p className="mb-1.5 text-2xs uppercase tracking-widest text-dim">{group}</p>
                  <ul className="space-y-1">
                    {SHORTCUTS.filter((s) => s.group === group).map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted">{s.label}</span>
                        <Kbd keys={s.keys} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
