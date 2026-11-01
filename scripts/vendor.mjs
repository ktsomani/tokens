/**
 * Copies the preview sandbox's runtime into public/vendor/.
 *
 * These are served from our own origin so the sandbox CSP can stay at
 * `script-src 'self'` — no CDN, no third-party origin, and the files are
 * cached immutably. Runs on predev and prebuild; public/vendor is gitignored.
 */
import { build } from 'esbuild'
import { copyFile, mkdir, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'public/vendor')

const COPIES = [
  ['react/umd/react.production.min.js', 'react.js'],
  ['react-dom/umd/react-dom.production.min.js', 'react-dom.js'],
  ['@tailwindcss/browser/dist/index.global.js', 'tailwind.js'],
]

async function main() {
  await mkdir(out, { recursive: true })

  for (const [from, to] of COPIES) {
    // Resolved from node_modules directly: the UMD builds are not
    // listed in React's `exports` map, so require.resolve cannot reach them.
    const src = resolve(root, 'node_modules', from)
    await copyFile(src, resolve(out, to))
    const { size } = await stat(resolve(out, to))
    console.log(`  vendor/${to.padEnd(16)} ${(size / 1024).toFixed(0)} KB`)
  }

  // Sucrase ships as unbundled ESM, so bundle it to one global.
  // It is ~12x smaller than @babel/standalone and only has to handle JSX.
  await build({
    entryPoints: [resolve(root, 'scripts/sucrase-entry.js')],
    bundle: true,
    minify: true,
    format: 'iife',
    globalName: 'Sucrase',
    target: ['es2020'],
    outfile: resolve(out, 'sucrase.js'),
    logLevel: 'error',
  })
  const { size } = await stat(resolve(out, 'sucrase.js'))
  console.log(`  vendor/${'sucrase.js'.padEnd(16)} ${(size / 1024).toFixed(0)} KB`)
}

main().catch((err) => {
  console.error('vendor step failed:', err)
  process.exit(1)
})
