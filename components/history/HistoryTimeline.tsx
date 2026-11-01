'use client'

import { useStudio } from '@/lib/store'
import { useMounted } from '@/lib/useMounted'
import { PanelSection, Button } from '@/components/ui/primitives'

function ago(at: number): string {
  if (!at) return 'now'
  const seconds = Math.round((Date.now() - at) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.round(minutes / 60)}h ago`
}

const KIND_LABEL = {
  generation: 'Generated',
  manual: 'Marked',
  initial: 'Start',
} as const

/**
 * Versions are named points you can jump to. They share the Snapshot type with
 * undo/redo, but they are a different idea: undo is linear and ephemeral, a
 * version is a place you meant to be able to come back to. Jumping is itself
 * undoable, so it is never a one-way door.
 */
export function HistoryTimeline() {
  const versions = useStudio((s) => s.versions)
  const jump = useStudio((s) => s.jumpToVersion)
  const mark = useStudio((s) => s.markVersion)
  // `/` is statically prerendered, so a relative time computed during render
  // is baked in at BUILD time and will not match what the browser computes.
  const mounted = useMounted()

  return (
    <PanelSection
      title="Versions"
      action={
        <Button
          onClick={() => mark(`Checkpoint ${new Date().toLocaleTimeString()}`)}
          className="!px-1.5 !py-0.5 text-2xs"
        >
          Mark
        </Button>
      }
    >
      <ol className="space-y-0.5">
        {versions.map((v) => (
          <li key={v.id}>
            <button
              type="button"
              onClick={() => jump(v.id)}
              className="flex w-full items-baseline gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-state hover:bg-surface"
            >
              <span className="min-w-0 flex-1 truncate text-2xs text-ink">{v.label}</span>
              <span className="shrink-0 text-2xs text-dim">{KIND_LABEL[v.kind]}</span>
              <span className="shrink-0 font-mono text-2xs tabular-nums text-dim">
                {mounted ? ago(v.at) : ''}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </PanelSection>
  )
}