'use client'

import { useEffect, useState } from 'react'
import { Command } from 'cmdk'

export function CommandMenu({
  onOpenExport,
  onThemeChange,
}: {
  onOpenExport: () => void
  onThemeChange: (theme: string) => void
}) {
  const [open, setOpen] = useState(false)

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  if (!open) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[15vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div 
        className="w-full max-w-xl overflow-hidden rounded-xl border border-hairline bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Command Menu" className="flex h-full w-full flex-col bg-transparent">
          <Command.Input 
            placeholder="Type a command or search..." 
            className="w-full border-b border-hairline bg-transparent p-4 text-sm text-ink outline-none placeholder:text-dim"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="p-4 text-center text-sm text-dim">
              No results found.
            </Command.Empty>
            
            <Command.Group heading="Actions" className="px-2 py-1 text-2xs text-dim uppercase tracking-wider">
              <Command.Item 
                onSelect={() => { onOpenExport(); setOpen(false) }}
                className="cursor-pointer rounded-md px-3 py-2 text-sm text-ink aria-selected:bg-iris-soft aria-selected:text-iris"
              >
                Export Tokens...
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Themes" className="px-2 py-1 mt-2 text-2xs text-dim uppercase tracking-wider">
              <Command.Item 
                onSelect={() => { onThemeChange('light'); setOpen(false) }}
                className="cursor-pointer rounded-md px-3 py-2 text-sm text-ink aria-selected:bg-iris-soft aria-selected:text-iris"
              >
                Switch to Light Theme
              </Command.Item>
              <Command.Item 
                onSelect={() => { onThemeChange('dark'); setOpen(false) }}
                className="cursor-pointer rounded-md px-3 py-2 text-sm text-ink aria-selected:bg-iris-soft aria-selected:text-iris"
              >
                Switch to Dark Theme
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  )
}