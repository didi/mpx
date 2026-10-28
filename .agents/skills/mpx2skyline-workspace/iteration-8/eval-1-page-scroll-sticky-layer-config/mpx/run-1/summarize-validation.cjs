const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const cp = require('child_process')

const outputs = path.resolve(__dirname, '../outputs')
const skill = path.resolve('iteration-8/skill-snapshots/mpx')
const matrix = fs.readFileSync(path.join(skill, 'references/skyline/skyline-audit-matrix.md'), 'utf8')
const pattern = matrix.match(/rg -n -U "([^\n]+)" <scope>/)[1].replace(/\\\\/g, '\\')
const scan = cp.spawnSync('rg', ['-n', '-U', pattern, outputs, '-g', '*.mpx', '-g', '*.json', '-g', '*.js'], { encoding: 'utf8' })
if (scan.status !== 0 && scan.status !== 1) throw new Error(scan.stderr)
fs.writeFileSync(path.join(__dirname, 'static-scan.log'), scan.stdout)

const notes = {
  CONFIG_APP_SKYLINE_OPTIONS: 'pass_static: requiredComponents 与 Skyline 五项配置齐全；pages/window/webview 保持输入。',
  CONFIG_PAGE_SKYLINE: 'pass_static: Skyline/glass-easel/custom/disableScroll；实际自定义导航，页面刷新关闭。',
  COMP_SCROLL_TYPE: 'pass_static: 外层 nested，主体 custom，两个 renderer 分支的横向区均为 list。',
  COMP_SCROLL_LIST_DIRECT_CHILD: 'pass_static: 横向 list 的订单 tile 为直接子节点，无列表 wrapper。',
  COMP_SCROLL_NESTED: 'pass_static: nested 外层与 custom 主体通过 associative-container 关联；原生联动 not_run。',
  COMP_SCROLL_HORIZONTAL: 'pass_static: 两个分支均 scroll-x + enable-flex + display:flex + flex-direction:row。',
  COMP_SCROLL_HORIZONTAL_CHILD_WIDTH: 'pass_static: 横向直接子节点 tile 明确 width:120px 和 flex-shrink:0。',
  COMP_SCROLL_REFRESHER_SLOT: 'pass_static: 使用默认刷新样式，没有自定义刷新节点；成功失败均复位 refreshing。',
  COMP_TEXT_CHILDREN: 'pass_static: text 仅含纯文字或插值，无非 text 子树。',
  COMP_STICKY_STRUCTURE: 'pass_static: Skyline 分支 custom > sticky-section > 首子 sticky-header，header 背景 #fff；WebView 分支 CSS sticky。真机吸顶 not_run。',
  STYLE_FLEX_TEXT_WRAP: 'pass_static: nav-title 宽度100%；modal 为短文案且父级视口宽，tile 有120px宽度。',
  STYLE_Z_INDEX_CONTEXT: 'pass_static: modal 与 fab 为 page 的 fixed 兄弟，20 > 10；无 transform/opacity 层叠依赖。WebView sticky 只存在于其分支。实际覆盖 not_run。',
  SCROLL_CONTEXT_ENHANCED: 'not_applicable: 没有 NodesRef.node/ScrollViewContext 调用。',
  WX_FOR_DATA_TYPE: 'pass_static: sections 初始[]，service 始终返回数组，各组items始终数组；失败不覆盖列表。'
}
const rules = [...matrix.matchAll(/^\| `([A-Z_]+)` \| (error|warn) \|/gm)].map(match => ({
  id: match[1],
  level: match[2],
  review: notes[match[1]] || 'not_applicable: 完整 SFC、页面 JSON、app.json 和 service 中未使用本规则涉及的能力。'
}))
fs.writeFileSync(path.join(__dirname, 'audit-matrix.json'), JSON.stringify({
  type: 'static',
  scope: ['outputs/orders.mpx (template/script/style/page JSON)', 'outputs/app.json', 'outputs/service.js', 'root mpx.config.js / babel.config.json (read only)'],
  componentTree: 'only native components; no business components or unreviewed child subtree',
  buildConfig: 'wx target, srcMode wx; no Worklet; compile tool uses existing environment config unchanged',
  rules,
  unresolvedStaticErrors: [],
  runtimeLimit: '静态结构复核不能证明原生嵌套滚动、吸顶、刷新手势、层级与横向手势；均 not_run。'
}, null, 2) + '\n')

