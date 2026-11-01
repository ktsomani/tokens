'use client'

import { useStudio } from '@/lib/store'
import { FONT_OPTIONS } from '@/lib/tokens/defaults'

export function FontPairing() {
  const current = useStudio((s) => s.tokens.fontFamily)
  const setFontPair = useStudio((s) => s.setFontPair)

  return (
    <div role="radiogroup" aria-label="Font pairing" className="space-y-0.5">
      {FONT_OPTIONS.map((option) => {
        const selected = option.sans === current.sans && option.mono === current.mono
        return (
          <button
            key={option.sans}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setFontPair(option.sans, option.mono)}
            className={[
              'flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left transition-colors duration-state',
              selected ? 'bg-iris-soft' : 'hover:bg-surface',
            ].join(' ')}
          >
            <span className="min-w-0">
              <span
                className={`block truncate text-xs ${selected ? 'text-iris' : 'text-ink'}`}
              >
                {option.sans}
              </span>
              <span className="block truncate text-2xs text-dim">
                {option.note} · {option.mono}
              </span>
            </span>
            {/* State is never carried by colour alone. */}
            {selected && (
              <span className="shrink-0 text-2xs font-medium text-iris" aria-hidden>
                In use
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
