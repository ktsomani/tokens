/**
 * Static checks on model-generated code, run before anything reaches the frame.
 *
 * The iframe sandbox is the real boundary — no `allow-same-origin`, so the code
 * runs in an opaque origin it cannot escape, and `connect-src 'none'` means it
 * cannot make requests. This is the layer in front of it: it turns a bad
 * generation into a readable message instead of a broken preview, and it
 * catches the obvious attempts early.
 */

export const MAX_CODE_BYTES = 14_000

const BANNED: { pattern: RegExp; reason: string }[] = [
  // Any statement-position `import`, including the default form
  // (`import x from 'y'`), plus dynamic `import(...)` anywhere.
  { pattern: /(^|[\n;])\s*import\b/, reason: 'imports — React is already in scope' },
  { pattern: /\bimport\s*\(/, reason: 'dynamic imports' },
  { pattern: /(^|[\n;])\s*export\b/, reason: 'exports — the component is returned by name' },
  { pattern: /\brequire\s*\(/, reason: 'require()' },
  { pattern: /\bfetch\s*\(/, reason: 'network requests' },
  { pattern: /\bXMLHttpRequest\b/, reason: 'network requests' },
  { pattern: /\bWebSocket\b/, reason: 'network requests' },
  { pattern: /\bnavigator\s*\.\s*sendBeacon\b/, reason: 'network requests' },
  { pattern: /\beval\s*\(/, reason: 'eval()' },
  { pattern: /\bnew\s+Function\b/, reason: 'dynamic code' },
  { pattern: /\blocalStorage\b/, reason: 'browser storage' },
  { pattern: /\bsessionStorage\b/, reason: 'browser storage' },
  { pattern: /\bindexedDB\b/, reason: 'browser storage' },
  { pattern: /\bdocument\s*\.\s*cookie\b/, reason: 'cookies' },
  { pattern: /\bwindow\s*\.\s*(parent|top|opener)\b/, reason: 'frame escape' },
  { pattern: /\bpostMessage\s*\(/, reason: 'frame messaging' },
  { pattern: /\bdangerouslySetInnerHTML\b/, reason: 'raw HTML injection' },
  { pattern: /<\s*script\b/i, reason: 'script tags' },
  { pattern: /\bServiceWorker\b/, reason: 'service workers' },
]

export type GuardResult = { ok: true } | { ok: false; reason: string }

export function guardComponentCode(name: string, code: string): GuardResult {
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
    return { ok: false, reason: `"${name}" is not a valid PascalCase component name.` }
  }

  const bytes = new TextEncoder().encode(code).length
  if (bytes > MAX_CODE_BYTES) {
    return {
      ok: false,
      reason: `Component is ${(bytes / 1024).toFixed(1)} KB, over the ${MAX_CODE_BYTES / 1000} KB limit.`,
    }
  }

  for (const { pattern, reason } of BANNED) {
    if (pattern.test(code)) return { ok: false, reason: `Generated code used ${reason}.` }
  }

  // The declaration we are going to call by name has to actually be there.
  const declared =
    new RegExp(`function\\s+${name}\\s*\\(`).test(code) ||
    new RegExp(`(const|let|var)\\s+${name}\\s*=`).test(code)
  if (!declared) {
    return { ok: false, reason: `Could not find a declaration for "${name}" in the code.` }
  }

  return { ok: true }
}
