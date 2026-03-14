import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_SOURCE =
  '/Users/nathanielweeks/Documents/claude_code_projects/hacking_game'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const sourceRoot = process.env.VIM_PROTOCOL_SOURCE || DEFAULT_SOURCE
const targetRoot = path.join(repoRoot, 'public', 'vim-protocol')
const shellFile = path.join(repoRoot, 'src', 'vimProtocolShell.js')
const portfolioImagePrefix = '/vim-protocol/images/'
const targetIndex = path.join(targetRoot, 'index.html')

const TEXT_FILE_EXTENSIONS = new Set(['.html', '.js'])

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
    '--exclude',
    '.DS_Store',
    '--exclude',
    '.claude',
    '--exclude',
    'AGENTS.md',
    '--exclude',
    'CLAUDE.md',
    '--exclude',
    'LEVEL_AUDIT.md',
    `${sourceRoot}/`,
    `${targetRoot}/`,
  ],
  { stdio: 'inherit' },
)

const imageDir = path.join(targetRoot, 'images')
for (const strayFile of ['AGENTS.md', 'CLAUDE.md']) {
  const strayPath = path.join(targetRoot, strayFile)
  if (fs.existsSync(strayPath)) {
    fs.rmSync(strayPath, { force: true })
  }
}

if (fs.existsSync(imageDir)) {
  for (const entry of fs.readdirSync(imageDir)) {
    if (!entry.endsWith('.jpeg')) {
      continue
    }

    const from = path.join(imageDir, entry)
    const to = path.join(imageDir, entry.replace(/\.jpeg$/i, '.jpg'))
    fs.copyFileSync(from, to)
  }
}

const textFiles = []

function walk(dirPath) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath)
      continue
    }

    if (TEXT_FILE_EXTENSIONS.has(path.extname(entry.name))) {
      textFiles.push(fullPath)
    }
  }
}

walk(targetRoot)

for (const file of textFiles) {
  const input = fs.readFileSync(file, 'utf8')
  const output = input
    .replace(/(["'])images\//g, `$1${portfolioImagePrefix}`)
    .replace(/\.jpeg/g, '.jpg')

  if (output !== input) {
    fs.writeFileSync(file, output)
  }
}

let indexHtml = fs.readFileSync(targetIndex, 'utf8')

indexHtml = indexHtml.replace(
  /<title>[\s\S]*?<\/title>/i,
  '<title>VIM Protocol | Coding Around</title>\n  <meta name="theme-color" content="#02080d">\n  <base href="/vim-protocol/">',
)

indexHtml = indexHtml
  .replace(/\s*<style>\s*\.portfolio-link[\s\S]*?<\/style>\s*/i, '\n')
  .replace(/\s*<a class="portfolio-link" href="\/">Back to portfolio<\/a>\s*/i, '\n')

const portfolioNavLink =
  '<a href="/" class="menu-button" data-portfolio-link="true" style="text-decoration:none;display:inline-flex;align-items:center;">← PORTFOLIO</a>'
const bugReportLink =
  '<a href="mailto:hello@codingaround.dev?subject=VIM%20Protocol%20Bug%20Report&body=Describe%20the%20issue%3A%0A%0ASteps%20to%20reproduce%3A%0A1.%20%0A2.%20%0A%0AExpected%20result%3A%0A%0AActual%20result%3A%0A%0ADevice%20and%20browser%3A%0A" class="menu-button" data-bug-report-link="true" style="text-decoration:none;display:inline-flex;align-items:center;">REPORT BUG</a>'

if (!indexHtml.includes('data-portfolio-link="true"')) {
  indexHtml = indexHtml.replace(
    /(<span id="timer">[\s\S]*?<\/span>)/i,
    `$1\n        ${portfolioNavLink}`,
  )
}

if (!indexHtml.includes('data-bug-report-link="true"')) {
  indexHtml = indexHtml.replace(
    /(<button id="home-btn" class="menu-button">HOME<\/button>)/i,
    `${bugReportLink}\n        $1`,
  )
}

fs.writeFileSync(targetIndex, indexHtml)

const bodyMatch = indexHtml.match(/<body>([\s\S]*?)<\/body>/i)
if (!bodyMatch) {
  console.error('Could not extract VIM Protocol body markup for app shell')
  process.exit(1)
}

const bodyMarkup = bodyMatch[1]
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .trim()
  .replace(/`/g, '\\`')
  .replace(/\$\{/g, '\\${')

const shellSource = `const vimProtocolShell = String.raw\`\n${bodyMarkup}\n\`\n\nexport default vimProtocolShell\n`
fs.writeFileSync(shellFile, shellSource)

console.log(`Synced VIM Protocol from ${sourceRoot}`)
