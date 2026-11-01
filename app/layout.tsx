import type { Metadata, Viewport } from 'next'
import { Instrument_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'

/* Self-hosted by next/font: no render-blocking request to a font CDN, no
   layout shift, and the studio's own typography is unaffected by whatever
   font pairing the user picks for their design. */
const sans = Instrument_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-instrument-sans',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'Tokens — live design-system studio',
  description:
    'Generate accessible React components, then tune colour, radius, type and spacing live. Every token is a CSS variable, so nothing regenerates.',
  robots: { index: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf9' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0b0c' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
