const fs = require('fs')
const path = require('path')
const read = file => JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8'))
const compile = read('compile.json')
const jest = read('jest-results.json')
const audit = read('audit.json')
const validation = {
  scope: ['outputs/pages/task-board.mpx', 'outputs/components/rating-selector.mpx', 'outputs/components/segmented-control.mpx', 'outputs/app.json'],
  target: ['wx Skyline', 'wx WebView'],
  static: {
    status: audit.status,
    eslint: { status: 'pass', errors: 0, warnings: 0, evidence: 'eslint-final.log' },
    audit: { status: audit.status, rulesReviewed: audit.ruleCount, errorResiduals: audit.errorResiduals, warningResiduals: audit.warningResiduals, evidence: ['audit.json', 'audit-pass.log', 'audit-candidates.log'] }
  },
  real_compile: {
    status: compile.success ? 'pass' : 'fail', target: compile.target,
    entry: 'outputs/pages/task-board.mpx', recursiveComponents: true,
    errors: compile.errors, warnings: compile.warnings,
    evidence: ['compile.cjs', 'compile.json', 'compile-final.log'],
    limitation: '真实 Mpx wx 编译；未启动微信渲染引擎，也不代表设备兼容验收。'
  },
  mock: {
    status: jest.success ? 'pass' : 'fail', total: jest.numTotalTests, passed: jest.numPassedTests, failed: jest.numFailedTests,
    evidence: ['behavior.test.cjs', 'jest.config.cjs', 'jest-final.log', 'jest-results.json', 'page.transformed.js', 'segmented.transformed.js', 'rating.transformed.js'],
    method: '真实 setup 转换后的脚本 + Vue 响应式模拟 + 模板绑定驱动 + wx/实例/计时器 mock',
    cases: jest.testResults.flatMap(suite => suite.assertionResults.map(test => ({ name: test.fullName, status: test.status }))),
    limitation: '未执行真实 Mpx 实例挂载、glass-easel 属性校验、微信布局或原生触摸分发。'
  },
  developer_tools: { status: 'not_run', reason: '未启动微信开发者工具。' },
  real_device: {
    skyline: { status: 'not_run', reason: '本轮未连接微信真机。' },
    webview: { status: 'not_run', reason: '本轮未连接微信真机，renderer 调试覆盖及回退路径未验收。' }
  },
  failureInjection: { entry: '/pages/task-board?refreshFail=1', behavior: '下一次刷新失败一次，列表/评分保留，后续刷新可成功。' },
  attempts: {
    jestRuns: 4, retriesAfterInitialFailure: 3,
    notes: ['初次 Watchman 权限错误，测试配置关闭 Watchman。', '两次联动测试失败/定位：适配器 sync 属性解构索引错误。', '第三次后续尝试修正适配器后 21/21 通过。', '编译证据脚本相对路径曾修正一次；真实最终编译通过。', '静态断言两次误召回已修正，最终审计通过。']
  },
  sourceHashes: audit.sourceHashes,
  report: '../outputs/report.md'
}
fs.writeFileSync(path.join(__dirname, 'validation.json'), JSON.stringify(validation, null, 2) + '\n')
console.log(JSON.stringify({ static: validation.static.status, compile: validation.real_compile.status, mock: validation.mock.status, tests: validation.mock.passed, native: 'not_run' }))
