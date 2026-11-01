import { z } from 'zod'
import { COLOR_KEYS } from '@/lib/tokens/schema'
import { TokensSchema } from '@/lib/tokens/schema'
import { MAX_CODE_BYTES } from '@/lib/sandbox/guard'

/** What we accept back from the model, checked on our side before anything renders. */
export const GenerationSchema = z.object({
  name: z.string().regex(/^[A-Z][A-Za-z0-9]*$/),
  description: z.string().max(240),
  code: z.string().min(20).max(MAX_CODE_BYTES),
  tokens: TokensSchema,
  a11yNotes: z.array(z.string().max(200)).max(8),
})

export type Generation = z.infer<typeof GenerationSchema>

const hslProp = {
  type: 'string',
  description: 'Bare HSL triplet, e.g. "243 61% 60%". No hsl() wrapper, no hex.',
}

function paletteSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: [...COLOR_KEYS],
    properties: Object.fromEntries(COLOR_KEYS.map((k) => [k, hslProp])),
  }
}

/**
 * The schema sent to xAI as `response_format: { type: 'json_schema', strict: true }`.
 *
 * Hand-written rather than derived from Zod for two reasons: strict mode wants
 * every property listed in `required` with `additionalProperties: false`, and
 * xAI's structured outputs ignore `minLength`/`maxLength` and
 * `minItems`/`maxItems`. Length limits are therefore enforced by Zod above,
 * not here.
 */
export const GROK_JSON_SCHEMA = {
  name: 'design_system_component',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'description', 'code', 'tokens', 'a11yNotes'],
    properties: {
      name: {
        type: 'string',
        description: 'PascalCase component name, matching the function declared in `code`.',
      },
      description: { type: 'string', description: 'One sentence, under 240 characters.' },
      code: {
        type: 'string',
        description:
          'A single React function component. No imports, no exports, no markdown fences.',
      },
      tokens: {
        type: 'object',
        additionalProperties: false,
        required: ['colors', 'radius', 'typeScale', 'baseFontSize', 'spacingBase', 'fontFamily'],
        properties: {
          colors: {
            type: 'object',
            additionalProperties: false,
            required: ['light', 'dark'],
            properties: { light: paletteSchema(), dark: paletteSchema() },
          },
          radius: { type: 'number', description: 'Base corner radius in rem, 0 to 2.' },
          typeScale: { type: 'number', description: 'Modular scale ratio, 1.05 to 1.75.' },
          baseFontSize: { type: 'number', description: 'Base font size in px, 12 to 20.' },
          spacingBase: { type: 'number', description: 'Spacing unit in px, 2 to 8.' },
          fontFamily: {
            type: 'object',
            additionalProperties: false,
            required: ['sans', 'mono'],
            properties: {
              sans: { type: 'string', description: 'A Google Fonts family name.' },
              mono: { type: 'string', description: 'A monospace Google Fonts family name.' },
            },
          },
        },
      },
      a11yNotes: {
        type: 'array',
        description: 'Short notes on the accessibility decisions made.',
        items: { type: 'string' },
      },
    },
  },
} as const
