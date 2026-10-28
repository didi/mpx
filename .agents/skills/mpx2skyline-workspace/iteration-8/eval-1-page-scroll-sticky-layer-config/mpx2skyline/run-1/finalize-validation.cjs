const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const assert = require('assert/strict')
const dir = __dirname
const root = process.cwd()
const prefix = 'iteration-8/eval-1-page-scroll-sticky-layer-config/mpx2skyline/'
const read = name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'))
const lint = read('eslint.json')
const jest = read('jest.json')
const stat = read('static.json')
const compile = read('compile.json')
assert.ok(jest.success)
assert.equal(jest.numPassedTests, 6)
assert.equal(stat.status, 'passed')
assert.equal(compile.success, true)
assert.ok(lint.every(file => !file.errorCount && !file.warningCount))
const files = ['orders.mpx', 'app.json', 'service.js', 'report.md'].map(file => {
  const contents = fs.readFileSync(path.resolve(dir, '../outputs', file))
  return { path: 'outputs/' + file, sha256: crypto.createHash('sha256').update(contents).digest('hex'), bytes: contents.length }
})
const validation = {
  scope: 'wx WebView / Skyline; orders.mpx, embedded page JSON, app.json, service.js; no custom component subtree',
  cwd: root,
  overall: 'passed_available_checks_device_not_run',
  files,
  static: { status: 'passed', checkCount: stat.checks.length, matrixRuleCount: stat.matrixRuleCount, unresolvedErrors: [], unresolvedWarnings: [], evidence: ['static.json', 'static.log', 'audit.json', 'static-check.cjs'] },
  eslint: { status: 'passed', files: ['orders.mpx', 'service.js'], errors: 0, warnings: 0, evidence: ['eslint.json', 'eslint.log', 'lint.cjs'] },
  mock: { status: 'passed', framework: 'Jest', tests: jest.numPassedTests, rendererInstanceValues: ['skyline', 'webview'], environment: 'Node VM; mocked wx and createPage; delivered service.js executed', evidence: ['jest.json', 'jest.log', 'mock-evidence.json', 'orders.test.cjs'], checks: ['initial 4 groups x 8 orders with unique stable ids', 'two consecutive successful pagination calls, preserved original data', 'refresh success replaces page 1', 'fetchOrders(1,true) injected refresh failure retains list and page, clears refreshing', 'continued pagination after refresh failure', 'main scrollTop update and horizontal no-op', 'pagination failure retries same page', 'overlap guard', 'open/close state', 'window resize height recalculation'], limitation: 'No rendering, gesture, native events or screenshot validation.' },
  real_compile: { status: 'passed', target: compile.target, entryType: 'page', errors: compile.errors, warnings: compile.warnings, evidence: ['compile.log', 'compile.json'], tool: 'iteration-8/skill-snapshots/mpx/scripts/compile-validate.js', limitations: ['Page and imported service compilation, includes both runtime template branches.', 'App config statically validated; full app/home page build not_run.'] },
  developer_tools: { status: 'not_run', reason: 'No connected WeChat developer tools runtime.' },
  device: { status: 'not_run', renderers: ['skyline', 'webview'], reason: 'No connected WeChat device runtime.', checks: ['nested vertical scroll and gesture handoff', 'header sticky/push-off', 'horizontal gestures', 'native refresher feedback', 'overlay visual coverage and input hit testing', 'safe area and resize visuals'] },
  attempts: { compile: 1, jest: 2, businessTestFailures: 0, businessCodeFixesAfterTestFailure: 0, startupFailure: 'First Jest launch blocked by Watchman sandbox permission. Disabled watchman; second launch passed.', evidence: 'jest-attempt-1.log', staticProbeNote: 'Installed old mpx-eslint-parser rejected direct ecmaVersion 2022 probe; formal AST check uses supported 2020.' },
  commands: [
    `node ${prefix}run-1/static-check.cjs`,
    `node ${prefix}run-1/lint.cjs`,
    `node /Users/didi/work/mpx/node_modules/jest/bin/jest.js --config='{"rootDir":"./${prefix}run-1","testRegex":"orders\\\\.test\\\\.cjs$","testEnvironment":"node","transform":{},"watchman":false,"cacheDirectory":"<rootDir>/jest-cache"}' --runInBand --json --outputFile=${prefix}run-1/jest.json`,
    `npm run compile-validate -- ${prefix}outputs/orders.mpx --type=page --no-ignore-sub-components --json`
  ]
}
// Store the tested Jest configuration directly to avoid shell/JSON escaping ambiguity.
const jestConfig = { rootDir: dir, testRegex: 'orders\\.test\\.cjs$', testEnvironment: 'node', transform: {}, watchman: false, cacheDirectory: path.join(dir, 'jest-cache') }
fs.writeFileSync(path.join(dir, 'jest.config.json'), JSON.stringify(jestConfig, null, 2) + '\n')
validation.commands[2] = `node /Users/didi/work/mpx/node_modules/jest/bin/jest.js --config=${prefix}run-1/jest.config.json --runInBand --json --outputFile=${prefix}run-1/jest.json`
fs.writeFileSync(path.join(dir, 'validation.json'), JSON.stringify(validation, null, 2) + '\n')
console.log('validation.json written from actual lint, Jest, static and compile results; 4 artifact hashes recorded; device not_run.')
