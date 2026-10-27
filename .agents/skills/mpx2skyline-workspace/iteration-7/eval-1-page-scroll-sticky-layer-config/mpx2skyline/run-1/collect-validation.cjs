const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const assert = require('assert/strict')
const cwd = '/Users/didi/work/mpx/.agents/skills/mpx2skyline-workspace'
assert.equal(process.cwd(), cwd)
const prefix = 'iteration-7/eval-1-page-scroll-sticky-layer-config/mpx2skyline/'
const run = prefix + 'run-1/'
const readJson = name => JSON.parse(fs.readFileSync(path.join(__dirname, name), 'utf8'))
const audit = readJson('audit-results.json')
const jest = readJson('jest-results.json')
const eslint = readJson('eslint-results.json')
const compileLog = fs.readFileSync(path.join(__dirname, 'compile.log'), 'utf8')
const compile = JSON.parse(compileLog.slice(compileLog.indexOf('{\n  "success":')))
assert.equal(audit.status, 'passed')
assert.equal(jest.success, true)
assert.equal(jest.numPassedTests, 6)
assert(eslint.every(result => result.errorCount === 0 && result.warningCount === 0))
assert.equal(compile.success, true)
assert.equal(compile.errors.length, 0)
assert.equal(compile.warnings.length, 0)
const files = ['orders.mpx', 'app.json', 'service.js', 'report.md'].map(file => ({
  file: prefix + 'outputs/' + file,
  sha256: crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname, '../outputs', file))).digest('hex')
}))
const validation = {
  cwd,
  scope: { platform: 'wx', renderers: ['skyline', 'webview'], files: files.map(item => item.file), businessChildComponents: [], excluded: ['home source (not supplied)', 'other platforms'] },
  artifacts: files,
  static: { status: 'passed', matrixRules: audit.matrixRuleCount, unresolvedErrors: audit.unresolvedErrors, unresolvedWarnings: audit.unresolvedWarnings, evidence: ['audit-results.json', 'audit.log'], command: 'node ' + run + 'audit.cjs' },
  eslint: { status: 'passed', errors: 0, warnings: 0, evidence: ['eslint-results.json', 'eslint.log'], command: 'node node_modules/eslint/bin/eslint.js --config ' + run + 'eslint.config.cjs --format json --output-file ' + run + 'eslint-results.json ' + prefix + 'outputs/orders.mpx ' + prefix + 'outputs/service.js' },
  mock: { status: 'passed', runner: 'Jest', total: jest.numTotalTests, passed: jest.numPassedTests, failed: jest.numFailedTests, cases: ['initial fetchOrders(1): 4 groups, 8 items each, unique IDs', 'two consecutive pages: page 2 and page 3, original objects retained', 'refresh replaces page 1', 'fetchOrders(1, true) rejection preserves list/page and clears refresher', 'continue pagination and refresh after rejection', 'main scrollTop from detail; horizontal/outer bindings isolated', 'window resize and modal state', 'single-flight requests and failed pagination retry'], evidence: ['jest.log', 'jest-results.json', 'mock-evidence.json', 'orders.test.cjs'], command: 'node /Users/didi/work/mpx/node_modules/jest/bin/jest.js --config ' + run + 'jest.config.cjs --watchman=false --runInBand --json --outputFile=' + run + 'jest-results.json', limitations: 'Mock createPage registration and wx APIs; no Mpx reactive runtime or native rendering/event delivery.' },
  real_compile: { status: 'passed', target: compile.target, type: 'page', errors: compile.errors, warnings: compile.warnings, evidence: ['compile.log'], command: 'npm run compile-validate -- ' + prefix + 'outputs/orders.mpx --type=page --no-ignore-sub-components --json', limitations: 'Page/dependency build only. app.json checked statically; no full host app or native renderer launch.' },
  full_app_build: { status: 'not_run', reason: 'Home and complete host app source not supplied.' },
  developer_tools_rendering: { status: 'not_run', reason: 'No running WeChat Mini Program preview session.' },
  device: { status: 'not_run', renderers: ['skyline', 'webview'], cases: { nested_scrolling: 'not_run', sticky_headers: 'not_run', gestures_and_horizontal_scrolling: 'not_run', native_refresher_success_and_failure: 'not_run', native_pagination_including_short_content: 'not_run', scroll_position_ui: 'not_run', fullscreen_modal_layering: 'not_run' } },
  repairs: [
    { tool: 'Jest startup', fixes: 1, reason: 'Sandbox Watchman fchmod access denied; rerun with --watchman=false.', evidence: ['jest-attempt-1.log', 'jest.log'] },
    { tool: 'Static audit helper', fixes: 2, reason: 'Fixed unmatched parenthesis, then constrained direction pattern so flex-direction is not treated as unsupported direction.', evidence: ['audit-attempt-1.log', 'audit-attempt-2.log', 'audit.log'] }
  ],
  inputIntegrity: { serviceUnchanged: fs.readFileSync(prefix + 'outputs/service.js', 'utf8') === fs.readFileSync('iteration-7/eval-1-page-scroll-sticky-layer-config/input/service.js', 'utf8'), originalAppFieldsPreserved: ['pages', 'window', 'rendererOptions.webview'] }
}
fs.writeFileSync(path.join(__dirname, 'validation.json'), JSON.stringify(validation, null, 2) + '\n')
console.log(JSON.stringify({ static: audit.status, matrixRules: audit.matrixRuleCount, eslint: 'passed', jestPassed: jest.numPassedTests, compile: compile.success, device: 'not_run', artifacts: files.map(item => item.file) }, null, 2))
