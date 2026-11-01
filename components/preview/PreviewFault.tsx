'use client'

import type { SandboxFault } from './useSandbox'

/**
 * A bad generation should read as a message, not a blank rectangle.
 * Compile faults come from the guard or Sucrase; runtime faults come from
 * the error boundary inside the frame.
 */
export function PreviewFault({
  fault,
  onDismiss,
}: {
  fault: NonNullable<SandboxFault>
  onDismiss: () => void
}) {
  return (
    <div
      role="alert"
      className="elevated absolute inset-x-4 bottom-4 rounded-lg border border-hairline bg-raised p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-2xs font-medium uppercase tracking-widest text-fail">
            {fault.phase === 'compile' ? 'Could not compile' : 'Threw while rendering'}
          </p>
          <p className="mt-1.5 break-words font-mono text-xs leading-relaxed text-muted">
            {fault.message}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-xs px-2 py-1 text-2xs text-dim transition-colors duration-state hover:text-ink"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
