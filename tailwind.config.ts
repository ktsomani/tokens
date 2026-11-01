import type { Config } from 'tailwindcss'

/**
 * This config styles the STUDIO CHROME only.
 * The user's own design tokens live inside the preview iframe and are
 * compiled there by Tailwind's browser build — see public/sandbox.html.
 */
const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--chrome-ink)',
        paper: 'var(--chrome-paper)',
        surface: 'var(--chrome-surface)',
        raised: 'var(--chrome-raised)',
        hairline: 'var(--chrome-hairline)',
        muted: 'var(--chrome-muted)',
        dim: 'var(--chrome-dim)',
        iris: 'var(--chrome-iris)',
        'iris-soft': 'var(--chrome-iris-soft)',
        pass: 'var(--chrome-pass)',
        warn: 'var(--chrome-warn)',
        fail: 'var(--chrome-fail)',
      },
      fontFamily: {
        sans: ['var(--font-instrument-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
      },
      borderRadius: { xs: '3px' },
      transitionTimingFunction: { studio: 'cubic-bezier(0.2, 0, 0, 1)' },
      transitionDuration: { state: '150ms', layout: '200ms' },
    },
  },
  plugins: [],
}
export default config
