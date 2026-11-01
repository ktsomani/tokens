/**
 * Pulls a top-level string field out of a JSON document that is still arriving.
 *
 * You cannot JSON.parse half a response, but you can walk it. This finds the
 * named key, scans the string value respecting escapes, and returns whatever
 * has landed so far. It is used for the optimistic preview during streaming
 * only — the authoritative parse happens once the response is complete, so a
 * miss here is silent and costs nothing.
 */
export function extractPartialString(raw: string, key: string): string | null {
  const marker = `"${key}"`
  const keyIndex = raw.indexOf(marker)
  if (keyIndex === -1) return null

  let i = keyIndex + marker.length
  while (i < raw.length && /[\s:]/.test(raw[i])) i++
  if (raw[i] !== '"') return null
  i++

  let out = ''
  while (i < raw.length) {
    const ch = raw[i]
    if (ch === '\\') {
      // An escape that has not finished arriving yet — stop cleanly.
      if (i + 1 >= raw.length) break
      const next = raw[i + 1]
      if (next === 'u') {
        if (i + 6 > raw.length) break
        out += raw.slice(i, i + 6)
        i += 6
        continue
      }
      out += ch + next
      i += 2
      continue
    }
    if (ch === '"') break
    out += ch
    i++
  }

  try {
    return JSON.parse(`"${out}"`)
  } catch {
    return null
  }
}

/** True once the document looks complete enough to be worth a full parse. */
export function looksComplete(raw: string): boolean {
  const trimmed = raw.trim()
  return trimmed.startsWith('{') && trimmed.endsWith('}')
}
