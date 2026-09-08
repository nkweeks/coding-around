// Verify the complete static app and route entry byte-for-byte against the source.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoot = process.env.VIM_PROTOCOL_SOURCE || '/Users/nathanielweeks/Documents/claude_code_projects/hacking_game'
const target = path.join(repoRoot, 'public/vim-protocol')
const entry = path.join(repoRoot, 'src/vimProtocolEntry.js')
const html = fs.readFileSync(path.join(target, 'index.html'), 'utf8')
// This gate still runs on CI without the source project: every referenced entry asset must exist.
for (const [, asset] of html.matchAll(/(?:src|href)="(v3\/[^"?]+)/g)) {
  if (!fs.existsSync(path.join(target, asset))) throw new Error(`Missing VIM asset: ${asset}`)
}
for (const excluded of ['.git', 'node_modules', 'tests', 'scripts', '.claude', 'v2']) {
  if (fs.existsSync(path.join(target, excluded))) throw new Error(`Non-runtime files in deployed app: ${excluded}`)
}
const route = fs.readFileSync(entry, 'utf8')
if (!route.includes('/vim-protocol/index.html?v=3.')) throw new Error('VIM route must point to its complete static entry')
const app = fs.readFileSync(path.join(repoRoot, 'src/App.jsx'), 'utf8')
if (!app.includes("import vimProtocolEntry from './vimProtocolEntry.js'") || !app.includes('window.location.replace(vimProtocolEntry)')) {
  throw new Error('Portfolio must open the generated VIM Protocol entry')
}
if (!fs.existsSync(sourceRoot)) {
  console.log('[vim-protocol:fresh] Hosted entry and assets verified; source comparison skipped on this host.')
  process.exit(0)
}
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory()
    ? files(path.join(dir, e.name)).map(f => path.join(e.name, f)) : [e.name])
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vim-v3-fresh-'))
try {
  const expected = path.join(tmp, 'runtime')
  const expectedEntry = path.join(tmp, 'entry.js')
  execFileSync(process.execPath, [path.join(repoRoot, 'scripts/sync-vim-protocol.mjs')], {
    stdio: ['ignore', 'ignore', 'inherit'],
    env: { ...process.env, VIM_PROTOCOL_TARGET: expected, VIM_PROTOCOL_ENTRY: expectedEntry },
  })
  const sourceFiles = files(expected).sort()
  const hostedFiles = files(target).sort()
  if (JSON.stringify(sourceFiles) !== JSON.stringify(hostedFiles)) throw new Error('VIM file list is stale; run npm run sync:vim-protocol')
  for (const file of sourceFiles) {
    if (!fs.readFileSync(path.join(expected, file)).equals(fs.readFileSync(path.join(target, file)))) {
      throw new Error(`Stale VIM asset ${file}; run npm run sync:vim-protocol`)
    }
  }
  if (!fs.readFileSync(entry).equals(fs.readFileSync(expectedEntry))) throw new Error('Stale VIM route entry; run npm run sync:vim-protocol')
  console.log('[vim-protocol:fresh] VIM Protocol 3 runtime and route match source.')
} finally {
  fs.rmSync(tmp, { recursive: true, force: true })
}
