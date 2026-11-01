'use client'

import { useStudio } from '@/lib/store'
import { COLOR_GROUPS } from '@/lib/tokens/schema'
import { PanelSection, Divider } from '@/components/ui/primitives'
import { HslPicker } from './HslPicker'
import { ScalarField } from './ScalarField'
import { FontPairing } from './FontPairing'
import { ContrastReport } from '@/components/a11y/ContrastReport'

export function TokenPanel() {
  const mode = useStudio((s) => s.ui.theme)

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PanelSection
        title={`Colour · editing ${mode}`}
        action={
          <span className="text-2xs text-dim">
            {mode === 'light' ? 'Light theme' : 'Dark theme'}
          </span>
        }
      >
        <div className="space-y-3">
          {COLOR_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-1.5 text-2xs text-dim">{group.label}</p>
              <div className="space-y-0.5">
                {group.keys.map((key) => (
                  <HslPicker key={key} tokenKey={key} mode={mode} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </PanelSection>

      <Divider />

      <PanelSection title="Shape and scale">
        <ScalarField tokenKey="radius" />
        <ScalarField tokenKey="typeScale" />
        <ScalarField tokenKey="baseFontSize" />
        <ScalarField tokenKey="spacingBase" />
      </PanelSection>

      <Divider />

      <PanelSection title="Type pairing">
        <FontPairing />
      </PanelSection>

      <Divider />

      <ContrastReport />
    </div>
  )
}
