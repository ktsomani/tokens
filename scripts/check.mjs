/**
 * Invariant checks for the parts of Tokens that types cannot cover:
 * the sandbox render pipeline, the code guard, the CSS-variable bridge
 * between serialize.ts and sandbox.html, transactional history, the
 * streaming partial parser, and the contrast maths.
 *
 * Run with: npm run check
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(resolve(root, 'package.json'))
const { transform } = require('sucrase')
const { z } = require('zod')
const { create } = require('zustand')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

/** Loads a TS module without a bundler, injecting whatever it imports. */
function load(path, strip = [], scope = {}) {
  let src = readFileSync(resolve(root, path), 'utf8')
  for (const re of strip) src = src.replace(re, '')
  const js = transform(src, { transforms: ['typescript', 'imports'] }).code
  const mod = {}
  const names = ['exports', 'module', ...Object.keys(scope)]
  new Function(...names, js)(mod, { exports: mod }, ...Object.values(scope))
  return mod
}

let failures = 0
let suite = ''
const group = (name) => { suite = name; console.log(`\n${name}`) }
const check = (name, cond, extra = '') => {
  if (!cond) failures++
  console.log(`  ${cond ? '✓' : '✗'} ${name}${extra ? ` — ${extra}` : ''}`)
}

/* ── modules under test ─────────────────────────────────────────── */
const schema = load('lib/tokens/schema.ts', [/import \{ z \} from 'zod'\n/], { z })
const defaults = load('lib/tokens/defaults.ts', [/import type .*\n/])
const serialize = load('lib/tokens/serialize.ts', [/import \{[^}]*\} from '\.\/schema'\n/s], {
  COLOR_KEYS: schema.COLOR_KEYS,
})
const guard = load('lib/sandbox/guard.ts')
const partial = load('lib/grok/partial.ts')
const contrast = load('lib/a11y/contrast.ts', [/import \{[^}]*\} from '@\/lib\/tokens\/schema'\n/s], {
  parseHsl: schema.parseHsl,
  formatHsl: schema.formatHsl,
})
const store = load(
  'lib/store/index.ts',
  [/import \{ create \} from 'zustand'\n/, /import \{ DEFAULT_TOKENS[^\n]*\n/, /import type \{[^}]*\} from '[^']*'\n/gs],
  { create, DEFAULT_TOKENS: defaults.DEFAULT_TOKENS, WELCOME_COMPONENT: defaults.WELCOME_COMPONENT },
)

/* ── 1. The code guard ──────────────────────────────────────────── */
group('Code guard')
const starter = defaults.WELCOME_COMPONENT
check('accepts the starter component', guard.guardComponentCode(starter.name, starter.code).ok)
for (const [label, name, src] of [
  ['fetch', 'Evil', `function Evil(){ fetch('https://x.test'); return <div/> }`],
  ['localStorage', 'Evil', `function Evil(){ localStorage.getItem('k'); return <div/> }`],
  ['frame escape', 'Evil', `function Evil(){ window.parent.location='/'; return <div/> }`],
  ['named import', 'Evil', `import { x } from 'y'\nfunction Evil(){ return <div/> }`],
  ['default import', 'Evil', `import R from 'react'\nfunction Evil(){ return <div/> }`],
  ['dynamic import', 'Evil', `function Evil(){ import('./x'); return <div/> }`],
  ['export', 'Evil', `function Evil(){ return <div/> }\nexport default Evil`],
  ['innerHTML', 'Evil', `function Evil(){ return <div dangerouslySetInnerHTML={{__html:'x'}}/> }`],
  ['missing declaration', 'Evil', `function Other(){ return <div/> }`],
  ['non-PascalCase name', 'evil', `function evil(){ return <div/> }`],
]) {
  check(`rejects ${label}`, guard.guardComponentCode(name, src).ok === false)
}

/* ── 2. The sandbox render pipeline ─────────────────────────────── */
group('Sandbox pipeline (guard → sucrase → new Function → render)')
const js = transform(starter.code, { transforms: ['jsx'], jsxRuntime: 'classic', production: true }).code
check('sucrase emits React.createElement', js.includes('React.createElement'))
const Component = new Function('React', `${js}\n;return ${starter.name};`)(React)
check('factory returns a component function', typeof Component === 'function')
const html = renderToStaticMarkup(React.createElement(Component))
check('renders markup', html.length > 100, `${html.length} chars`)
check('uses token-backed colour utilities', html.includes('bg-primary'))
check('uses token-backed radius utilities', html.includes('rounded-md'))
check('utilities are kebab-case', html.includes('text-muted-foreground'))
check('interactive elements have focus rings', html.includes('focus-visible:outline-ring'))
check('buttons declare an explicit type', (html.match(/type="button"/g) || []).length >= 2)

