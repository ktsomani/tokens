import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-6">
      <div className="max-w-sm text-center">
        <p className="font-mono text-sm font-semibold text-ink">Tokens</p>
        <h1 className="mt-4 text-lg text-ink">That design is not here</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          The link may be wrong, or the design may have been made private.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md px-3 py-1.5 text-xs font-medium text-iris transition-colors duration-150 hover:bg-iris-soft"
        >
          Open the studio
        </Link>
      </div>
    </main>
  )
}
