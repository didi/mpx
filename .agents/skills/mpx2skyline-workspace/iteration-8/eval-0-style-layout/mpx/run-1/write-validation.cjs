const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const dir = __dirname
const read = file => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
const source = fs.readFileSync(path.join(dir, '../outputs/style-card.mpx'), 'utf8')
const matrix = fs.readFileSync('iteration-8/skill-snapshots/mpx/references/skyline/skyline-audit-matrix.md', 'utf8')
const rules = Array.from(matrix.matchAll(/^\| `([A-Z_]+)` \| (error|warn) \|/gm), match => ({ id: match[1], level: match[2] }))
const findings = {}
function set (ids, status, reason) {
  ids.split(' ').forEach(id => { findings[id] = { status, reason } })
}
set('CONFIG_APP_SKYLINE_OPTIONS CONFIG_PAGE_SKYLINE', 'not_applicable', '单组件范围；宿主已声明 defaultDisplayBlock/defaultContentBox；未提供或修改 app/page 配置。')
set('CONFIG_WORKLET_BABEL ANIMATION_WEBVIEW_API STYLE_PSEUDO_ANIMATION STYLE_ANIMATION_FILL_MODE STYLE_ANIMATION_PROPERTY', 'not_applicable', '无 Worklet、动画或相关 API。')
set('GLASS_TEMPLATE_FRAGMENT GLASS_TEMPLATE_ESCAPE', 'pass', '无 include 或冲突的属性引号转义；已读完整模板。')
set('COMP_UNSUPPORTED COMP_PENDING_SUPPORT COMP_WEBVIEW_ONLY_ATTR COMP_IMAGE_SVG', 'pass', '只用 view/text/scroll-view，无不支持组件、SVG 或 WebView-only 属性。')
set('COMP_SCROLL_TYPE', 'pass', '唯一 scroll-view 保持 type="custom"。')
set('COMP_SCROLL_LIST_DIRECT_CHILD COMP_SCROLL_NESTED COMP_SCROLL_REFRESHER_SLOT', 'not_applicable', '非 list、无嵌套滚动或刷新节点。')
set('COMP_SCROLL_HORIZONTAL', 'fixed', 'scroll-x + enable-flex；容器及内容显式横向。')
set('COMP_SCROLL_HORIZONTAL_CHILD_WIDTH', 'fixed', '唯一直接子节点 fit-content 明确 width:100%；320px 视口，两子项 flex:1 / min-width:0。')
set('COMP_NAVIGATOR_CHILDREN COMP_INLINE_MIXED_CONTENT COMP_STICKY_STRUCTURE COMP_PICKER_VIEW_INDICATOR COMP_SWIPER_LIMIT', 'not_applicable', '无 navigator、同段图文混排、吸顶、picker 或 swiper。')
set('COMP_TEXT_CHILDREN', 'pass', 'text 仅纯文本或 title 插值，没有非法嵌套。')
set('STYLE_MEDIA_SCREEN', 'fixed', '媒体查询唯一选择器 card-webview 只在非 Skyline 生效；Skyline 动态 card-small，窗口宽 <=320；监听卸载清理。')
set('STYLE_SELECTOR_UNSUPPORTED', 'fixed', '活动文案改用 sale 类；无属性、通配或不支持的伪元素选择器。')
set('STYLE_TEXT_OVERFLOW', 'fixed', 'title 增加 max-lines=1 / overflow=ellipsis；保留 WebView CSS，插值紧贴标签。')
set('STYLE_FLEX_TEXT_WRAP', 'pass', '标签各用 flex:1/min-width:0；新增特效包装块默认纵向拉伸，无长文案居中溢出场景。')
set('STYLE_OVERFLOW_AXIS', 'pass', '仅 title/outer 的单值 hidden；滚动保留 scroll-view。')
set('STYLE_LAYOUT_UNSUPPORTED', 'fixed', 'grid 改两列等分 Flex；child 顶距归 outer padding-top；相邻折叠间距只留16px。')
set('STYLE_TEXT_UNSUPPORTED STYLE_TEXT_DECORATION STYLE_BORDER_RADIUS_BORDER STYLE_BACKGROUND_MASK_LIMIT STYLE_CALC_ANGLE STYLE_Z_INDEX_CONTEXT', 'not_applicable', '未使用这些受限属性/组合；背景为纯色，无 z-index、transform 或 opacity 层级依赖。')
set('STYLE_FONT_POSTSCRIPT_NAME', 'retained_exception', 'City-Semibold 有独立 @font-face；Trip-Medium 为宿主字体，缺二进制不能确认 PostScript 映射。保留已确认设计，未获字重替换授权。')
set('STYLE_FONT', 'warn', '保留 600/500；部分机型匹配风险，未做字体二进制/真机核验。')
set('STYLE_FILTER_LIMIT', 'fixed', '单 blur 保持；复合效果内 blur(2px)、外 brightness(.8)，保留应用顺序，每层单函数。')
set('STYLE_BOX_SHADOW_MULTI', 'fixed', '单 rgba 阴影原样保留，函数内逗号不是多层；双阴影拆同尺寸无内边距节点，大阴影外层、小阴影内层。')
set('STYLE_NEGATIVE_MARGIN_OCCUPANCY', 'fixed', 'overlap-host/tips-wrapper 纵向 Flex，content mt=-64rpx 补偿取消折叠差值28rpx。原/新 content 起点92rpx，重叠92rpx，后续起点212rpx；普通 -8rpx 不改父布局。仅静态推导，渲染待验证。')
set('GLASS_SELECTOR_NUMERIC_ID SELECTOR_QUERY_SCOPE SCROLL_CONTEXT_ENHANCED', 'not_applicable', '无 id、SelectorQuery 或 ScrollViewContext 获取。')
set('PROPS_DEFAULT_FIELD PROPS_UNION_TYPE', 'pass', 'title 保留 String 与 value；无 default 或联合 type。未提供调用侧，不能实测外部传值。')
set('WX_FOR_DATA_TYPE', 'not_applicable', '无循环或动态列表。')
const audit = rules.map(rule => {
  if (!findings[rule.id]) throw new Error('Unreviewed rule: ' + rule.id)
  return Object.assign({}, rule, findings[rule.id])
})
fs.writeFileSync(path.join(dir, 'audit.json'), JSON.stringify({ scope: ['outputs/style-card.mpx'], method: '完整矩阵逐项人工复核 + static-scan.log + Jest静态断言；不等于运行渲染', rules: audit }, null, 2) + '\n')
const jest = read('jest-result.json')
const compile = read('compile-result.json')
const diagnostic = read('compile-diagnostic-result.json')
const validation = {
  target: 'wx',
  renderers: ['webview', 'skyline'],
  artifact: '../outputs/style-card.mpx',
  sha256: crypto.createHash('sha256').update(source).digest('hex'),
  static: { status: 'pass_with_warnings', matrixRulesReviewed: audit.length, evidence: ['static-scan.log', 'audit.json', 'jest-result.json'], warnings: ['字体 500/600 与宿主字体映射尚无真机证据。', '宿主 app/page 不在单组件范围，引用任务提供的两项盒模型前提。'] },
  eslint: { status: read('eslint-result.json').exitCode === 0 ? 'pass' : 'fail', evidence: ['eslint.log', 'eslint-result.json'], scope: '正式 style-card.mpx', note: '首次 CLI 定位使用未导出的子路径失败，改用包根路径定位后成功；未修改配置。' },
  mock: { status: jest.success ? 'pass' : 'fail', runner: 'Jest', passed: jest.numPassedTests, failed: jest.numFailedTests, evidence: ['style-card.test.js', 'run-jest.cjs', 'jest.log', 'jest-result.json'], boundary: '脚本使用 vm 与模拟 API/组件实例；静态 CSS 断言不模拟微信布局引擎。', attempts: [{ status: 'failed_before_tests', reason: 'Watchman 状态目录权限不足', evidence: 'jest-attempt-1.log' }, { status: 'pass', change: 'watchman:false，测试与业务代码未变' }], repairAttempts: 1 },
  real_compile: { status: compile.success ? 'pass' : 'fail', target: 'wx', command: 'npm run compile-validate -- iteration-8/eval-0-style-layout/mpx/outputs/style-card.mpx --target=wx --json', exitCode: 1, errors: compile.summary.total, reason: "输入未提供宿主字体 city.woff2；Can't resolve './city.woff2'，引起 wxss 与 extractor 两条 dependency 错误。", evidence: ['compile.log', 'compile-result.json'], repairAttempts: 0 },
  diagnostic_compile: { status: diagnostic.success ? 'pass' : 'fail', kind: '真实 wx 编译器 + 移除 @font-face 的诊断副本', command: 'npm run compile-validate -- iteration-8/eval-0-style-layout/mpx/run-1/font-external-diagnostic.mpx --target=wx --json', evidence: ['font-external-diagnostic.mpx', 'compile-diagnostic.log', 'compile-diagnostic-result.json'], boundary: '不代表正式产物编译通过，不验证字体或宿主视觉。' },
  renderer_runtime: { webview: 'not_run', skyline: 'not_run', reason: '无微信开发者工具渲染会话或可运行的宿主业务页面。' },
  device: { status: 'not_run', reason: '无 iOS/Android 微信真机与宿主字体二进制。' },
  font_binary: { status: 'not_run', reason: '二进制由宿主提供，输入目录没有 city.woff2 或 Trip 字体。' }
}
fs.writeFileSync(path.join(dir, 'validation.json'), JSON.stringify(validation, null, 2) + '\n')
console.log(JSON.stringify({ reviewedRules: audit.length, testsPassed: jest.numPassedTests, compile: validation.real_compile.status, diagnostic: validation.diagnostic_compile.status }))
