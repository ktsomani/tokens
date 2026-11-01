'use client'

import { forwardRef, type ReactNode } from 'react'
import { isApple, renderKeys } from '@/lib/keys/registry'
import { useMounted } from '@/lib/useMounted'

export function Kbd({ keys }: { keys: string }) {
  // The server has no `navigator`, so it always renders the PC glyphs.
  // Match that on the first client render, then correct it on a Mac.
  const mounted = useMounted()
  const parts = renderKeys(keys, mounted && isApple())
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {parts.map((p, i) => (
        <kbd
          key={i}
          className="rounded-xs bg-surface px-1.5 py-0.5 font-mono text-2xs text-dim ring-1 ring-hairline"
        >
          {p}
        </kbd>
      ))}
    </span>
  )
}

export function PanelSection({
  title,
  children,
  action,
}: {
  title: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section className="px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-2xs font-medium uppercase tracking-widest text-dim">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'ghost' | 'solid' | 'outline'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'ghost', className = '', ...props },
  ref,
) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors duration-state ease-studio disabled:pointer-events-none disabled:opacity-40'
  const variants = {
    ghost: 'px-2.5 py-1.5 text-muted hover:bg-surface hover:text-ink',
    solid: 'px-3 py-1.5 bg-ink text-paper hover:opacity-90',
    outline: 'px-3 py-1.5 text-ink ring-1 ring-hairline hover:bg-surface',
  }
  return <button ref={ref} className={`${base} ${variants[variant]} ${className}`} {...props} />
})

export function Divider() {
  return <div className="h-px w-full bg-hairline" role="presentation" />
}

/** Screen-reader-only live region, for announcing async outcomes. */
export function LiveRegion({ message }: { message: string }) {
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  )
}