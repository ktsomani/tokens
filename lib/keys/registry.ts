/**
 * One source of truth for every shortcut. The `?` help sheet is rendered
 * from this array, so the documented keys cannot drift from the real ones.
 */
export type ShortcutId =
  | 'prompt'
  | 'undo'
  | 'redo'
  | 'export'
  | 'theme'
  | 'save'
  | 'collapseLeft'
  | 'collapseRight'
  | 'help'
  | 'dismiss'

export type Shortcut = {
  id: ShortcutId
  keys: string
  label: string
  group: 'Create' | 'Edit' | 'View' | 'Share'
}

export const SHORTCUTS: Shortcut[] = [
  { id: 'prompt', keys: 'mod+k', label: 'Generate a component', group: 'Create' },
  { id: 'undo', keys: 'mod+z', label: 'Undo', group: 'Edit' },
  { id: 'redo', keys: 'mod+shift+z', label: 'Redo', group: 'Edit' },
  { id: 'theme', keys: 'mod+d', label: 'Toggle light / dark', group: 'View' },
  { id: 'collapseLeft', keys: '[', label: 'Collapse left panel', group: 'View' },
  { id: 'collapseRight', keys: ']', label: 'Collapse right panel', group: 'View' },
  { id: 'export', keys: 'mod+e', label: 'Export code', group: 'Share' },
  { id: 'save', keys: 'mod+s', label: 'Save and copy share link', group: 'Share' },
  { id: 'help', keys: '?', label: 'Keyboard shortcuts', group: 'View' },
  { id: 'dismiss', keys: 'escape', label: 'Dismiss', group: 'View' },
]

export const GROUPS: Shortcut['group'][] = ['Create', 'Edit', 'View', 'Share']

const MAC_GLYPH: Record<string, string> = {
  mod: '⌘',
  shift: '⇧',
  alt: '⌥',
  escape: 'esc',
  enter: '↵',
}
const PC_GLYPH: Record<string, string> = {
  mod: 'Ctrl',
  shift: 'Shift',
  alt: 'Alt',
  escape: 'Esc',
  enter: 'Enter',
}

export function isApple(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform ?? navigator.userAgent)
}

/** "mod+shift+z" → ["⌘", "⇧", "Z"] */
export function renderKeys(keys: string, apple: boolean): string[] {
  const map = apple ? MAC_GLYPH : PC_GLYPH
  return keys
    .split('+')
    .map((part) => map[part] ?? (part.length === 1 ? part.toUpperCase() : part))
}

export function shortcutFor(id: ShortcutId): Shortcut {
  const found = SHORTCUTS.find((s) => s.id === id)
  if (!found) throw new Error(`Unknown shortcut: ${id}`)
  return found
}
