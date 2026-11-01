'use client'

export const WIDTHS = {
  full: '100%',
  lg: '1024px',
  md: '768px',
  sm: '390px',
} as const

export type WidthPreset = keyof typeof WIDTHS

const LABELS: Record<WidthPreset, string> = {
  full: 'Fill',
  lg: '1024',
  md: '768',
  sm: '390',
}

export function WidthPicker({
  value,
  onChange,
}: {
  value: WidthPreset
  onChange: (v: WidthPreset) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Preview width"
      className="flex items-center gap-0.5 rounded-md bg-surface p-0.5 ring-1 ring-hairline"
    >
      {(Object.keys(WIDTHS) as WidthPreset[]).map((key) => {
        const selected = key === value
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(key)}
            className={[
              'rounded-xs px-2 py-1 font-mono text-2xs tabular-nums transition-colors duration-state',
              selected ? 'bg-iris-soft text-iris' : 'text-dim hover:text-ink',
            ].join(' ')}
          >
            {LABELS[key]}
          </button>
        )
      })}
    </div>
  )
}
