'use client'

import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion'
import { useEffect } from 'react'
import { useStudio } from '@/lib/store'
import { useHotkeys } from '@/lib/keys/useHotkeys'
import { PreviewFrame } from '@/components/preview/PreviewFrame'
import { TokenPanel } from '@/components/tokens/TokenPanel'
import { ComponentList } from './ComponentList'
import { HistoryTimeline } from '@/components/history/HistoryTimeline'
import { CommandBar } from './CommandBar'
import { HelpSheet } from './HelpSheet'
import { ExportSheet } from '@/components/export/ExportSheet'
import { TopBar } from './TopBar'
import { Divider } from '@/components/ui/primitives'

const PANEL_WIDTH = 288

export function Shell() {
  const ui = useStudio((s) => s.ui)
  const setOverlay = useStudio((s) => s.setOverlay)
  const togglePanel = useStudio((s) => s.togglePanel)
  const toggleTheme = useStudio((s) => s.toggleTheme)
  const undo = useStudio((s) => s.undo)
  const redo = useStudio((s) => s.redo)
  const setTheme = useStudio((s) => s.setTheme)
  const initSession = useStudio((s) => s.initSession)
  const reduced = useReducedMotion()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', ui.theme)
  }, [ui.theme])

  useEffect(() => {
    initSession()
  }, [initSession])

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    if (query.matches) setTheme('dark')
  }, [setTheme])

  useHotkeys({
    prompt: () => setOverlay('prompt'),
    export: () => setOverlay('export'),
    help: () => setOverlay('help'),
    dismiss: () => setOverlay('none'),
    undo,
    redo,
    theme: toggleTheme,
    collapseLeft: () => togglePanel('left'),
    collapseRight: () => togglePanel('right'),
    save: () => {
      document.querySelector<HTMLButtonElement>('[data-share-trigger]')?.click()
    },
  })

  const transition = reduced
    ? { duration: 0 }
    : { duration: 0.2, ease: [0.2, 0, 0, 1] as const }

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="flex h-dvh flex-col overflow-hidden bg-paper">
        <TopBar />

        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          
          {/* Left Sidebar (Mobile: Drawer / Desktop: Static) */}
          <m.aside
            className="fixed inset-y-0 left-0 z-50 h-full overflow-hidden border-r border-hairline bg-paper shadow-2xl md:relative md:z-0 md:shadow-none"
            animate={{ width: ui.leftOpen ? PANEL_WIDTH : 0 }}
            initial={false}
            transition={transition}
            aria-label="Components and versions"
            aria-hidden={!ui.leftOpen}
          >
            <div
              className="h-full overflow-y-auto"
              style={{ width: PANEL_WIDTH }}
              {...(ui.leftOpen ? {} : { inert: true })}
            >
              <ComponentList />
              <Divider />
              <HistoryTimeline />
            </div>
          </m.aside>

          {/* Center Canvas */}
          <main className="flex min-w-0 flex-1 flex-col">
            <PreviewFrame />
          </main>

          {/* Right Sidebar (Mobile: Drawer / Desktop: Static) */}
          <m.aside
            className="fixed inset-y-0 right-0 z-50 h-full overflow-hidden border-l border-hairline bg-paper shadow-2xl md:relative md:z-0 md:shadow-none"
            animate={{ width: ui.rightOpen ? PANEL_WIDTH : 0 }}
            initial={false}
            transition={transition}
            aria-label="Design tokens"
            aria-hidden={!ui.rightOpen}
          >
            <div
              className="h-full overflow-y-auto"
              style={{ width: PANEL_WIDTH }}
              {...(ui.rightOpen ? {} : { inert: true })}
            >
              <TokenPanel />
            </div>
          </m.aside>

        </div>

        <CommandBar />
        <ExportSheet />
        <HelpSheet />
      </div>
    </LazyMotion>
  )
}