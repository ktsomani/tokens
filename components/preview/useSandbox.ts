'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { isFromSandbox, type FromSandbox, type ToSandbox } from '@/lib/sandbox/protocol'

export type SandboxFault = { phase: 'compile' | 'runtime'; message: string } | null

export function useSandbox(onFault: (fault: SandboxFault) => void) {
  const frameRef = useRef<HTMLIFrameElement | null>(null)
  const [ready, setReady] = useState(false)
  const queue = useRef<ToSandbox[]>([])
  const faultRef = useRef(onFault)
  faultRef.current = onFault

  const post = useCallback(
    (msg: ToSandbox) => {
      const win = frameRef.current?.contentWindow
      if (!ready || !win) {
        queue.current.push(msg)
        return
      }
      win.postMessage(msg, '*')
    },
    [ready],
  )

  useEffect(() => {
    let isReady = false

    function onMessage(event: MessageEvent) {
      if (event.source !== frameRef.current?.contentWindow) return
      if (!isFromSandbox(event.data)) return

      const msg = event.data as FromSandbox
      switch (msg.type) {
        case 'ready':
          isReady = true
          setReady(true)
          break
        case 'rendered':
          faultRef.current(null)
          break
        case 'error':
          faultRef.current({ phase: msg.phase, message: msg.message })
          break
      }
    }

    window.addEventListener('message', onMessage)

    const frame = frameRef.current
    const ping = () => {
      if (!isReady) {
        frame?.contentWindow?.postMessage({ type: 'ping' }, '*')
      }
    }

    // Ping immediately in case the iframe finished loading before useEffect ran
    ping()
    frame?.addEventListener('load', ping)

    // Fallback: if still not ready after 250ms, reload the iframe src while listener is active
    const retryTimer = setTimeout(() => {
      if (!isReady && frame) {
        frame.src = '/sandbox.html'
      }
    }, 250)

    return () => {
      clearTimeout(retryTimer)
      window.removeEventListener('message', onMessage)
      frame?.removeEventListener('load', ping)
    }
  }, [])

  // Flush anything that piled up before boot.
  useEffect(() => {
    if (!ready) return
    const win = frameRef.current?.contentWindow
    if (!win) return
    for (const msg of queue.current) win.postMessage(msg, '*')
    queue.current = []
  }, [ready])

  return { frameRef, ready, post }
}