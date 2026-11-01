'use client'

import { useEffect, useState } from 'react'
import { LiveRegion } from '@/components/ui/primitives'

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    if (state === 'idle') return
    const t = setTimeout(() => setState('idle'), 1800)
    return () => clearTimeout(t)
  }, [state])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setState('copied')
    } catch {
      // Clipboard access can be denied outright; say so rather than
      // showing a success state that did not happen.
      setState('failed')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className="rounded-md px-2.5 py-1 text-2xs font-medium text-iris transition-colors duration-state hover:bg-iris-soft"
      >
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy'}
      </button>
      <LiveRegion
        message={
          state === 'copied'
            ? `${label} copied to clipboard`
            : state === 'failed'
              ? 'Copy failed — select the text and copy manually'
              : ''
        }
      />
    </>
  )
}
