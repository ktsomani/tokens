import { z } from 'zod'

/**
 * Colours are stored as bare "H S% L%" triplets, never "hsl(...)".
 * That is what lets Tailwind's `<alpha-value>` syntax work
 * (`hsl(var(--primary) / <alpha-value>)`) and what the HSL pickers edit
 * directly, with no parsing round-trip.
 */
export const HSL_TRIPLET = /^\d{1,3} \d{1,3}% \d{1,3}%$/

export const COLOR_KEYS = [
  'background',
  'foreground',
  'card',
  'cardForeground',
  'primary',
  'primaryForeground',
  'secondary',
  'secondaryForeground',
  'muted',
  'mutedForeground',
  'accent',
  'accentForeground',
  'destructive',
  'destructiveForeground',
  'border',
  'input',
  'ring',
] as const

export type ColorKey = (typeof COLOR_KEYS)[number]

/** Human labels for the token panel, in panel order. */
export const COLOR_GROUPS: { label: string; keys: ColorKey[] }[] = [
  { label: 'Surface', keys: ['background', 'foreground', 'card', 'cardForeground'] },
  { label: 'Brand', keys: ['primary', 'primaryForeground', 'accent', 'accentForeground'] },
  { label: 'Support', keys: ['secondary', 'secondaryForeground', 'muted', 'mutedForeground'] },
  { label: 'Signal', keys: ['destructive', 'destructiveForeground'] },
  { label: 'Edges', keys: ['border', 'input', 'ring'] },
]

const hsl = z.string().regex(HSL_TRIPLET, 'Expected "H S% L%", e.g. "240 6% 10%"')

export const PaletteSchema = z.object(
  Object.fromEntries(COLOR_KEYS.map((k) => [k, hsl])) as Record<ColorKey, typeof hsl>,
)

export const FontPairSchema = z.object({
  sans: z.string().min(1).max(60),
  mono: z.string().min(1).max(60),
})

/**
 * Both themes are first-class. The usual failure in a generated palette is
 * one that passes contrast in light and quietly fails in dark, so dark is
 * never derived — it is authored and checked alongside light.
 */
export const TokensSchema = z.object({
  colors: z.object({ light: PaletteSchema, dark: PaletteSchema }),
  radius: z.number().min(0).max(2),
  typeScale: z.number().min(1.05).max(1.75),
  baseFontSize: z.number().min(12).max(20),
  spacingBase: z.number().min(2).max(8),
  fontFamily: FontPairSchema,
})

export type Palette = z.infer<typeof PaletteSchema>
export type Tokens = z.infer<typeof TokensSchema>
export type ThemeMode = 'light' | 'dark'

/** Parse "H S% L%" into numbers for the pickers. */
export function parseHsl(triplet: string): { h: number; s: number; l: number } {
  const m = triplet.match(/^(\d{1,3}) (\d{1,3})% (\d{1,3})%$/)
  if (!m) return { h: 0, s: 0, l: 0 }
  return { h: +m[1], s: +m[2], l: +m[3] }
}

export function formatHsl(h: number, s: number, l: number): string {
  const clamp = (n: number, max: number) => Math.max(0, Math.min(max, Math.round(n)))
  return `${clamp(h, 360)} ${clamp(s, 100)}% ${clamp(l, 100)}%`
}

/** For rendering swatches in the studio chrome. */
export function toCssColor(triplet: string): string {
  return `hsl(${triplet})`
}
