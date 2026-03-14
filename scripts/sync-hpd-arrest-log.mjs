import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_SOURCE =
  '/Users/nathanielweeks/Documents/codex_projects/hpd_arrest_log_viewer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const sourceRoot = process.env.HPD_ARREST_LOG_SOURCE || DEFAULT_SOURCE
const exportScript = path.join(sourceRoot, 'scripts', 'export_portfolio_snapshot.py')
const outputDir = path.join(repoRoot, 'public', 'hpd-arrest-log')
const outputFile = path.join(outputDir, 'snapshot.json')
const pythonCandidates = [
  path.join(sourceRoot, '.venv', 'bin', 'python'),
  'python3',
]

if (!fs.existsSync(sourceRoot)) {
  console.error(`Source project not found: ${sourceRoot}`)
  process.exit(1)
}

if (!fs.existsSync(exportScript)) {
  console.error(`Export script not found: ${exportScript}`)
  process.exit(1)
}

fs.mkdirSync(outputDir, { recursive: true })

let lastError = null

for (const python of pythonCandidates) {
  try {
    execFileSync(
      python,
      [exportScript, '--output', outputFile],
      { stdio: 'inherit' },
    )
    console.log(`Synced HPD Arrest Log snapshot from ${sourceRoot}`)
    process.exit(0)
  } catch (error) {
    lastError = error
  }
}

if (lastError) {
  throw lastError
}
