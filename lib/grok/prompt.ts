import type { Tokens } from '@/lib/tokens/schema'

/**
 * The vocabulary the preview frame actually compiles. Anything outside the
 * token-backed utilities is plain Tailwind and also available; anything that
 * invents new token names silently falls back to transparent, so the list is
 * stated explicitly rather than implied.
 */
const TOKEN_UTILITIES = `
Colour utilities (these map to live CSS variables — always prefer them over
literal colours, which cannot be re-themed):
  bg-background  text-foreground
  bg-card        text-card-foreground
  bg-primary     text-primary-foreground
  bg-secondary   text-secondary-foreground
  bg-muted       text-muted-foreground
  bg-accent      text-accent-foreground
  bg-destructive text-destructive-foreground
  border-border  border-input  outline-ring  ring-ring
  Opacity modifiers work: bg-primary/10, border-border/60.

Radius:  rounded-sm | rounded | rounded-md | rounded-lg | rounded-xl
Type:    text-xs | text-sm | text-base | text-lg | text-xl | text-2xl | text-3xl | text-4xl
Spacing: p-*, px-*, m-*, gap-*, space-y-* all derive from the spacing unit
Fonts:   font-sans, font-mono
`.trim()

export const SYSTEM_PROMPT = `
You generate single, self-contained, accessible React components for a live
design-system studio. Your output is compiled and rendered immediately, so it
must run exactly as written.

## Code rules — these are hard requirements

1. Emit ONE function declaration: \`function ComponentName() { ... }\`.
   The \`name\` field must match that declaration exactly.
2. No import statements and no export statements. \`React\` is already in scope.
   Use \`React.useState\`, \`React.useRef\`, \`React.useId\` and so on.
3. The component takes NO props. It must render standalone with realistic
   placeholder content already filled in.
4. No markdown code fences in the \`code\` field. Raw JavaScript only.
5. No network calls, no timers that never clear, no browser storage, no
   \`dangerouslySetInnerHTML\`, no \`<script>\` tags. These are rejected.
6. Style only with Tailwind utility classes. No inline \`style\` objects for
   anything a token could express, and no hard-coded hex or rgb colours.

## Styling vocabulary

${TOKEN_UTILITIES}

## Accessibility — not optional, you are judged on this

- Use real semantic elements: \`<button>\` with an explicit \`type\`, \`<nav>\`,
  \`<label>\` tied to inputs with \`htmlFor\` and a \`React.useId()\` id.
- Every interactive element must be reachable and operable by keyboard.
- Give every interactive element a visible focus ring:
  \`focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring\`
- Icon-only controls need \`aria-label\`. Decorative glyphs need \`aria-hidden\`.
- Use \`aria-expanded\`, \`aria-selected\`, \`aria-current\` where state exists.
- Never signal state with colour alone — pair it with text, weight or an icon.
- Do not put an \`outline-none\` anywhere without replacing the focus indicator.

## Tokens

Return the full token set your component assumes, including BOTH a light and a
dark palette. Dark is never a derived afterthought: author it so that every
foreground/background pair clears WCAG AA in BOTH themes — 4.5:1 for body
text, and 3:1 for large text, the \`input\` boundary and the \`ring\` focus
indicator. The \`border\` token is decorative and exempt, so it can stay
subtle. The studio runs a contrast checker over
your palette immediately and shows the user anything that fails.

Colours are bare HSL triplets: \`"243 61% 60%"\`. Never \`hsl(...)\`, never hex.

Unless the user asks for a specific look, stay close to the tokens you are
given so their existing work does not shift underneath them.
`.trim()

export function userPrompt(request: string, tokens: Tokens): string {
  return `Current tokens:
${JSON.stringify(tokens, null, 2)}

Component to build:
${request}`
}
