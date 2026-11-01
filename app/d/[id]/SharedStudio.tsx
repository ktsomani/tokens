'use client'

import { useEffect, useRef } from 'react'
import { Shell } from '@/components/shell/Shell'
import { useStudio } from '@/lib/store'
import type { Tokens } from '@/lib/tokens/schema'
import type { StudioComponent } from '@/lib/store/types'

/**
 * Hydrates the store from the shared row before the shell mounts, so the
 * studio never flashes its defaults first.
 */
export function SharedStudio({
  id,
  tokens,
  components,
}: {
  id: string
  tokens: Tokens
  components: StudioComponent[]
}) {
  const hydrate = useStudio((s) => s.hydrate)
  const done = useRef(false)

  if (!done.current) {
    done.current = true
    useStudio.setState({ tokens, components, activeId: components[0]?.id ?? null })
  }

  useEffect(() => {
    hydrate({ tokens, components, id })
  }, [hydrate, tokens, components, id])

  return <Shell />
}
