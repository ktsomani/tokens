/** Messages the studio sends into the preview frame. */
export type ToSandbox =
  | { type: 'render'; name: string; code: string; nonce: number }
  | { type: 'tokens'; vars: Record<string, string> }
  | { type: 'theme'; mode: 'light' | 'dark' }
  | { type: 'fonts'; sans: string; mono: string }

/** Messages the preview frame sends back. */
export type FromSandbox =
  | { type: 'ready' }
  | { type: 'rendered'; name: string; nonce: number }
  | { type: 'error'; phase: 'compile' | 'runtime'; message: string; nonce: number }
  | { type: 'resize'; height: number }

export const SANDBOX_SRC = '/sandbox.html'

export function isFromSandbox(data: unknown): data is FromSandbox {
  if (typeof data !== 'object' || data === null) return false
  const t = (data as { type?: unknown }).type
  return t === 'ready' || t === 'rendered' || t === 'error' || t === 'resize'
}
