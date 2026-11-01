'use client'

import { useRef } from 'react'
import { useStudio } from '@/lib/store'
import { PanelSection } from '@/components/ui/primitives'

/**
 * Roving tabindex: the list is one tab stop, and arrow keys move within it.
 * Tabbing through forty components to reach the panel below would be hostile.
 */
export function ComponentList() {
  const components = useStudio((s) => s.components)
  const activeId = useStudio((s) => s.activeId)
  const select = useStudio((s) => s.selectComponent)
  const remove = useStudio((s) => s.removeComponent)
  const listRef = useRef<HTMLUListElement>(null)

  function onKeyDown(e: React.KeyboardEvent) {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']
    if (!keys.includes(e.key)) return
    e.preventDefault()
    const index = components.findIndex((c) => c.id === activeId)
    let next = index
    if (e.key === 'ArrowDown') next = Math.min(components.length - 1, index + 1)
    if (e.key === 'ArrowUp') next = Math.max(0, index - 1)
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = components.length - 1
    const target = components[next]
    if (!target) return
    select(target.id)
    listRef.current
      ?.querySelector<HTMLButtonElement>(`[data-id="${target.id}"]`)
      ?.focus()
  }

  return (
    <PanelSection
      title="Components"
      action={<span className="font-mono text-2xs tabular-nums text-dim">{components.length}</span>}
    >
      {components.length === 0 ? (
        <p className="px-1.5 text-2xs text-dim">Nothing yet. Press ⌘K to make something.</p>
      ) : (
        <ul ref={listRef} onKeyDown={onKeyDown} className="space-y-0.5">
          {components.map((c) => {
            const selected = c.id === activeId
            return (
              <li key={c.id} className="group relative">
                <button
                  type="button"
                  data-id={c.id}
                  tabIndex={selected ? 0 : -1}
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => select(c.id)}
                  className={[
                    'flex w-full flex-col gap-0.5 rounded-md px-2 py-2 text-left transition-colors duration-state',
                    selected ? 'bg-iris-soft' : 'hover:bg-surface',
                  ].join(' ')}
                >
                  <span
                    className={`truncate font-mono text-xs ${selected ? 'text-iris' : 'text-ink'}`}
                  >
                    {c.name}
                  </span>
                  <span className="truncate text-2xs text-dim">{c.description}</span>
                </button>
                {components.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    aria-label={`Delete ${c.name}`}
                    className="absolute right-1.5 top-1.5 rounded-xs px-1 py-0.5 text-2xs text-dim opacity-0 transition-opacity duration-state hover:text-fail focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </PanelSection>
  )
}