/* ── 3. The token bridge ────────────────────────────────────────── */
group('Token bridge (serialize.ts ↔ sandbox.html)')
const sandboxHtml = readFileSync(resolve(root, 'public/sandbox.html'), 'utf8')
const themeBlock = sandboxHtml.slice(
  sandboxHtml.indexOf('@theme inline'),
  sandboxHtml.indexOf('}', sandboxHtml.indexOf('--radius-xl')),
)
const consumed = [...themeBlock.matchAll(/hsl\(var\((--[a-z-]+)\)\)/g)].map((m) => m[1])
const produced = Object.keys(serialize.toCssVars(defaults.DEFAULT_TOKENS, 'light'))
check('sandbox reads one variable per colour token',
  consumed.length === schema.COLOR_KEYS.length,
  `${consumed.length} read vs ${schema.COLOR_KEYS.length} keys`)
const missing = consumed.filter((v) => !produced.includes(v))
check('every variable the sandbox reads is emitted', missing.length === 0, missing.join(', '))
check('camelCase keys become kebab variables', produced.includes('--muted-foreground'))
for (const v of ['--radius', '--font-sans', '--text-xs', '--text-4xl', '--base-size', '--space-unit'])
  check(`emits ${v}`, produced.includes(v))
const light = serialize.toCssVars(defaults.DEFAULT_TOKENS, 'light')
const dark = serialize.toCssVars(defaults.DEFAULT_TOKENS, 'dark')
check('light and dark differ', light['--background'] !== dark['--background'])
const sizes = serialize.typeScaleSizes(defaults.DEFAULT_TOKENS)
const px = (s) => parseFloat(s) * 16
const steps = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl']
check('type scale increases monotonically',
  steps.every((s, i, a) => i === 0 || px(sizes[s]) > px(sizes[a[i - 1]])),
  steps.map((s) => px(sizes[s]).toFixed(0)).join('→'))
check('type scale responds to the ratio',
  px(serialize.typeScaleSizes({ ...defaults.DEFAULT_TOKENS, typeScale: 1.5 })['4xl']) > px(sizes['4xl']))
const tw = serialize.toTailwindConfig(defaults.DEFAULT_TOKENS)
check('tailwind export maps every colour', schema.COLOR_KEYS.every((k) => tw.includes(`${k}:`)))
check('tailwind export supports opacity modifiers', tw.includes('<alpha-value>'))
const cssFile = serialize.toCssFile(defaults.DEFAULT_TOKENS)
check('css export covers both themes', cssFile.includes(':root') && cssFile.includes("[data-theme='dark']"))
check('css export has balanced braces',
  (cssFile.match(/\{/g) || []).length === (cssFile.match(/\}/g) || []).length)

/* ── 3b. Response headers on the sandbox ────────────────────────── */
group('Sandbox headers (next.config.mjs)')
const config = readFileSync(resolve(root, 'next.config.mjs'), 'utf8')
check('sandbox CSP allows the studio to frame it', config.includes("frame-ancestors 'self'"))
check('the catch-all XFO rule excludes sandbox.html',
  /source: '\/\(\(\?!sandbox/.test(config),
  'X-Frame-Options: DENY blocks framing even same-origin, so a catch-all that matches sandbox.html stops the preview loading')
check('sandbox CSP still blocks outbound requests', config.includes("connect-src 'none'"))

/* ── 4. Transactional history ───────────────────────────────────── */
group('History')
const s = () => store.useStudio.getState()
check('starts empty', s().past.length === 0)
s().beginTransaction()
for (let h = 0; h <= 120; h += 2) s().setColor('light', 'primary', `${h} 61% 60%`)
s().commitTransaction()
check('a 61-step drag is ONE undo entry', s().past.length === 1, `${s().past.length}`)
s().undo()
check('undo restores the pre-drag value',
  s().tokens.colors.light.primary === defaults.DEFAULT_TOKENS.colors.light.primary)
