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
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-background">
        
        {/* Top Bar - Fixed at the top */}
        <div className="z-50 shrink-0">
          <TopBar />
        </div>

        {/* THE CANVAS - Takes up the full background */}
        <main className="absolute inset-0 z-0 pt-14">
          <PreviewFrame />
        </main>

        {/* MOBILE BACKDROP - Darkens the canvas when a panel is open */}
        <div
          className={`absolute inset-0 z-30 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 md:hidden ${
            ui.leftOpen || ui.rightOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => {
            if (ui.leftOpen) togglePanel('left')
            if (ui.rightOpen) togglePanel('right')
          }}
        />

        {/* LEFT FLOATING PANEL */}
        <m.aside
          className="absolute bottom-4 left-4 top-[4.5rem] z-40 w-[280px] overflow-hidden rounded-xl border border-border bg-card/95 shadow-2xl backdrop-blur-md"
          animate={{ x: ui.leftOpen ? 0 : -320, opacity: ui.leftOpen ? 1 : 0 }}
          initial={false}
          transition={transition}
          style={{ pointerEvents: ui.leftOpen ? 'auto' : 'none' }}
        >
          <div className="h-full overflow-y-auto">
            <ComponentList />
            <Divider />
            <HistoryTimeline />
          </div>
        </m.aside>

        {/* RIGHT FLOATING PANEL (Token Panel) */}
        <m.aside
          className="absolute bottom-4 right-4 top-[4.5rem] z-40 w-[280px] overflow-hidden rounded-xl border border-border bg-card/95 shadow-2xl backdrop-blur-md"
          animate={{ x: ui.rightOpen ? 0 : 320, opacity: ui.rightOpen ? 1 : 0 }}
          initial={false}
          transition={transition}
          style={{ pointerEvents: ui.rightOpen ? 'auto' : 'none' }}
        >
          <div className="h-full overflow-y-auto">
            <TokenPanel />
          </div>
        </m.aside>

        {/* Bottom Overlays */}
        <CommandBar />
        <ExportSheet />
        <HelpSheet />
      </div>
    </LazyMotion>
  )
}