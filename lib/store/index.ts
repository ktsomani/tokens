'use client'

import { create } from 'zustand'
import { DEFAULT_TOKENS, WELCOME_COMPONENT } from '@/lib/tokens/defaults'
import type { ColorKey, ThemeMode, Tokens } from '@/lib/tokens/schema'
import type {
  GenerationState,
  Overlay,
  SaveState,
  Snapshot,
  StudioComponent,
  UiState,
  Version,
} from './types'

const HISTORY_LIMIT = 50

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

/* The initial state is built at module scope, which runs once during the
   prerender and again in the browser. Anything random or time-based there
   differs between the two and breaks hydration, so the starting ids are
   fixed and the timestamps are stamped on the client by initSession(). */
const WELCOME_ID = 'welcome'
const INITIAL_VERSION_ID = 'session-start'

function initialComponent(): StudioComponent {
  return {
    id: WELCOME_ID,
    name: WELCOME_COMPONENT.name,
    description: WELCOME_COMPONENT.description,
    code: WELCOME_COMPONENT.code,
    a11yNotes: [...WELCOME_COMPONENT.a11yNotes],
    prompt: '',
    createdAt: 0,
  }
}

function sameSnapshot(a: Snapshot, b: Snapshot): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

type StudioState = {
  // ── present ─────────────────────────────────────────────
  tokens: Tokens
  components: StudioComponent[]
  activeId: string | null

  // ── history ─────────────────────────────────────────────
  past: Snapshot[]
  future: Snapshot[]
  versions: Version[]
  /** Open transaction: set on pointer-down, resolved on pointer-up. */
  txSnapshot: Snapshot | null
  txDepth: number

  // ── session ─────────────────────────────────────────────
  ui: UiState
  generation: GenerationState
  save: SaveState
  /** Returned once on create; lets this browser edit the design in place. */
  editToken: string | null

  // ── actions ─────────────────────────────────────────────
  snapshot: () => Snapshot
  restore: (s: Snapshot) => void

  beginTransaction: () => void
  commitTransaction: () => void
  abortTransaction: () => void

  setColor: (mode: ThemeMode, key: ColorKey, value: string) => void
  setScalar: <K extends 'radius' | 'typeScale' | 'baseFontSize' | 'spacingBase'>(
    key: K,
    value: Tokens[K],
  ) => void
  setFontPair: (sans: string, mono: string) => void
  replaceTokens: (tokens: Tokens, label?: string) => void

  addComponent: (c: Omit<StudioComponent, 'id' | 'createdAt'>, tokens?: Tokens) => string
  selectComponent: (id: string) => void
  removeComponent: (id: string) => void

  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  markVersion: (label: string) => void
  jumpToVersion: (id: string) => void

  setTheme: (t: ThemeMode) => void
  toggleTheme: () => void
  setOverlay: (o: Overlay) => void
  togglePanel: (side: 'left' | 'right') => void

  /** Stamps the client's real clock onto the module-scope initial state. */
  initSession: () => void
  setGeneration: (patch: Partial<GenerationState>) => void
  resetGeneration: () => void
  setSave: (patch: Partial<SaveState>) => void
  setEditToken: (t: string | null) => void

  hydrate: (payload: {
    tokens: Tokens
    components: StudioComponent[]
    editToken?: string | null
    id?: string | null
  }) => void
}

