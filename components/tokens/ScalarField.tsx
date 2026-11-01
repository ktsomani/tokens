'use client'

import { useId } from 'react'
import { useStudio } from '@/lib/store'
import { useTokenTransaction } from '@/components/ui/useTokenTransaction'

type ScalarKey = 'radius' | 'typeScale' | 'baseFontSize' | 'spacingBase'

const SPEC: Record<ScalarKey, { label: string; min: number; max: number; step: number; unit: string; hint: string }> = {
  radius: { label: 'Radius', min: 0, max: 2, step: 0.0625, unit: 'rem', hint: 'Corner rounding' },
  typeScale: { label: 'Type scale', min: 1.05, max: 1.75, step: 0.01, unit: '', hint: 'Ratio between steps' },
  baseFontSize: { label: 'Base size', min: 12, max: 20, step: 1, unit: 'px', hint: 'Body text' },
  spacingBase: { label: 'Spacing unit', min: 2, max: 8, step: 1, unit: 'px', hint: 'All spacing derives from this' },
}

export function ScalarField({ tokenKey }: { tokenKey: ScalarKey }) {
  const value = useStudio((s) => s.tokens[tokenKey])
  const setScalar = useStudio((s) => s.setScalar)
  const { handlers } = useTokenTransaction()
  const id = useId()
  const spec = SPEC[tokenKey]

  return (
    <div className="px-1.5 py-2">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs text-ink">
          {spec.label}
        </label>
        <output htmlFor={id} className="font-mono text-2xs tabular-nums text-muted">
          {spec.step < 1 ? value.toFixed(spec.step < 0.05 ? 3 : 2) : value}
          {spec.unit}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={spec.min}
        max={spec.max}
        step={spec.step}
        value={value}
        aria-describedby={`${id}-hint`}
        onChange={(e) => setScalar(tokenKey, Number(e.target.value))}
        {...handlers}
        className="h-4 w-full cursor-pointer appearance-none bg-transparent
                   [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full
                   [&::-webkit-slider-runnable-track]:bg-hairline
                   [&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-ink
                   [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-hairline
                   [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:border-0
                   [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-ink"
      />
      <p id={`${id}-hint`} className="mt-1 text-2xs text-dim">
        {spec.hint}
      </p>
    </div>
  )
}
