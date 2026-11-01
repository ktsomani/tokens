import type { Tokens, ThemeMode } from '@/lib/tokens/schema'

export type StudioComponent = {
  id: string
  name: string
  description: string
  code: string
  a11yNotes: string[]
  prompt: string
  createdAt: number
}

/** The unit of undo, of redo, and of a saved version. One shape for all three. */
export type Snapshot = {
  tokens: Tokens
  components: StudioComponent[]
  activeId: string | null
}

export type Version = {
  id: string
  label: string
  at: number
  kind: 'generation' | 'manual' | 'initial'
  snapshot: Snapshot
}

export type GenerationStatus = 'idle' | 'streaming' | 'validating' | 'error' | 'rate-limited'

export type GenerationState = {
  status: GenerationStatus
  prompt: string
  /** Raw text as it arrives, shown in the code pane. */
  raw: string
  error: string | null
  /** Seconds remaining, for the 429 countdown. */
  retryAfter: number
  lastFailedPrompt: string | null
}

export type Overlay = 'none' | 'prompt' | 'export' | 'help' | 'share'

export type SaveState = {
  status: 'idle' | 'saving' | 'saved' | 'error'
  id: string | null
  url: string | null
  error: string | null
}

export type UiState = {
  theme: ThemeMode
  leftOpen: boolean
  rightOpen: boolean
  overlay: Overlay
}