const rawCompile = fs.readFileSync(path.join(__dirname, 'compile-wx.json'), 'utf8')
const compile = JSON.parse(rawCompile.slice(rawCompile.indexOf('{')))
const jest = JSON.parse(fs.readFileSync(path.join(__dirname, 'jest-results.json'), 'utf8'))
if (!compile.success || !jest.success) throw new Error('Validation failed')
const hashes = {}
;['orders.mpx', 'app.json', 'service.js'].forEach(file => {
  hashes[file] = crypto.createHash('sha256').update(fs.readFileSync(path.join(outputs, file))).digest('hex')
})
fs.writeFileSync(path.join(__dirname, 'validation.json'), JSON.stringify({
  target: 'wx',
  renderers: ['webview', 'skyline'],
  artifactsSha256: hashes,
  static: { status: 'pass', evidence: ['audit-matrix.json', 'static-scan.log', 'jest-results.json'], ruleCount: rules.length, scope: 'orders.mpx all four SFC blocks, app.json and service.js; no custom components' },
  eslint: { status: 'pass', exitCode: 0, evidence: 'eslint.log', command: 'npm run lint -- iteration-8/eval-1-page-scroll-sticky-layer-config/mpx/outputs/orders.mpx iteration-8/eval-1-page-scroll-sticky-layer-config/mpx/outputs/service.js' },
  mock: { status: 'pass', evidence: ['mock-evidence.json', 'orders.test.cjs', 'jest-results.json', 'jest.log'], testsPassed: jest.numPassedTests, testsFailed: jest.numFailedTests, scenarios: ['initial fetchOrders(1)', 'pagination page 2 and 3', 'refresh replacement', 'refresh failure retention and feedback reset', 'continue after failure', 'main e.detail.scrollTop', 'modal open/close', 'resize', 'pagination lock/failure/retry'], boundary: 'Real service data function, captured createPage options and mocked window/menu APIs; renderer labels are fixture instances, not native renderers.', attempts: [{ result: 'environment_failure_before_tests', reason: 'Watchman state directory permission', evidence: 'jest-attempt-1.log' }, { result: 'pass', change: 'CLI --watchman=false', evidence: 'jest.log' }], businessCodeFixesAfterFailure: 0 },
  realCompile: { status: 'pass', target: 'wx', type: 'page', errors: compile.errors, warnings: compile.warnings, evidence: ['compile-wx.json', 'compile-wx.stderr.log'], command: 'npm run compile-validate -- iteration-8/eval-1-page-scroll-sticky-layer-config/mpx/outputs/orders.mpx --target=wx --type=page --json', boundary: 'Real SFC wx compile with provided tool; app.json is statically checked, no full app build. Compilation does not exercise native UI.' },
  runtime: { webview: { status: 'not_run', reason: 'No WeChat runtime session used' }, skyline: { status: 'not_run', reason: 'No WeChat runtime session used' } },
  realDevice: { status: 'not_run', checks: ['nested handoff and overview scroll-away', 'sticky group headers', 'vertical and horizontal gesture ownership', 'native refresher success/failure feedback', 'scrolltolower and scroll event dispatch', 'fixed modal covers floating button'], reason: 'No device session available for this delivery' }
}, null, 2) + '\n')
console.log(JSON.stringify({ staticRulesReviewed: rules.length, jestTestsPassed: jest.numPassedTests, compile: compile.success, evidence: 'validation.json' }))
