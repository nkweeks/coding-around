// Sync VIM DOJO (the v2 rebuild) into public/vim-dojo as a fully static
// game. Unlike /vim-protocol (V1), v2 is self-contained vanilla JS with
// relative asset paths, so it needs no React shell — just a <base> tag so
// bare `/vim-dojo` (no trailing slash) still resolves assets.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_SOURCE =
  '/Users/nathanielweeks/Documents/claude_code_projects/hacking_game/v2'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const sourceRoot = process.env.VIM_DOJO_SOURCE || DEFAULT_SOURCE
const targetRoot = process.env.VIM_DOJO_TARGET
  ? path.resolve(process.env.VIM_DOJO_TARGET)
  : path.join(repoRoot, 'public', 'vim-dojo')

if (!fs.existsSync(sourceRoot)) {
  console.error(`Source project not found: ${sourceRoot}`)
  process.exit(1)
}

fs.mkdirSync(path.dirname(targetRoot), { recursive: true })

execFileSync(
  'rsync',
  [
    '-a',
    '--delete',
    '--exclude', '.DS_Store',
    '--exclude', '.claude',
    '--exclude', 'serve.py',
    '--exclude', 'test',
    '--exclude', 'README.md',
    '--exclude', 'DESIGN.md',
    `${sourceRoot}/`,
    `${targetRoot}/`,
  ],
  { stdio: 'inherit' },
)

const targetIndex = path.join(targetRoot, 'index.html')
let indexHtml = fs.readFileSync(targetIndex, 'utf8')

if (!indexHtml.includes('<base href="/vim-dojo/">')) {
  indexHtml = indexHtml.replace(
    /<title>([\s\S]*?)<\/title>/i,
    '<title>$1 | Coding Around</title>\n  <base href="/vim-dojo/">',
  )
}

// Back-link to the portfolio, injected after <body> so it floats over the
// title screen without touching game markup.
if (!indexHtml.includes('data-portfolio-link="true"')) {
  indexHtml = indexHtml.replace(
    /<body([^>]*)>/i,
    `<body$1>\n  <a href="/" data-portfolio-link="true" style="position:fixed;top:10px;left:10px;z-index:9999;font-family:monospace;font-size:11px;letter-spacing:.1em;color:#7af;opacity:.7;text-decoration:none;">← PORTFOLIO</a>`,
  )
}

fs.writeFileSync(targetIndex, indexHtml)
console.log(`Synced VIM DOJO from ${sourceRoot}`)
