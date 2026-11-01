import { formatHsl, parseHsl, type ColorKey, type Palette, type ThemeMode } from '@/lib/tokens/schema'

/* ── Colour maths ──────────────────────────────────────────────── */

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const S = s / 100
  const L = l / 100
  const c = (1 - Math.abs(2 * L - 1)) * S
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let rgb: [number, number, number]
  if (hp < 1) rgb = [c, x, 0]
  else if (hp < 2) rgb = [x, c, 0]
  else if (hp < 3) rgb = [0, c, x]
  else if (hp < 4) rgb = [0, x, c]
  else if (hp < 5) rgb = [x, 0, c]
  else rgb = [c, 0, x]
  const m = L - c / 2
  return [rgb[0] + m, rgb[1] + m, rgb[2] + m]
}

/** WCAG 2.1 relative luminance. */
function luminance(triplet: string): number {
  const { h, s, l } = parseHsl(triplet)
  const [r, g, b] = hslToRgb(h, s, l).map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4),
  )
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/* ── The pairs that actually matter ────────────────────────────── */

export type PairKind = 'body' | 'large' | 'ui' | 'decorative'

/**
 * WCAG 1.4.11 asks for 3:1 on boundaries that are needed to *identify* a
 * control — an input's edge, a focus ring. A purely decorative divider or
 * card edge is explicitly exempt, and holding it to 3:1 would force every
 * design system to draw heavy grey rules. Decorative pairs are reported with
 * their ratio but never counted as failures.
 */
export const AA_THRESHOLD: Record<PairKind, number> = {
  body: 4.5,
  large: 3,
  ui: 3,
  decorative: 0,
}
export const AAA_THRESHOLD: Record<PairKind, number> = {
  body: 7,
  large: 4.5,
  ui: 4.5,
  decorative: 0,
}

type PairSpec = { fg: ColorKey; bg: ColorKey; kind: PairKind; label: string }

export const PAIRS: PairSpec[] = [
  { fg: 'foreground', bg: 'background', kind: 'body', label: 'Body text on page' },
  { fg: 'mutedForeground', bg: 'background', kind: 'body', label: 'Secondary text on page' },
  { fg: 'mutedForeground', bg: 'muted', kind: 'body', label: 'Secondary text on muted' },
  { fg: 'cardForeground', bg: 'card', kind: 'body', label: 'Text on card' },
  { fg: 'primaryForeground', bg: 'primary', kind: 'body', label: 'Label on primary button' },
  { fg: 'secondaryForeground', bg: 'secondary', kind: 'body', label: 'Label on secondary button' },
  { fg: 'accentForeground', bg: 'accent', kind: 'body', label: 'Text on accent' },
  { fg: 'destructiveForeground', bg: 'destructive', kind: 'body', label: 'Label on destructive' },
  { fg: 'primary', bg: 'background', kind: 'large', label: 'Primary as text' },
  // Decorative: a card edge or divider does not identify a control.
  { fg: 'border', bg: 'background', kind: 'decorative', label: 'Border against page' },
  // These two do identify controls, so they are held to 1.4.11's 3:1.
  { fg: 'input', bg: 'background', kind: 'ui', label: 'Input boundary against page' },
  { fg: 'ring', bg: 'background', kind: 'ui', label: 'Focus ring against page' },
]

export type PairResult = PairSpec & {
  mode: ThemeMode
  ratio: number
  aa: boolean
  aaa: boolean
  /** Reported for information; exempt from the pass/fail count. */
  decorative: boolean
  /** A lightness-only correction that would pass AA, or null if it already does. */
  suggestion: string | null
}

/**
 * Nudges the foreground's lightness toward whichever end helps, stopping at
 * the first value that clears AA. Hue and saturation are left alone, so the
 * fix keeps the palette's character rather than flattening it to black.
 */
function suggestFix(fg: string, bg: string, target: number): string | null {
  const { h, s, l } = parseHsl(fg)
  const bgLum = luminance(bg)
  const direction = bgLum > 0.5 ? -1 : 1

  for (let step = 1; step <= 100; step++) {
    const next = l + direction * step
    if (next < 0 || next > 100) break
    const candidate = formatHsl(h, s, next)
    if (contrastRatio(candidate, bg) >= target) return candidate
  }
  // Nothing in that direction worked — try the other way before giving up.
  for (let step = 1; step <= 100; step++) {
    const next = l - direction * step
    if (next < 0 || next > 100) break
    const candidate = formatHsl(h, s, next)
    if (contrastRatio(candidate, bg) >= target) return candidate
  }
  return null
}

function evaluate(palette: Palette, mode: ThemeMode): PairResult[] {
  return PAIRS.map((pair) => {
    const fg = palette[pair.fg]
    const bg = palette[pair.bg]
    const ratio = contrastRatio(fg, bg)
    const decorative = pair.kind === 'decorative'
    const aa = decorative || ratio >= AA_THRESHOLD[pair.kind]
    return {
      ...pair,
      mode,
      ratio,
      aa,
      aaa: !decorative && ratio >= AAA_THRESHOLD[pair.kind],
      decorative,
      suggestion: aa ? null : suggestFix(fg, bg, AA_THRESHOLD[pair.kind]),
    }
  })
}

/**
 * Both themes, always, in one pass. The usual failure in a generated palette
 * is one that passes in light and quietly fails in dark, which you never see
 * if you only audit the theme you happen to be looking at.
 */
export function auditPalettes(colors: { light: Palette; dark: Palette }): {
  light: PairResult[]
  dark: PairResult[]
  failures: number
} {
  const light = evaluate(colors.light, 'light')
  const dark = evaluate(colors.dark, 'dark')
  return {
    light,
    dark,
    failures: [...light, ...dark].filter((r) => !r.aa).length,
  }
}

export function formatRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`
}
