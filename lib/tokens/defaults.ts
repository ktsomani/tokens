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
      background: '60 9% 98%',
      foreground: '0 0% 8%',
      card: '0 0% 100%',
      cardForeground: '0 0% 8%',
      primary: '0 0% 8%',
      primaryForeground: '60 9% 98%',
      secondary: '60 5% 96%',
      secondaryForeground: '0 0% 8%',
      muted: '60 5% 96%',
      mutedForeground: '0 0% 45%',
      accent: '60 5% 96%',
      accentForeground: '0 0% 8%',
      destructive: '0 72% 50%',
      destructiveForeground: '0 0% 98%',
      border: '0 0% 90%',
      input: '0 0% 90%',
      ring: '0 0% 8%',
    },
    dark: {
      background: '0 0% 0%',
      foreground: '46 20% 92%',
      card: '0 0% 3%',
      cardForeground: '46 20% 92%',
      primary: '46 20% 92%',
      primaryForeground: '0 0% 3%',
      secondary: '0 0% 12%',
      secondaryForeground: '46 20% 92%',
      muted: '0 0% 12%',
      mutedForeground: '0 0% 56%',
      accent: '0 0% 15%',
      accentForeground: '46 20% 92%',
      destructive: '0 60% 50%',
      destructiveForeground: '0 0% 100%',
      border: '0 0% 15%',
      input: '0 0% 15%',
      ring: '46 20% 92%',
    },
  },
  radius: 0.375,
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