'use client'

import { useStudio } from '@/lib/store'
import { Button, Kbd } from '@/components/ui/primitives'
import { ShareButton } from './ShareButton'

export function TopBar() {
  const theme = useStudio((s) => s.ui.theme)
  const toggleTheme = useStudio((s) => s.toggleTheme)
  const undo = useStudio((s) => s.undo)
  const redo = useStudio((s) => s.redo)
  const pastCount = useStudio((s) => s.past.length)
  const futureCount = useStudio((s) => s.future.length)
  const setOverlay = useStudio((s) => s.setOverlay)

  return (
    <header className="hairline-b flex h-12 shrink-0 items-center justify-between gap-4 px-4">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-semibold tracking-tight text-ink">Tokens</span>
        <span className="hidden text-2xs text-dim sm:inline">Live design-system studio</span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          onClick={() => setOverlay('prompt')}
          variant="outline"
          className="mr-1 gap-2"
          aria-keyshortcuts="Meta+K Control+K"
        >
          Generate
          <Kbd keys="mod+k" />
        </Button>

        <Button onClick={undo} disabled={pastCount === 0} aria-label="Undo" title="Undo">
          ↶
        </Button>
        <Button onClick={redo} disabled={futureCount === 0} aria-label="Redo" title="Redo">
          ↷
        </Button>

        <Button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          title="Toggle theme"
        >
          {theme === 'light' ? '◐' : '◑'}
        </Button>

        <Button onClick={() => setOverlay('export')}>Export</Button>
        <ShareButton />
        <Button onClick={() => setOverlay('help')} aria-label="Keyboard shortcuts">
          ?
        </Button>
      </div>
    </header>
  )
}
<button 
  onClick={() => {
    // Simulate a Cmd+K press
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
  }}
  className="..." // your existing styles
>
  Generate <kbd>Ctrl K</kbd>
</button>