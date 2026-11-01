import type { ColorKey } from './schema'

export type ThemePreset = {
  name: string
  colors: Record<ColorKey, string>
}

export const PRESETS: ThemePreset[] = [
  {
    name: 'Default (Iris)',
    colors: {
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
      accentForeground: '243 58% 30%',
      destructive: '0 72% 46%',
      destructiveForeground: '0 0% 100%',
      border: '240 6% 90%',
      input: '240 6% 90%',
      ring: '243 61% 60%',
    },
  },
  {
    name: 'Cyberpunk',
    colors: {
      background: '260 20% 8%',
      foreground: '260 10% 95%',
      card: '260 20% 12%',
      cardForeground: '260 10% 95%',
      primary: '320 100% 60%', // Hot Pink
      primaryForeground: '0 0% 100%',
      secondary: '260 20% 20%',
      secondaryForeground: '260 10% 95%',
      muted: '260 20% 15%',
      mutedForeground: '260 10% 60%',
      accent: '190 100% 50%', // Cyan
      accentForeground: '260 20% 8%',
      destructive: '0 100% 60%',
      destructiveForeground: '0 0% 100%',
      border: '260 20% 20%',
      input: '260 20% 20%',
      ring: '320 100% 60%',
    },
  },
  {
    name: 'Forest',
    colors: {
      background: '140 20% 98%',
      foreground: '140 40% 10%',
      card: '0 0% 100%',
      cardForeground: '140 40% 10%',
      primary: '150 60% 30%', // Deep Green
      primaryForeground: '0 0% 100%',
      secondary: '140 20% 90%',
      secondaryForeground: '140 40% 20%',
      muted: '140 20% 90%',
      mutedForeground: '140 10% 40%',
      accent: '45 90% 50%', // Earthy Yellow
      accentForeground: '140 40% 10%',
      destructive: '0 70% 50%',
      destructiveForeground: '0 0% 100%',
      border: '140 20% 85%',
      input: '140 20% 85%',
      ring: '150 60% 30%',
    },
  },
]