// Freshness guard (VP-10): fail the deploy gate if the committed VIM Protocol
// assets are stale relative to the source-of-truth repo.
//
// "Stale" = someone edited the game source but did not re-run
// `npm run sync:vim-protocol` and commit the result. We detect this WITHOUT
// touching the tracked working tree: sync into a throwaway temp dir (via the
// VIM_PROTOCOL_TARGET / VIM_PROTOCOL_SHELL overrides) and compare byte-for-byte
// against the committed copies.
//
// If the source repo is not present (e.g. a CI runner that only has the
// portfolio checkout), there is nothing to compare against, so we skip rather
// than fail. The source is always present during this project's manual deploy
// flow (check:deploy + push), which is where this guard does its job.

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

const DEFAULT_SOURCE =
  '/Users/nathanielweeks/Documents/claude_code_projects/hacking_game'
const sourceRoot = process.env.VIM_PROTOCOL_SOURCE || DEFAULT_SOURCE

const committedTarget = path.join(repoRoot, 'public', 'vim-protocol')
const committedShell = path.join(repoRoot, 'src', 'vimProtocolShell.js')
const appSourceFile = path.join(repoRoot, 'src', 'App.jsx')

// The React route (src/App.jsx -> VimProtocolPage) does NOT use the game's
// index.html: it injects the body markup (vimProtocolShell.js) and then loads
// the game's scripts from a hand-maintained list (VIM_PROTOCOL_SCRIPT_PATHS).
// If the game adds/removes a <script> but that list isn't updated, the deployed
// game silently breaks (e.g. game.js referencing an undefined class), even
// though the static /vim-protocol/index.html is fine. Guard against that drift.
function extractGameScripts(html) {
  return new Set(
    [...html.matchAll(/<script[^>]*\bsrc=["'](js\/[A-Za-z0-9_\-/.]+\.js)["']/gi)].map(
      (m) => m[1],
    ),
  )
}

function extractLoaderScripts(appSource) {
  return new Set(
    [...appSource.matchAll(/\/(js\/[A-Za-z0-9_\-/.]+\.js)\b/g)].map((m) => m[1]),
  )
}

function diffScriptManifest(expectedHtml, loaderSource) {
  const expected = extractGameScripts(expectedHtml)
  const actual = extractLoaderScripts(loaderSource)
  const out = []
  for (const rel of expected) {
    if (!actual.has(rel)) {
      out.push(`missing from React loader (VIM_PROTOCOL_SCRIPT_PATHS): ${rel}`)
    }
  }
  for (const rel of actual) {
    if (!expected.has(rel)) {
      out.push(`stale in React loader (game no longer ships it): ${rel}`)
    }
  }
  return out
}

if (!fs.existsSync(sourceRoot)) {
  console.log(
    `[vim-protocol:fresh] source repo not present (${sourceRoot}); skipping freshness check.`,
  )
  process.exit(0)
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vimproto-fresh-'))
const tmpTarget = path.join(tmpRoot, 'vim-protocol')
const tmpShell = path.join(tmpRoot, 'vimProtocolShell.js')

function cleanup() {
  try {
    fs.rmSync(tmpRoot, { recursive: true, force: true })
  } catch {
    /* best-effort */
  }
}

/**
 * Recursively collect relative file paths under `dir`.
 */
function listFiles(dir) {
  const out = []
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...listFiles(full).map((p) => path.join(entry.name, p)))
    } else {
      out.push(entry.name)
    }
  }
  return out
}

function diffTrees(expectedDir, actualDir) {
  const expected = new Set(listFiles(expectedDir))
  const actual = new Set(listFiles(actualDir))
  const problems = []

  for (const rel of expected) {
    if (!actual.has(rel)) {
      problems.push(`missing (not synced/committed): public/vim-protocol/${rel}`)
      continue
    }
    const a = fs.readFileSync(path.join(expectedDir, rel))
    const b = fs.readFileSync(path.join(actualDir, rel))
    if (!a.equals(b)) {
      problems.push(`out of date: public/vim-protocol/${rel}`)
    }
  }
  for (const rel of actual) {
    if (!expected.has(rel)) {
      problems.push(`stale extra file (source deleted it): public/vim-protocol/${rel}`)
    }
  }
  return problems
}

try {
  // Sync the source into the temp dir only (working tree untouched).
  execFileSync('node', [path.join(__dirname, 'sync-vim-protocol.mjs')], {
    stdio: ['ignore', 'ignore', 'inherit'],
    env: {
      ...process.env,
      VIM_PROTOCOL_TARGET: tmpTarget,
      VIM_PROTOCOL_SHELL: tmpShell,
    },
  })

  const problems = diffTrees(tmpTarget, committedTarget)

  const freshShell = fs.readFileSync(tmpShell)
  const committedShellExists = fs.existsSync(committedShell)
  if (!committedShellExists || !freshShell.equals(fs.readFileSync(committedShell))) {
    problems.push('out of date: src/vimProtocolShell.js')
  }

  // Verify the React loader's script manifest matches the game's index.html.
  const freshIndex = fs.readFileSync(path.join(tmpTarget, 'index.html'), 'utf8')
  if (fs.existsSync(appSourceFile)) {
    const appSource = fs.readFileSync(appSourceFile, 'utf8')
    problems.push(...diffScriptManifest(freshIndex, appSource))
  }

  if (problems.length > 0) {
    console.error('\n[vim-protocol:fresh] STALE ASSETS DETECTED:\n')
    for (const p of problems) console.error(`  - ${p}`)
    console.error(
      '\nThe committed VIM Protocol assets do not match the source repo.\n' +
        'Fix: run `npm run sync:vim-protocol`, then commit the changes before deploying.\n',
    )
    process.exit(1)
  }

  console.log('[vim-protocol:fresh] assets are in sync with the source repo.')
} finally {
  cleanup()
}
