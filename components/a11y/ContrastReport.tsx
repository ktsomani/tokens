'use client'

import { useMemo, useState } from 'react'
import { useStudio } from '@/lib/store'
import { auditPalettes, formatRatio, type PairResult } from '@/lib/a11y/contrast'
import { PanelSection } from '@/components/ui/primitives'
import type { ThemeMode } from '@/lib/tokens/schema'

function Row({ result }: { result: PairResult }) {
  const setColor = useStudio((s) => s.setColor)

  const verdict = result.decorative ? 'Exempt' : result.aaa ? 'AAA' : result.aa ? 'AA' : 'Fails AA'
  const tone = result.decorative ? 'text-dim' : result.aa ? 'text-pass' : 'text-fail'

  return (
    <li className="flex items-center gap-2 rounded-md px-1.5 py-1.5">
      {/* A shape difference as well as a colour difference, so the verdict
          is readable without relying on hue. */}
      <span
        aria-hidden
        className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold ${
          result.decorative
            ? 'bg-dim/15 text-dim'
            : result.aa
              ? 'bg-pass/15 text-pass'
              : 'bg-fail/15 text-fail'
        }`}
      >
        {result.decorative ? '·' : result.aa ? '✓' : '!'}
      </span>

      <span className="min-w-0 flex-1 truncate text-2xs text-ink">{result.label}</span>

      <span className="shrink-0 font-mono text-2xs tabular-nums text-muted">
        {formatRatio(result.ratio)}
      </span>
      <span className={`w-12 shrink-0 text-right text-2xs font-medium ${tone}`}>{verdict}</span>

      {result.suggestion && (
        <button
          type="button"
          onClick={() => setColor(result.mode, result.fg, result.suggestion!)}
          title={`Set ${result.fg} to ${result.suggestion}`}
          className="shrink-0 rounded-xs px-1.5 py-0.5 text-2xs text-iris transition-colors duration-state hover:bg-iris-soft"
        >
          Fix
        </button>
      )}
    </li>
  )
}

export function ContrastReport() {
  const colors = useStudio((s) => s.tokens.colors)
  const activeTheme = useStudio((s) => s.ui.theme)
  const [showing, setShowing] = useState<ThemeMode | 'both'>('both')

  // Pure, fast, and recomputed on every token change — microseconds for 22 pairs.
  const audit = useMemo(() => auditPalettes(colors), [colors])

  const rows =
    showing === 'both'
      ? [...audit.light, ...audit.dark]
      : showing === 'light'
        ? audit.light
        : audit.dark

  const failing = rows.filter((r) => !r.aa)
  const passing = rows.filter((r) => r.aa)

  return (
    <PanelSection
      title="Contrast"
      action={
        <div className="flex gap-0.5" role="radiogroup" aria-label="Which theme to audit">
          {(['both', 'light', 'dark'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={showing === opt}
              onClick={() => setShowing(opt)}
              className={`rounded-xs px-1.5 py-0.5 text-2xs capitalize transition-colors duration-state ${
                showing === opt ? 'bg-iris-soft text-iris' : 'text-dim hover:text-ink'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      }
    >
      <p className="mb-2 px-1.5 text-2xs leading-relaxed text-dim">
        {audit.failures === 0 ? (
          <>
            Every pair clears AA in both themes. Decorative edges are reported
            but exempt under WCAG 1.4.11.
          </>
        ) : (
          <>
            <span className="font-medium text-fail">{audit.failures}</span> pair
            {audit.failures === 1 ? '' : 's'} below AA across both themes. A palette that
            passes in {activeTheme} can still fail in the other.
          </>
        )}
      </p>

      {failing.length > 0 && (
        <ul className="mb-2">
          {failing.map((r) => (
            <Row key={`${r.mode}-${r.fg}-${r.bg}`} result={r} />
          ))}
        </ul>
      )}

      <details className="px-1.5">
        <summary className="cursor-pointer text-2xs text-dim transition-colors duration-state hover:text-ink">
          {passing.length} passing
        </summary>
        <ul className="mt-1 -mx-1.5">
          {passing.map((r) => (
            <Row key={`${r.mode}-${r.fg}-${r.bg}`} result={r} />
          ))}
        </ul>
      </details>
    </PanelSection>
  )
}
