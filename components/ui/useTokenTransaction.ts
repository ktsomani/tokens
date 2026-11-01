'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useStudio } from '@/lib/store'

/**
 * Groups a continuous edit into one undo step.
 *
 * Without this, dragging a hue slider pushes a history entry per animation
 * frame and undo becomes useless. A transaction opens on pointer-down or the
 * first key press and closes on pointer-up, blur, or a pause in typing.
 */
export function useTokenTransaction() {
  const begin = useStudio((s) => s.beginTransaction)
  const commit = useStudio((s) => s.commitTransaction)
  const open = useRef(false)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const start = useCallback(() => {
    if (open.current) return
    open.current = true
    begin()
  }, [begin])

  const end = useCallback(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current)
      idleTimer.current = null
    }
    if (!open.current) return
    open.current = false
    commit()
  }, [commit])

  /** For keyboard nudges, which have no natural "up" event to close on. */
  const touch = useCallback(() => {
    start()
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(end, 400)
  }, [start, end])

  // A transaction left open when the control unmounts would swallow the step.
  useEffect(() => () => void (open.current && commit()), [commit])

  return {
    /** Spread onto a slider or colour input. */
    handlers: {
      onPointerDown: start,
      onPointerUp: end,
      onKeyDown: touch,
      onBlur: end,
    },
    start,
    end,
  }
}
