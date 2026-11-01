'use client'

import { useId, useState } from 'react'
import { useStudio } from '@/lib/store'
import { formatHsl, parseHsl, toCssColor, type ColorKey, type ThemeMode } from '@/lib/tokens/schema'
import { useTokenTransaction } from '@/components/ui/useTokenTransaction'
import { A11yBadge } from '@/components/A11yBadge' // 👈 ADDED

const LABELS: Partial<Record<ColorKey, string>> = {
  background: 'Background',
  foreground: 'Foreground',
  card: 'Card',
  cardForeground: 'Card text',
  primary: 'Primary',
  primaryForeground: 'Primary text',
  secondary: 'Secondary',
  secondaryForeground: 'Secondary text',
  muted: 'Muted',
  mutedForeground: 'Muted text',
  accent: 'Accent',
  accentForeground: 'Accent text',
  destructive: 'Destructive',
  destructiveForeground: 'Destructive text',
  border: 'Border',
  input: 'Input',
  ring: 'Focus ring',
}

// 👇 ADDED: Helper to figure out which background pairs with this text color
function getPairedBgKey(key: ColorKey): ColorKey | null {
  if (key === 'foreground') return 'background'
  if (key.endsWith('Foreground')) {
    return key.replace('Foreground', '') as ColorKey
  }
  return null
}

function Channel({
  label,
  value,
  max,
  unit,
  gradient,
  onChange,
  handlers,
}: {
  label: string
  value: number
  max: number
  unit: string
  gradient: string
  onChange: (n: number) => void
  handlers: Record<string, unknown>
}) {
  const id = useId()
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="w-3 shrink-0 font-mono text-2xs text-dim">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        {...handlers}
        className="h-4 flex-1 cursor-pointer appearance-none rounded-full bg-transparent
                   [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full
                   [&::-webkit-slider-thumb]:mt-[-4px] [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow
                   [&::-webkit-slider-thumb]:ring-1 [&::-webkit-slider-thumb]:ring-black/20
                   [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full
                   [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:border-0
                   [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white"
        style={{ background: gradient }}
      />
      <output htmlFor={id} className="w-9 shrink-0 text-right font-mono text-2xs tabular-nums text-muted">
        {value}
        {unit}
      </output>
    </div>
  )
}

export function HslPicker({ tokenKey, mode }: { tokenKey: ColorKey; mode: ThemeMode }) {
  const value = useStudio((s) => s.tokens.colors[mode][tokenKey])
  
  // 👇 ADDED: Fetch the paired background color from Zustand
  const pairedBgKey = getPairedBgKey(tokenKey)
  const bgValue = useStudio((s) => pairedBgKey ? s.tokens.colors[mode][pairedBgKey] : null)

  const setColor = useStudio((s) => s.setColor)
  const { handlers } = useTokenTransaction()
  const [open, setOpen] = useState(false)

  const { h, s, l } = parseHsl(value)
  const set = (next: { h?: number; s?: number; l?: number }) =>
    setColor(mode, tokenKey, formatHsl(next.h ?? h, next.s ?? s, next.l ?? l))

  return (
    <div className="rounded-md transition-colors duration-state">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left transition-colors duration-state hover:bg-surface"
      >
        <span
          aria-hidden
          className="h-5 w-5 shrink-0 rounded ring-1 ring-inset ring-black/10"
          style={{ background: toCssColor(value) }}
        />
        <span className="min-w-0 flex-1 truncate text-xs text-ink">
          {LABELS[tokenKey] ?? tokenKey}
        </span>
        
        {/* 👇 ADDED: Container to hold the badge and the HSL string */}
        <span className="shrink-0 flex items-center gap-2">
          {bgValue && <A11yBadge textColor={value} bgColor={bgValue} />}
          <span className="font-mono text-2xs tabular-nums text-dim">{value}</span>
        </span>
        
      </button>

      {open && (
        <div className="space-y-1.5 px-1.5 pb-2.5 pt-1">
          <Channel
            label="H"
            value={h}
            max={360}
            unit="°"
            onChange={(n) => set({ h: n })}
            handlers={handlers}
            gradient="linear-gradient(to right, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%))"
          />
          <Channel
            label="S"
            value={s}
            max={100}
            unit="%"
            onChange={(n) => set({ s: n })}
            handlers={handlers}
            gradient={`linear-gradient(to right, hsl(${h} 0% ${l}%), hsl(${h} 100% ${l}%))`}
          />
          <Channel
            label="L"
            value={l}
            max={100}
            unit="%"
            onChange={(n) => set({ l: n })}
            handlers={handlers}
            gradient={`linear-gradient(to right, hsl(${h} ${s}% 0%), hsl(${h} ${s}% 50%), hsl(${h} ${s}% 100%))`}
          />
        </div>
      )}
    </div>
  )
}