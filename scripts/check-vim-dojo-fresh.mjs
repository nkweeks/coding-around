// Freshness guard for the VIM DOJO static copy — same contract as
// check-vim-protocol-fresh.mjs: sync the source into a temp dir and
// byte-compare against the committed public/vim-dojo. Skips when the
// source repo isn't present (CI), fails the deploy gate when stale.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

const DEFAULT_SOURCE =
  '/Users/nathanielweeks/Documents/claude_code_projects/hacking_game/v2'
const sourceRoot = process.env.VIM_DOJO_SOURCE || DEFAULT_SOURCE
const committedTarget = path.join(repoRoot, 'public', 'vim-dojo')

if (!fs.existsSync(sourceRoot)) {
  console.log(
    `[vim-dojo:fresh] source repo not present (${sourceRoot}); skipping freshness check.`,
  )
  process.exit(0)
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vimdojo-fresh-'))
const tmpTarget = path.join(tmpRoot, 'vim-dojo')

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

try {
  execFileSync('node', [path.join(__dirname, 'sync-vim-dojo.mjs')], {
    stdio: ['ignore', 'ignore', 'inherit'],
    env: { ...process.env, VIM_DOJO_TARGET: tmpTarget },
  })

  const expected = new Set(listFiles(tmpTarget))
  const actual = new Set(listFiles(committedTarget))
  const problems = []
  for (const rel of expected) {
    if (!actual.has(rel)) {
      problems.push(`missing (not synced/committed): public/vim-dojo/${rel}`)
      continue
    }
    const a = fs.readFileSync(path.join(tmpTarget, rel))
    const b = fs.readFileSync(path.join(committedTarget, rel))
    if (!a.equals(b)) problems.push(`out of date: public/vim-dojo/${rel}`)
  }
  for (const rel of actual) {
    if (!expected.has(rel)) {
      problems.push(`stale extra file (source deleted it): public/vim-dojo/${rel}`)
    }
  }

  if (problems.length > 0) {
    console.error('\n[vim-dojo:fresh] STALE ASSETS DETECTED:\n')
    for (const p of problems) console.error(`  - ${p}`)
    console.error(
      '\nFix: run `npm run sync:vim-dojo`, then commit the changes before deploying.\n',
    )
    process.exit(1)
  }
  console.log('[vim-dojo:fresh] assets are in sync with the source repo.')
} finally {
  try {
    fs.rmSync(tmpRoot, { recursive: true, force: true })
  } catch {
    /* best-effort */
  }
}
