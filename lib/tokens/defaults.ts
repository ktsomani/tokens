import type { Tokens } from './schema'

export const FONT_OPTIONS = [
  { sans: 'Inter', mono: 'JetBrains Mono', note: 'Neutral, dependable' },
  { sans: 'Instrument Sans', mono: 'JetBrains Mono', note: 'Warm geometric' },
  { sans: 'Geist', mono: 'Geist Mono', note: 'Tight and modern' },
  { sans: 'Space Grotesk', mono: 'Space Mono', note: 'Quirky, technical' },
  { sans: 'Bricolage Grotesque', mono: 'IBM Plex Mono', note: 'Editorial, loud' },
  { sans: 'Source Serif 4', mono: 'IBM Plex Mono', note: 'Serif, literary' },
  { sans: 'DM Sans', mono: 'DM Mono', note: 'Soft, friendly' },
] as const

export const DEFAULT_TOKENS: Tokens = {
  colors: {
    light: {
      background: '0 0% 100%',
      foreground: '240 10% 4%',
      card: '0 0% 100%',
      cardForeground: '240 10% 4%',
      primary: '243 61% 60%',
      primaryForeground: '0 0% 100%',
      secondary: '240 5% 96%',
      secondaryForeground: '240 6% 10%',
      muted: '240 5% 96%',
      mutedForeground: '240 4% 40%',
      accent: '243 61% 95%',
      accentForeground: '243 50% 30%',
      destructive: '0 72% 46%',
      destructiveForeground: '0 0% 100%',
      border: '240 6% 90%',
      input: '240 6% 55%',
      ring: '243 61% 60%',
    },
    dark: {
      background: '240 10% 4%',
      foreground: '0 0% 98%',
      card: '240 7% 8%',
      cardForeground: '0 0% 98%',
      primary: '243 75% 72%',
      primaryForeground: '243 40% 12%',
      secondary: '240 4% 16%',
      secondaryForeground: '0 0% 98%',
      muted: '240 4% 16%',
      mutedForeground: '240 5% 68%',
      accent: '243 30% 20%',
      accentForeground: '243 70% 88%',
      destructive: '0 72% 62%',
      destructiveForeground: '0 0% 10%',
      border: '240 4% 18%',
      input: '240 5% 42%',
      ring: '243 75% 72%',
    },
  },
  radius: 0.5,
  typeScale: 1.25,
  baseFontSize: 16,
  spacingBase: 4,
  fontFamily: { sans: 'Inter', mono: 'JetBrains Mono' },
}

/** A blank canvas to start with. */
export const WELCOME_COMPONENT = {
  name: 'Canvas',
  description: 'Empty canvas ready for your components.',
  code: `function Canvas() {
  return (
    <div className="flex min-h-[500px] h-full w-full items-center justify-center">
      {/* Your canvas is empty. Ready for new components. */}
    </div>
  )
}`,
  a11yNotes: [],
}