export const useStudio = create<StudioState>((set, get) => {
  /** Push the current state onto the undo stack, then apply `mutate`. */
  function commit(mutate: () => void) {
    const before = get().snapshot()
    mutate()
    const after = get().snapshot()
    if (sameSnapshot(before, after)) return
    set((s) => ({
      past: [...s.past, before].slice(-HISTORY_LIMIT),
      future: [],
    }))
  }

  /**
   * Inside an open transaction we mutate `present` only. The single undo
   * entry is pushed once, when the transaction commits. Outside one, each
   * call is its own undo step.
   */
  function edit(mutate: () => void) {
    if (get().txDepth > 0) {
      mutate()
      return
    }
    commit(mutate)
  }

  const first = initialComponent()
  const initialSnapshot: Snapshot = {
    tokens: DEFAULT_TOKENS,
    components: [first],
    activeId: first.id,
  }

  return {
    tokens: DEFAULT_TOKENS,
    components: [first],
    activeId: first.id,

    past: [],
    future: [],
    versions: [
      {
        id: INITIAL_VERSION_ID,
        label: 'Starting point',
        at: 0,
        kind: 'initial',
        snapshot: initialSnapshot,
      },
    ],
    txSnapshot: null,
    txDepth: 0,

    ui: { theme: 'light', leftOpen: true, rightOpen: true, overlay: 'none' },
    generation: {
      status: 'idle',
      prompt: '',
      raw: '',
      error: null,
      retryAfter: 0,
      lastFailedPrompt: null,
    },
    save: { status: 'idle', id: null, url: null, error: null },
    editToken: null,

    snapshot: () => {
      const { tokens, components, activeId } = get()
      return { tokens, components, activeId }
    },

    restore: (s) =>
      set({
        tokens: s.tokens,
        components: s.components,
        activeId: s.activeId,
      }),

    beginTransaction: () =>
      set((s) =>
        s.txDepth > 0
          ? { txDepth: s.txDepth + 1 }
          : { txDepth: 1, txSnapshot: { tokens: s.tokens, components: s.components, activeId: s.activeId } },
      ),

    commitTransaction: () => {
      const s = get()
      if (s.txDepth === 0) return
      if (s.txDepth > 1) {
        set({ txDepth: s.txDepth - 1 })
        return
      }
      const before = s.txSnapshot
      set({ txDepth: 0, txSnapshot: null })
      if (!before) return
      const after = get().snapshot()
      if (sameSnapshot(before, after)) return
      set((st) => ({ past: [...st.past, before].slice(-HISTORY_LIMIT), future: [] }))
    },

    abortTransaction: () => {
      const s = get()
      if (s.txSnapshot) get().restore(s.txSnapshot)
      set({ txDepth: 0, txSnapshot: null })
    },

    setColor: (mode, key, value) =>
      edit(() =>
        set((s) => ({
          tokens: {
            ...s.tokens,
            colors: {
              ...s.tokens.colors,
              [mode]: { ...s.tokens.colors[mode], [key]: value },
            },
          },
        })),
      ),

    setScalar: (key, value) =>
      edit(() => set((s) => ({ tokens: { ...s.tokens, [key]: value } }))),

    setFontPair: (sans, mono) =>
      edit(() => set((s) => ({ tokens: { ...s.tokens, fontFamily: { sans, mono } } }))),

    replaceTokens: (tokens) => edit(() => set({ tokens })),

    addComponent: (c, tokens) => {
      const id = uid()
      const component: StudioComponent = { ...c, id, createdAt: Date.now() }
      commit(() =>
        set((s) => ({
          components: [component, ...s.components],
          activeId: id,
          tokens: tokens ?? s.tokens,
        })),
      )
      const snap = get().snapshot()
      set((s) => ({
        versions: [
          { id: uid(), label: c.name, at: Date.now(), kind: 'generation' as const, snapshot: snap },
          ...s.versions,
        ].slice(0, 40),
      }))
      return id
    },

    selectComponent: (id) => commit(() => set({ activeId: id })),

    removeComponent: (id) =>
      commit(() =>
        set((s) => {
          const components = s.components.filter((c) => c.id !== id)
          const activeId =
            s.activeId === id ? (components[0]?.id ?? null) : s.activeId
          return { components, activeId }
        }),
      ),

    undo: () => {
      const s = get()
      if (s.past.length === 0) return
      const previous = s.past[s.past.length - 1]
      const current = s.snapshot()
      set({ past: s.past.slice(0, -1), future: [current, ...s.future].slice(0, HISTORY_LIMIT) })
      s.restore(previous)
    },

    redo: () => {
      const s = get()
      if (s.future.length === 0) return
      const next = s.future[0]
      const current = s.snapshot()
      set({ past: [...s.past, current].slice(-HISTORY_LIMIT), future: s.future.slice(1) })
      s.restore(next)
    },

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,

    markVersion: (label) =>
      set((s) => ({
        versions: [
          { id: uid(), label, at: Date.now(), kind: 'manual' as const, snapshot: s.snapshot() },
          ...s.versions,
        ].slice(0, 40),
      })),

    /** Jumping to a version is itself undoable — it pushes an undo entry. */
    jumpToVersion: (id) => {
      const version = get().versions.find((v) => v.id === id)
      if (!version) return
      commit(() => get().restore(version.snapshot))
    },

    setTheme: (theme) => set((s) => ({ ui: { ...s.ui, theme } })),
    toggleTheme: () =>
      set((s) => ({ ui: { ...s.ui, theme: s.ui.theme === 'light' ? 'dark' : 'light' } })),
    setOverlay: (overlay) => set((s) => ({ ui: { ...s.ui, overlay } })),
    togglePanel: (side) =>
      set((s) => ({
        ui:
          side === 'left'
            ? { ...s.ui, leftOpen: !s.ui.leftOpen }
            : { ...s.ui, rightOpen: !s.ui.rightOpen },
      })),

    initSession: () =>
      set((s) => {
        if (s.versions[0]?.at !== 0) return {}
        const now = Date.now()
        return {
          components: s.components.map((c) => (c.createdAt === 0 ? { ...c, createdAt: now } : c)),
          versions: s.versions.map((v) => (v.at === 0 ? { ...v, at: now } : v)),
        }
      }),

    setGeneration: (patch) => set((s) => ({ generation: { ...s.generation, ...patch } })),
    resetGeneration: () =>
      set({
        generation: {
          status: 'idle',
          prompt: '',
          raw: '',
          error: null,
          retryAfter: 0,
          lastFailedPrompt: null,
        },
      }),

    setSave: (patch) => set((s) => ({ save: { ...s.save, ...patch } })),
    setEditToken: (editToken) => set({ editToken }),

    hydrate: ({ tokens, components, editToken, id }) => {
      const snap: Snapshot = {
        tokens,
        components,
        activeId: components[0]?.id ?? null,
      }
      set({
        tokens,
        components,
        activeId: snap.activeId,
        past: [],
        future: [],
        versions: [
          { id: uid(), label: 'Opened share link', at: Date.now(), kind: 'initial', snapshot: snap },
        ],
        editToken: editToken ?? null,
        save: id
          ? { status: 'saved', id, url: `/d/${id}`, error: null }
          : { status: 'idle', id: null, url: null, error: null },
      })
    },
  }
})