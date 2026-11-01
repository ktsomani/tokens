# Tokens

A live design-system studio. Describe a component, get accessible React back,
then tune colour, radius, type and spacing and watch it update instantly.

## The idea

Two things are kept completely separate:

- **Code generation** — slow, costs money, goes through Grok.
- **Token changes** — instant, free, local.

Tokens live in CSS variables and generated components only ever refer to them
(`bg-primary`, `rounded-md`). Dragging a hue slider is one `setProperty()` call
inside the preview frame. No regeneration, no re-transpile, no React re-render.

```
Prompt (⌘K)
   → /api/generate  (server; holds XAI_API_KEY)
   → Grok, response_format: json_schema
   → stream back
   → Zod + static guard + compile check
   → postMessage → preview iframe
                      ↑
Token panel → Zustand → CSS var diff ──┘   (separate channel, instant)
```

## Setup

```bash
npm install
cp .env.example .env.local   # add XAI_API_KEY and GROK_MODEL
npm run dev
```

### Which provider

The app needs OpenAI-compatible chat completions with
`response_format: json_schema`. Nothing in it is xAI-specific, so three env
vars pick the provider:

| | xAI / Grok | Google Gemini |
|---|---|---|
| `AI_BASE_URL` | `https://api.x.ai/v1` | `https://generativelanguage.googleapis.com/v1beta/openai/` |
| `AI_MODEL` | `grok-4.3` | `gemini-3.8-flash` |
| Key from | [console.x.ai](https://console.x.ai) | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| Cost | paid only, no free tier | free tier available |

Grok model ids use dots (`grok-4.3`), not dashes. `XAI_API_KEY` and
`GROK_MODEL` still work as fallbacks for `AI_API_KEY` and `AI_MODEL`.

The studio runs fully without any keys. Generation needs the xAI pair;
save-and-share needs Supabase. Both degrade with a clear message rather than
breaking.

### Supabase (optional)

Run `supabase/migrations/0001_init.sql`, then set `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and a random
`RATE_LIMIT_SALT`.

## Scripts

| | |
|---|---|
| `npm run dev` | Studio on :3000 |
| `npm run build` | Production build |
| `npm run check` | Invariant checks (see below) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run vendor` | Rebuild the preview runtime into `public/vendor` |

## How the preview sandbox works

`public/sandbox.html` runs model-generated code. The boundary is the iframe
attribute: `sandbox="allow-scripts"` **without** `allow-same-origin`, so the
frame has an opaque origin and cannot read the studio's DOM, cookies or
storage. Its CSP (in `next.config.mjs`) adds `connect-src 'none'`, so a
generated component cannot phone home. Webfonts from Google are the single
permitted outside origin.

Inside the frame: React, Sucrase and Tailwind's browser build, all served from
`/vendor` so the CSP can stay at `script-src 'self'`. Sucrase is used instead
of `@babel/standalone` — 201 KB against 3.1 MB, and it only has to handle JSX.

Four gates run before anything renders: Zod shape check, a static scan for
imports/network/storage/frame-escape, a real compile, and a size cap. The
sandbox makes these defence in depth rather than the only line — but a clear
error beats a broken preview.

## Undo/redo

History is transactional. A transaction opens on pointer-down and closes on
pointer-up, so a slider drag is **one** undo step rather than two hundred.
Versions share the same snapshot type but are a different idea: named points
you can jump back to, and jumping is itself undoable.

## `npm run check`

Six suites covering what types cannot:

- the code guard, against ten real bypass attempts
- the full sandbox pipeline (guard → Sucrase → `new Function` → render)
- the CSS-variable bridge between `serialize.ts` and `sandbox.html` — nothing
  in the type system connects those two files
- transactional history, including the 61-step-drag-is-one-entry invariant
- the streaming partial parser, at every truncation point of a document
- contrast maths, against published WCAG values

## Notes

- `XAI_API_KEY` is read in `lib/grok/client.ts` and nowhere else. It is never
  `NEXT_PUBLIC_*`, so it cannot be inlined into the browser bundle.
- The `designs` table has no anon insert or update policy. All writes go
  through `/api/designs` with the service role key.
- Client IPs are stored as salted HMACs, never in the clear.
- Rate limiting lives in Postgres because Vercel functions share no memory.
