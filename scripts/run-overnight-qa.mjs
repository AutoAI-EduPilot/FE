import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const deadline = new Date(process.env.QA_DEADLINE ?? '2026-09-12T10:00:00+09:00')
const cleanupAt = new Date(deadline.getTime() - 30 * 60 * 1000)
const intervalMs = Number(process.env.QA_SOAK_INTERVAL_MS ?? 30 * 60 * 1000)
const results = []
const configurationWarnings = credentialWarnings()
const npmCli = process.env.npm_execpath ?? join(
  dirname(process.execPath),
  process.platform === 'win32' ? 'node_modules/npm/bin/npm-cli.js' : '../lib/node_modules/npm/bin/npm-cli.js',
)

if (Number.isNaN(deadline.getTime())) throw new Error('QA_DEADLINE must be an ISO-8601 timestamp')

run('lint', process.execPath, [npmCli, 'run', 'lint'])
run('typecheck', process.execPath, [npmCli, 'run', 'typecheck'])
run('unit', process.execPath, [npmCli, 'run', 'test:run'])
run('build', process.execPath, [npmCli, 'run', 'build'])
runE2e('mock', true)
runE2e('dev', false)
runE2e('prod', false)

while (Date.now() + intervalMs < cleanupAt.getTime()) {
  await sleep(intervalMs)
  runE2e('dev', false)
  runE2e('prod', false)
}

runIssuePass('mock')
runIssuePass('dev')
runIssuePass('prod')
writeSummary()
if (Date.now() < deadline.getTime()) await sleep(deadline.getTime() - Date.now())
writeSummary(true)

function runE2e(environment, fullMatrix) {
  run(`e2e-${environment}`, process.execPath, ['node_modules/@playwright/test/cli.js', 'test'], {
    QA_ENV: environment,
    QA_FULL_MATRIX: fullMatrix ? '1' : '0',
  })
  runIssuePass(environment)
}

function runIssuePass(environment) {
  run(`issues-${environment}`, process.execPath, ['scripts/report-qa-issues.mjs'], { QA_ENV: environment })
}

function run(name, command, args, extraEnv = {}) {
  if (Date.now() >= cleanupAt.getTime()) return
  const startedAt = new Date().toISOString()
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    env: { ...process.env, ...extraEnv },
    shell: false,
    stdio: 'inherit',
  })
  results.push({
    code: result.status ?? 1,
    error: result.error?.message,
    finishedAt: new Date().toISOString(),
    name,
    startedAt,
  })
  writeSummary()
}

function writeSummary(completed = false) {
  mkdirSync('qa-artifacts', { recursive: true })
  writeFileSync('qa-artifacts/overnight-summary.json', `${JSON.stringify({
    completed,
    configurationWarnings,
    deadline: deadline.toISOString(),
    results,
  }, null, 2)}\n`)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function credentialWarnings() {
  const warnings = []
  for (const environment of ['DEV', 'PROD']) {
    for (const role of ['LEARNER', 'INSTRUCTOR', 'ADMIN']) {
      if (!process.env[`${environment}_QA_${role}_EMAIL`] || !process.env[`${environment}_QA_${role}_PASSWORD`]) {
        warnings.push(`${environment} ${role} authenticated checks will be skipped: QA credentials are not configured`)
      }
    }
  }
  if (process.env.GITHUB_ACTIONS && process.env.QA_CREATE_ISSUES === 'true' && !process.env.GH_TOKEN) {
    warnings.push('Issue creation will fall back to local drafts: GH_TOKEN is not configured')
  }
  return warnings
}
