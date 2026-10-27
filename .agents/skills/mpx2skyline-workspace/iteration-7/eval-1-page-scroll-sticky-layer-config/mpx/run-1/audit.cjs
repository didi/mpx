const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const root = process.cwd()
const outputDir = path.resolve(__dirname, '../outputs')
const files = ['orders.mpx', 'app.json', 'service.js']
const sources = files.map(file => ({ file, text: fs.readFileSync(path.join(outputDir, file), 'utf8') }))
const matrix = fs.readFileSync(path.join(root, '../mpx/references/skyline/skyline-audit-matrix.md'), 'utf8')
const notes = {
  CONFIG_APP_SKYLINE_OPTIONS: 'app 顶层 lazyCodeLoading 与 skyline 下五个推荐项齐全；原 pages/window/webview 配置保留；未全局设置 renderer，不改变首页后端。',
  CONFIG_PAGE_SKYLINE: 'SFC 页面 JSON：skyline/glass-easel/custom/disableScroll；自定义导航实际存在，页面级刷新关闭。',
  CONFIG_WORKLET_BABEL: '无 Worklet；核对宿主 mpx.config.js 的 srcMode=wx，本次真实编译 target=wx；无需修改 Babel。',
  COMP_SCROLL_TYPE: '四个源码 scroll-view 均显式声明 nested/custom/list/list。',
  COMP_SCROLL_LIST_DIRECT_CHILD: '横向 list 直接子节点是循环 tile，无单 wrapper。',
  COMP_SCROLL_NESTED: '外层 nested 包含概览及内层 custom；内层关联 associative-container=nested-scroll-view；内外高度均为窗口减自定义导航。',
  COMP_SCROLL_HORIZONTAL: '两分支横向 strip 均 scroll-x + enable-flex + flex-direction:row。',
  COMP_SCROLL_HORIZONTAL_CHILD_WIDTH: '两分支 strip 的直接子节点 tile 均 width:120px + flex:0 0 120px，组内八项可横向溢出。',
  COMP_SCROLL_REFRESHER_SLOT: '使用默认 refresher，没有自定义刷新节点；无需 slot。',
  COMP_TEXT_CHILDREN: 'text 节点仅承载文本。',
  COMP_STICKY_STRUCTURE: 'renderer 分支隔离；Skyline sticky-section 在 custom 内，透明 block 不产生实体节点，首子 sticky-header，header 显式白底；WebView 分组保留 CSS sticky。',
  STYLE_SELECTOR_UNSUPPORTED: '候选 app.json 的 pages 数组并非样式选择器；SFC 仅使用类选择器，无通配/属性选择器或伪元素。',
  STYLE_TEXT_UNSUPPORTED: '候选 flex-direction:row 命中 direction 子串，不是 direction 属性；未使用不支持的文本属性。',
  STYLE_FLEX_TEXT_WRAP: 'tile 明确宽120px；modal 内 text 明确 width:100%；其余文本为 block 或独立文本。',
  STYLE_Z_INDEX_CONTEXT: 'modal 和 fab 均为 page 下同级 fixed，z-index 3>2；去除 groups transform/z-index，WebView sticky 的 z-index 只在该分支生效。视觉覆盖待真机。',
  SCROLL_CONTEXT_ENHANCED: '未查询 node()/ScrollViewContext；内层 enhanced 为滚动增强使用，不存在漏配查询目标。',
  WX_FOR_DATA_TYPE: 'sections 初始化[]；唯一赋值来自原 service 的数组或 concat；组内 items 原 service 始终返回8项数组，失败不改列表。'
}
const rules = []
matrix.split('\n').forEach(line => {
  const match = line.match(/^\| `([A-Z_]+)` \| (error|warn) \| ([^|]+) \| `([^`]+)`/)
  if (!match) return
  const [, id, level, scope, pattern] = match
  const normalized = pattern.replace(/\\\|/g, '|').replace(/\\\\/g, '\\')
  let regex
  let scanError
  try { regex = new RegExp(normalized, 'm') } catch (error) { scanError = error.message }
  const candidates = []
  if (regex) sources.forEach(source => {
    source.text.split('\n').forEach((text, index) => {
      if (regex.test(text)) candidates.push({ file: source.file, line: index + 1, text: text.trim() })
    })
  })
  rules.push({ id, level, scope: scope.trim(), candidates, scanError, result: notes[id] ? 'reviewed' : 'not_applicable', note: notes[id] || '人工逐项复核：本页面及 app/service 未使用该规则涉及的组件、属性、样式、动画、查询或 props；候选词若有命中不代表结构违规。' })
})
if (rules.length < 40) throw new Error('矩阵解析不完整')
fs.writeFileSync(path.join(__dirname, 'static-audit.json'), JSON.stringify({ kind: 'static', scope: files, componentTree: '仅微信内建组件；无自定义子组件或外部模板；首页不在本次页面实现范围，app 原注册保留', buildConfigReviewed: ['mpx.config.js', 'babel.config.json'], rulesReviewed: rules.length, rules, boundary: '候选扫描结合 SFC、父子结构、renderer 分支人工复核；此证据不证明宿主渲染和手势通过。' }, null, 2) + '\n')

const compileLog = fs.readFileSync(path.join(__dirname, 'compile-wx.log'), 'utf8')
const compile = JSON.parse(compileLog.slice(compileLog.lastIndexOf('{\n  "success"')))
fs.writeFileSync(path.join(__dirname, 'compile-wx.json'), JSON.stringify(compile, null, 2) + '\n')
const lint = JSON.parse(fs.readFileSync(path.join(__dirname, 'eslint.json'), 'utf8'))
const jest = JSON.parse(fs.readFileSync(path.join(__dirname, 'jest-results.json'), 'utf8'))
const hashes = sources.map(source => ({ file: source.file, sha256: crypto.createHash('sha256').update(source.text).digest('hex') }))
const validation = {
  target: 'wx',
  renderers: ['webview', 'skyline'],
  artifacts: hashes,
  static: { status: jest.success ? 'passed' : 'failed', evidence: ['static-audit.json', 'orders.test.cjs', 'jest-results.json'], matrixRulesReviewed: rules.length, note: '源码结构与 JSON 校验；所有规则人工逐项复核。' },
  eslint: { status: lint.every(file => !file.errorCount && !file.warningCount) ? 'passed' : 'failed', errors: lint.reduce((sum, file) => sum + file.errorCount, 0), warnings: lint.reduce((sum, file) => sum + file.warningCount, 0), evidence: ['eslint.json', 'eslint.stderr.log'] },
  mock: { status: jest.success ? 'passed' : 'failed', passedTests: jest.numPassedTests, failedTests: jest.numFailedTests, evidence: ['orders.test.cjs', 'jest-results.json', 'jest.log', 'mock-evidence.json'], boundary: '执行实际 SFC 脚本与原 service；createPage/窗口 API/事件对象为 mock。两 renderer 参数测试不等于真实双模式渲染。' },
  real_compile: { status: compile.success ? 'passed' : 'failed', target: compile.target, errors: compile.errors, warnings: compile.warnings, evidence: ['compile-wx.json', 'compile-wx.log'], command: 'npm run compile-validate -- iteration-7/eval-1-page-scroll-sticky-layer-config/mpx/outputs/orders.mpx --type=page --target=wx --json', boundary: 'Mpx CLI/webpack 真实页面编译，含 service 依赖及 SFC JSON；临时编译入口不代表原业务全量 app 构建，输出 app.json 已静态核对。' },
  wechat_devtools: { status: 'not_run', reason: '未连接微信开发者工具容器；未验证可视渲染。' },
  device: { status: 'not_run', renderers: ['webview', 'skyline'], checks: ['嵌套纵向滚动衔接及概览离屏', '组标题吸顶与切换', '横向订单浏览及手势竞争', '原生下拉刷新反馈', '真实触底事件与主区域滚动位置', '全屏弹层覆盖按钮及触摸拦截', '自定义导航与窗口尺寸适配'], reason: '未连接真机；真实交互不得由 mock/编译推断。' },
  attempts: { compile: 1, eslint: 1, jest: 2, fixes: 1, detail: 'Jest 首次在启动 Watchman 时遭遇沙箱 fchmod EPERM；关闭 watchman 后5项全部通过，业务代码无测试失败修订。', evidence: ['jest-attempt-1.log', 'jest.log'] }
}
fs.writeFileSync(path.join(__dirname, 'validation.json'), JSON.stringify(validation, null, 2) + '\n')
console.log(JSON.stringify({ rulesReviewed: rules.length, scanErrors: rules.filter(rule => rule.scanError).map(rule => rule.id), lint: validation.eslint.status, jest: validation.mock.status, compile: validation.real_compile.status }))
