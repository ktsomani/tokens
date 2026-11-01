'use client'

import { useEffect, useState } from 'react'

/**
 * False during server render AND during the client's first render, true
 * afterwards.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}