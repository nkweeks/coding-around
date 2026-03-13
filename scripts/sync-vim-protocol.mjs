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
    'LEVEL_AUDIT.md',
    `${sourceRoot}/`,
    `${targetRoot}/`,
  ],
  { stdio: 'inherit' },
)

const imageDir = path.join(targetRoot, 'images')
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

if (!indexHtml.includes('.portfolio-link {')) {
  indexHtml = indexHtml.replace(
    '</head>',
    `  <style>
    .portfolio-link {
      position: fixed;
      top: 18px;
      left: 18px;
      z-index: 50;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border: 1px solid rgba(114, 241, 214, 0.28);
      border-radius: 999px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #d8fff8;
      background: rgba(2, 11, 15, 0.82);
      backdrop-filter: blur(12px);
      text-decoration: none;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
    }

    .portfolio-link:hover {
      border-color: rgba(114, 241, 214, 0.52);
      color: #ffffff;
    }

    .portfolio-link::before {
      content: '←';
      font-size: 13px;
    }
  </style>
</head>`,
  )
}

if (!indexHtml.includes('class="portfolio-link"')) {
  indexHtml = indexHtml.replace('<body>', '<body>\n  <a class="portfolio-link" href="/">Back to portfolio</a>')
}

fs.writeFileSync(targetIndex, indexHtml)

const bodyMatch = indexHtml.match(/<body>([\s\S]*?)<\/body>/i)
if (!bodyMatch) {
  console.error('Could not extract VIM Protocol body markup for app shell')
  process.exit(1)
}

const bodyMarkup = bodyMatch[1]
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/class="portfolio-link"/g, 'class="vim-portfolio-link"')
  .trim()
  .replace(/`/g, '\\`')
  .replace(/\$\{/g, '\\${')

const shellSource = `const vimProtocolShell = String.raw\`\n${bodyMarkup}\n\`\n\nexport default vimProtocolShell\n`
fs.writeFileSync(shellFile, shellSource)

console.log(`Synced VIM Protocol from ${sourceRoot}`)
