const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const assert = require('assert')

const compile = require('./compile.json')
const audit = require('./audit.json')
const jest = require('./jest-result.json')
assert.strictEqual(compile.success, true)
assert.strictEqual(audit.status, 'passed')
assert.strictEqual(jest.success, true)
assert.strictEqual(fs.readFileSync(path.join(__dirname, 'eslint.log'), 'utf8'), '')
const businessFiles = ['pages/task-board.mpx', 'components/rating-selector.mpx', 'components/segmented-control.mpx', 'app.json']
const hashes = {}
businessFiles.forEach(file => {
  hashes[file] = crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname, '../outputs', file))).digest('hex')
})
assert(fs.existsSync(path.resolve(__dirname, '../outputs/report.md')))
const validation = {
  scope: { platform: 'wx', renderers: ['webview', 'skyline'], businessFiles, sourceHashesSha256: hashes },
  static: {
    status: 'passed',
    eslint: { status: 'passed', errors: 0, warnings: 0, evidence: 'eslint.log' },
    skylineAudit: { status: audit.status, rulesReviewed: audit.rulesReviewed, unresolvedErrors: audit.unresolvedErrors, unresolvedWarnings: audit.unresolvedWarnings, evidence: ['audit.json', 'audit-command.txt', 'audit-candidates.log', 'audit.log'] }
  },
  realCompile: {
    status: compile.success ? 'passed' : 'failed', target: compile.target,
    scope: 'page entry with ignoreSubComponents=false; all three delivered SFCs',
    errors: compile.errors, warnings: compile.warnings,
    evidence: ['compile.cjs', 'compile.json', 'compile.log', 'compiled/'],
    fullHostApp: { status: 'not_run', reason: 'Input contains only host app.json, not the host home/app source' }
  },
  mock: {
    status: jest.success ? 'passed' : 'failed', passed: jest.numPassedTests, failed: jest.numFailedTests,
    evidence: ['business.test.cjs', 'harness.cjs', 'jest.config.cjs', 'jest-result.json', 'jest.log', 'mock-scripts/'],
    method: 'Real SFC/setup compiler, compiled WXML event/dataset binding, mocked host and component mounting; Vue reactivity',
    coverage: ['category route init and fallback', 'filter/count', 'task toggle', 'empty state', 'refresh success/reset', 'refresh injected failure/retention/recovery', 'repeated pagination/category/unique keys', 'default props', 'repeated parent value updates', 'readonly and control/item disabled', 'missing/empty/null/async options', 'exact change detail', 'instance isolation', 'touchend/touchcancel', 'page component registration/props/change writeback', 'mock window resize and home action'],
    limits: ['No native renderer', 'Parent-to-child updates explicitly driven by mock sync', 'Empty state reached via injected unmatched category', 'Mock window height checks do not prove visual layout']
  },
  developerTools: { status: 'not_run', reason: 'No connected WeChat developer tools session' },
  realDevice: { status: 'not_run', reason: 'No connected WeChat device', pending: ['WebView/Skyline visual parity', 'actual narrow screen scroll area', 'native refresher completion', 'native scroll-to-lower events', 'text truncation', 'touch scale/opacity animation', 'status bar/capsule/safe area'] },
  corrections: {
    jestRunnerAndHarness: { count: 2, causes: ['Watchman permission denied; disabled Watchman in local test config', 'Setup compiler is a webpack loader; supplied its real loader context'], evidence: ['jest-attempt-1.log', 'jest-attempt-2.log'] },
    staticAuditHarness: { count: 1, cause: 'Escaped numeric braces in text max-lines regex', evidence: 'audit-attempt-1.log' }
  }
}
fs.writeFileSync(path.join(__dirname, 'validation.json'), JSON.stringify(validation, null, 2) + '\n')
console.log(JSON.stringify({ delivered: businessFiles.concat('report.md'), compile: 'passed', eslint: 'passed', auditRules: audit.rulesReviewed, jestPassed: jest.numPassedTests, realDevice: 'not_run' }, null, 2))