s().redo()
check('redo reapplies the whole drag', s().tokens.colors.light.primary === '120 61% 60%')
let n = s().past.length
s().setScalar('radius', 1); s().setScalar('radius', 1.25)
check('discrete edits are separate entries', s().past.length === n + 2)
n = s().past.length
s().beginTransaction(); s().setColor('light', 'primary', s().tokens.colors.light.primary); s().commitTransaction()
check('a no-op transaction adds nothing', s().past.length === n)
n = s().past.length
s().beginTransaction(); s().beginTransaction(); s().setScalar('spacingBase', 8); s().commitTransaction()
check('nested commit does not close early', s().past.length === n)
s().commitTransaction()
check('outer commit closes it', s().past.length === n + 1)
s().undo()
check('undo populates redo', s().future.length > 0)
s().setScalar('radius', 0.75)
check('a fresh edit clears redo', s().future.length === 0)
const versions = s().versions.length
const newId = s().addComponent(
  { name: 'Card', description: 'd', code: 'function Card(){return null}', a11yNotes: [], prompt: 'p' },
  { ...defaults.DEFAULT_TOKENS, radius: 1.5 },
)
check('generation selects the new component', s().activeId === newId)
check('generation applies its tokens atomically', s().tokens.radius === 1.5)
check('generation records a version', s().versions.length === versions + 1)
s().undo()
check('undo reverts component and tokens together',
  s().components.length === 1 && s().tokens.radius !== 1.5)
for (let i = 0; i < 80; i++) s().setScalar('baseFontSize', 12 + (i % 8))
check('history is capped', s().past.length <= 50, `${s().past.length}`)

/* ── 5. Streaming partial parser ────────────────────────────────── */
group('Partial JSON parser')
const doc = JSON.stringify({
  name: 'Card',
  code: 'function Card(){\n  return <div className="p-4">He said "hi"</div>\n}',
})
const target = partial.extractPartialString(doc, 'code')
check('extracts from a complete document', target.includes('className="p-4"'))
check('unescapes quotes', target.includes('He said "hi"'))
check('unescapes newlines', target.split('\n').length === 3)
check('returns null for an absent key', partial.extractPartialString(doc, 'nope') === null)
let threw = 0, yielded = 0, mangled = 0
for (let i = 1; i <= doc.length; i++) {
  try {
    const out = partial.extractPartialString(doc.slice(0, i), 'code')
    if (out !== null) { yielded++; if (!target.startsWith(out)) mangled++ }
  } catch { threw++ }
}
check(`never throws across ${doc.length} truncation points`, threw === 0, `${threw} throws`)
check('every partial is a true prefix of the final value', mangled === 0, `${mangled} mangled`)
check('partials appear mid-stream', yielded > 20, `${yielded} yielded`)
check('looksComplete rejects a partial', partial.looksComplete(doc.slice(0, 40)) === false)
check('looksComplete accepts a whole document', partial.looksComplete(doc) === true)

/* ── 6. Contrast maths, against published WCAG values ───────────── */
group('Contrast')
const near = (a, b, tol = 0.02) => Math.abs(a - b) <= tol
check('black on white is 21:1', near(contrast.contrastRatio('0 0% 0%', '0 0% 100%'), 21))
check('white on white is 1:1', near(contrast.contrastRatio('0 0% 100%', '0 0% 100%'), 1))
check('blue on white is 8.59:1', near(contrast.contrastRatio('240 100% 50%', '0 0% 100%'), 8.59, 0.01))
check('red on white is 4.00:1', near(contrast.contrastRatio('0 100% 50%', '0 0% 100%'), 3.998, 0.01))
check('ratio is symmetric',
  near(contrast.contrastRatio('0 0% 20%', '0 0% 90%'), contrast.contrastRatio('0 0% 90%', '0 0% 20%')))
const audit = contrast.auditPalettes(defaults.DEFAULT_TOKENS.colors)
check('default palette audits both themes', audit.light.length > 0 && audit.dark.length > 0)
check('default palette clears AA everywhere', audit.failures === 0,
  audit.failures ? [...audit.light, ...audit.dark].filter((r) => !r.aa).map((r) => `${r.mode}/${r.label} ${r.ratio.toFixed(2)}`).join('; ') : '')
const broken = {
  light: Object.fromEntries(schema.COLOR_KEYS.map((k) => [k, k === 'background' ? '0 0% 100%' : '0 0% 88%'])),
  dark: defaults.DEFAULT_TOKENS.colors.dark,
}
const brokenAudit = contrast.auditPalettes(broken)
check('catches a failing palette', brokenAudit.failures > 0, `${brokenAudit.failures} failures`)
const fixable = brokenAudit.light.find((r) => !r.aa && r.suggestion)
check('offers a fix for a failing pair', Boolean(fixable))
if (fixable)
  check('the suggested fix actually passes',
    contrast.contrastRatio(fixable.suggestion, broken.light[fixable.bg]) >= 4.5 - 0.001,
    `${fixable.suggestion} → ${contrast.contrastRatio(fixable.suggestion, broken.light[fixable.bg]).toFixed(2)}:1`)

console.log(`\n${failures === 0 ? '✓ all checks passed' : `✗ ${failures} check(s) failed`}`)
process.exit(failures === 0 ? 0 : 1)
