'use client'

import { useEffect, useRef } from 'react'
import { SHORTCUTS, type ShortcutId } from './registry'

type Handlers = Partial<Record<ShortcutId, (e: KeyboardEvent) => void>>

function matches(e: KeyboardEvent, keys: string): boolean {
  const parts = keys.split('+')
  const key = parts[parts.length - 1]
  const wantMod = parts.includes('mod')
  const wantShift = parts.includes('shift')
  const wantAlt = parts.includes('alt')

  const mod = e.metaKey || e.ctrlKey
  if (wantMod !== mod) return false
  if (wantAlt !== e.altKey) return false

  // "?" already requires Shift on most layouts, so don't double-check it.
  if (key !== '?' && wantShift !== e.shiftKey) return false

  const pressed = e.key.toLowerCase()
  return pressed === key.toLowerCase()
}

/** True when the event came from somewhere the user is typing. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  )
}

/**
 * Global shortcuts, driven by the registry so nothing can be bound here
 * that isn't also documented in the help sheet.
 */
export function useHotkeys(handlers: Handlers, enabled = true) {
  const ref = useRef(handlers)
  ref.current = handlers

  useEffect(() => {
    if (!enabled) return

    function onKeyDown(e: KeyboardEvent) {
      const typing = isTypingTarget(e.target)

      for (const sc of SHORTCUTS) {
        const handler = ref.current[sc.id]
        if (!handler) continue
        if (!matches(e, sc.keys)) continue

        // Single-character shortcuts must never fire mid-typing.
        // Escape is the exception: it should always be able to dismiss.
        const needsModifier = sc.keys.includes('mod')
        if (typing && !needsModifier && sc.id !== 'dismiss') continue

        e.preventDefault()
        handler(e)
        return
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
