const fs = require('fs')
const path = require('path')
const assert = require('assert/strict')
const crypto = require('crypto')
const root = path.resolve(__dirname, '../outputs')
const files = ['pages/task-board.mpx', 'components/rating-selector.mpx', 'components/segmented-control.mpx', 'app.json']
const sources = Object.fromEntries(files.map(file => [file, fs.readFileSync(path.join(root, file), 'utf8')]))
const app = JSON.parse(sources['app.json'])
const inputApp = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../input/app.json'), 'utf8'))
assert.deepEqual(app.pages, ['pages/home', 'pages/task-board'])
assert.deepEqual(app.window, inputApp.window)
assert.deepEqual(app.rendererOptions.webview, inputApp.rendererOptions.webview)
assert.equal(app.lazyCodeLoading, 'requiredComponents')
assert.deepEqual(app.rendererOptions.skyline, {
  defaultDisplayBlock: true, defaultContentBox: true, tagNameStyleIsolation: 'legacy',
  enableScrollViewAutoSize: true, keyframeStyleIsolation: 'legacy'
})
const compiledRoot = path.join(__dirname, 'compiled-wx/page-and-components')
const pageConfig = JSON.parse(fs.readFileSync(path.join(compiledRoot, '__validate_0.json'), 'utf8'))
assert.equal(pageConfig.renderer, 'skyline')
assert.equal(pageConfig.componentFramework, 'glass-easel')
assert.equal(pageConfig.navigationStyle, 'custom')
assert.equal(pageConfig.disableScroll, true)
Object.values(pageConfig.usingComponents).forEach(component => {
  assert.ok(fs.existsSync(path.join(compiledRoot, component + '.wxml')))
  assert.equal(JSON.parse(fs.readFileSync(path.join(compiledRoot, component + '.json'), 'utf8')).component, true)
})
const wxml = fs.readFileSync(path.join(compiledRoot, '__validate_0.wxml'), 'utf8')
assert.match(wxml, /bindrefresherrefresh="onRefresh"/)
assert.match(wxml, /bindscrolltolower="onLoadMore"/)
assert.match(wxml, /data-eventconfigs=.*toggleTask/)
const combined = Object.values(sources).join('\n')
assert.doesNotMatch(combined, /onPullDownRefresh|onReachBottom|wx\.createAnimation|@media|overflow-[xy]|display:\s*(grid|flow-root)|\.animate\(/)
assert.doesNotMatch(combined, /type:\s*\[|font-weight:\s*(500|600|bolder|lighter)|font-family:/)
assert.match(sources['pages/task-board.mpx'], /height: 100vh/)
assert.match(sources['pages/task-board.mpx'], /\.board-list \{ flex: 1; height: 0; min-height: 0; width: 100%; \}/)

// 以下为完整矩阵的逐条人工复核结论；上方断言与 Jest 补充可执行检查。
const reviewed = {
  CONFIG_APP_SKYLINE_OPTIONS: ['pass', '保留首页/window/webview，按需注入与五项 Skyline 基线齐全。'],
  CONFIG_PAGE_SKYLINE: ['pass', '编译产物具有四项页面配置；页面自定义导航提供首页入口、顶部安全区及胶囊右侧留白。'],
  CONFIG_WORKLET_BABEL: ['not_applicable', '未使用 Worklet；只使用 CSS transition。已核对宿主 mpx.config.js、babel.config.json，不修改配置。'],
  GLASS_TEMPLATE_FRAGMENT: ['not_applicable', '三个模板均无 include 或外部模板片段。'],
  GLASS_TEMPLATE_ESCAPE: ['pass', '逐个检查完整属性；表达式内使用单引号，无反斜杠属性转义。'],
  COMP_UNSUPPORTED: ['not_applicable', '仅使用 view/text/navigator/scroll-view 和两个已纳入范围的自定义组件。'],
  COMP_PENDING_SUPPORT: ['not_applicable', '无 match-media/keyboard-accessory。'],
  COMP_WEBVIEW_ONLY_ATTR: ['not_applicable', '无所列 WebView-only 属性/取值。'],
  COMP_IMAGE_SVG: ['not_applicable', '无图片或 SVG。'],
  COMP_SCROLL_TYPE: ['pass', '唯一 scroll-view 显式 type=list。'],
  COMP_SCROLL_LIST_DIRECT_CHILD: ['pass', '任务行直接 wx:for 在 scroll-view 下，编译后仍为直接子节点；无列表 wrapper。'],
  COMP_SCROLL_NESTED: ['not_applicable', '无嵌套滚动。'],
  COMP_SCROLL_HORIZONTAL: ['not_applicable', '仅纵向滚动；组件按钮为普通横向 Flex。'],
  COMP_SCROLL_HORIZONTAL_CHILD_WIDTH: ['not_applicable', '无横向 scroll-view。'],
  COMP_SCROLL_REFRESHER_SLOT: ['pass', '使用默认 refresher，不存在需要 slot=refresher 的自定义刷新节点。'],
  COMP_NAVIGATOR_CHILDREN: ['pass', '首页 navigator 唯一子节点是 text。'],
  COMP_TEXT_CHILDREN: ['pass', '所有 text 内均为纯文本/插值。'],
  COMP_INLINE_MIXED_CONTENT: ['not_applicable', '任务标题、完成标记、类别是普通 Flex 兄弟节点；无同段图文混排。'],
  COMP_STICKY_STRUCTURE: ['not_applicable', '标题/筛选/评分在 scroll-view 外自然保持可见，无 CSS sticky 或 sticky 组件需求。'],
  COMP_PICKER_VIEW_INDICATOR: ['not_applicable', '无 picker-view。'],
  COMP_SWIPER_LIMIT: ['not_applicable', '无 swiper。'],
  STYLE_MEDIA_SCREEN: ['not_applicable', '无媒体查询；使用弹性宽度，窄屏不依赖媒体断点。'],
  STYLE_SELECTOR_UNSUPPORTED: ['pass', '均为语义类选择器，无通配/属性/伪元素选择器。'],
  STYLE_TEXT_OVERFLOW: ['pass', '任务标题、反馈、两个组件标题及候选文案均同时有 max-lines/overflow 和 WebView CSS 单行省略；插值紧贴 text 标签。'],
  STYLE_FLEX_TEXT_WRAP: ['pass', '可变长文本显式 width:0 + flex:1/min-width:0，或 width:100%；星级/评分/类别不收缩。'],
  STYLE_OVERFLOW_AXIS: ['pass', 'CSS overflow 仅单值 hidden 用于截断；滚动由 scroll-view 承载。'],
  STYLE_LAYOUT_UNSUPPORTED: ['not_applicable', '无 grid/float/flow-root/不支持布局属性。'],
  STYLE_TEXT_UNSUPPORTED: ['not_applicable', '只使用 nowrap/单行省略等支持的文本样式。'],
  STYLE_FONT_POSTSCRIPT_NAME: ['not_applicable', '无自定义字体。'],
  STYLE_FONT: ['pass', '仅默认字重和 bold，无 500/600/bolder/lighter/oblique。'],
  STYLE_TEXT_DECORATION: ['pass', '完成标题仅单个 line-through，作用在 text。'],
  STYLE_BORDER_RADIUS_BORDER: ['pass', '圆角节点未设置边框，无四边颜色/样式不一致。'],
  STYLE_BACKGROUND_MASK_LIMIT: ['not_applicable', '仅纯色背景，无图片背景或遮罩。'],
  STYLE_FILTER_LIMIT: ['not_applicable', '无滤镜。'],
  STYLE_BOX_SHADOW_MULTI: ['not_applicable', '无阴影。'],
  STYLE_CALC_ANGLE: ['pass', '唯一 calc 为底部安全区长度加法，无嵌套或角度。'],
  STYLE_PSEUDO_ANIMATION: ['not_applicable', '无伪元素或 keyframes 动画。'],
  STYLE_ANIMATION_FILL_MODE: ['not_applicable', '无 keyframes。'],
  STYLE_ANIMATION_PROPERTY: ['pass', '真实按钮节点只过渡 transform/opacity，150ms，均在动画白名单内。'],
  STYLE_Z_INDEX_CONTEXT: ['pass', 'transform/opacity 只表示按压状态，无 z-index/fixed 或层级提升依赖。'],
  STYLE_NEGATIVE_MARGIN_OCCUPANCY: ['not_applicable', '无负 margin；内部留白用 padding，列表项使用单侧正间距。'],
  GLASS_SELECTOR_NUMERIC_ID: ['not_applicable', '无 id、SelectorQuery 或 scroll-into-view 选择器。'],
  ANIMATION_WEBVIEW_API: ['not_applicable', '无原生 animation API。'],
  SCROLL_CONTEXT_ENHANCED: ['pass', 'scroll-view 开启 enhanced；未获取 ScrollViewContext。'],
  SELECTOR_QUERY_SCOPE: ['not_applicable', '无 SelectorQuery。'],
  PROPS_DEFAULT_FIELD: ['pass', '两组件属性默认值均为 value。'],
  WX_FOR_DATA_TYPE: ['pass', '三个列表有 initData 空数组，派生结果始终数组；safeOptions 对 null/初始化/异步赋值均有保护。'],
  PROPS_UNION_TYPE: ['pass', '只使用 String/Number/Boolean/Array 主类型。父页动态数值、布尔、数组通过 Mustache 传入；null 候选经实现侧归一化。']
}
const ruleIds = [...fs.readFileSync(path.resolve('../mpx/references/skyline/skyline-audit-matrix.md'), 'utf8').matchAll(/^\| `([A-Z_]+)` \| (error|warn) /gm)]
assert.deepEqual(ruleIds.map(match => match[1]).sort(), Object.keys(reviewed).sort())
const audit = {
  status: 'passed',
  method: 'manual_full_matrix_review_with_static_assertions',
  scope: files.concat(['mpx.config.js (read-only)', 'babel.config.json (read-only)']),
  ruleCount: ruleIds.length,
  unresolvedErrors: [],
  unresolvedWarnings: [],
  uncoveredComponentSubtrees: [],
  rules: ruleIds.map(match => ({ id: match[1], severity: match[2], status: reviewed[match[1]][0], reason: reviewed[match[1]][1] })),
  limitation: '静态结构/配置结论；不证明两种 renderer 的宿主渲染与触摸视觉表现。'
}
fs.writeFileSync(path.join(__dirname, 'skyline-audit.json'), JSON.stringify(audit, null, 2) + '\n')
const compileResults = JSON.parse(fs.readFileSync(path.join(__dirname, 'compile-results.json'), 'utf8'))
assert.ok(Object.values(compileResults).every(result => result.success && !result.errors.length && !result.warnings.length))
assert.match(fs.readFileSync(path.join(__dirname, 'jest-final.log'), 'utf8'), /Tests:\s+10 passed, 10 total/)
assert.equal(fs.readFileSync(path.join(__dirname, 'eslint-final.log'), 'utf8'), '')
const validation = {
  target: 'wx',
  renderers: ['webview', 'skyline'],
  artifacts: files.map(file => ({ file, sha256: crypto.createHash('sha256').update(sources[file]).digest('hex') })),
  static: { status: 'passed', evidence: ['skyline-audit.json', 'template-bindings.json'], note: '覆盖完整矩阵、页面及所有引用组件；配置与绑定另有 Jest 断言。' },
  eslint: { status: 'passed', errors: 0, warnings: 0, evidence: 'eslint-final.log', command: 'node node_modules/eslint/bin/eslint.js iteration-7/eval-3-new-task-board-page/mpx/outputs/pages/task-board.mpx iteration-7/eval-3-new-task-board-page/mpx/outputs/components/rating-selector.mpx iteration-7/eval-3-new-task-board-page/mpx/outputs/components/segmented-control.mpx --max-warnings=0' },
  real_compile: {
    status: 'passed', target: 'wx',
    scenarios: ['页面递归编译两个注册组件', '两个组件分别作为独立入口编译'],
    evidence: ['compile-results.json', 'compile-artifacts.log', 'compiled-wx/'],
    command: 'node iteration-7/eval-3-new-task-board-page/mpx/run-1/compile.cjs',
    note: '调用指定 Skill 基础真实编译工具，使用宿主配置，srcMode=wx；无 Worklet。未包含未提供的宿主首页完整应用构建。'
  },
  mock: {
    status: 'passed', runner: 'Jest', tests: 10, passed: 10,
    evidence: ['task-board.test.cjs', 'jest-final.log', 'template-bindings.json'],
    method: '真实 Mpx SFC 解析与 script setup 编译；解析交付模板事件表达式执行处理器。Vue 2.7 响应式代替 Mpx 宿主运行时，注册/生命周期/事件/定时器为 mock；父级属性回传显式模拟。',
    scenarios: ['参数初始化与非法回退', '筛选/完成状态', '空分类的空态 fixture', '刷新成功/失败/重入/评分同步', '连续分页唯一键且保留旧项', '默认 props', '父级 value 连续更新', 'readonly/整体禁用/单项禁用', 'options 空/null/异步数组', 'change detail', '触摸结束/取消', '两实例隔离', '页面注册/传参/事件回写'],
    limitation: '空态由修改公开分类状态构造；没有宣称固定初始数据能通过正常分类交互自然变为空。mock 不证明宿主事件分发、布局或动画。'
  },
  wechat_devtools: { webview: 'not_run', skyline: 'not_run', reason: '本次未使用微信开发者工具运行容器。' },
  real_device: { webview: 'not_run', skyline: 'not_run', reason: '未连接微信真机；滚动、窄屏、长文本截断、胶囊/安全区、150ms 过渡及触摸取消的实际视觉表现待验。' },
  versions: { core: require('@mpxjs/core/package.json').version, webpackPlugin: require('@mpxjs/webpack-plugin/package.json').version, eslint: require('eslint/package.json').version, vueMock: require('vue').version },
  repairHistory: [
    '初次 ESLint 三条 initData warning，补齐 category/rating/refreshing 后严格检查通过。',
    'Jest 首次因沙箱无法写 Watchman 状态目录而未执行测试；仅对本次命令设置 watchman:false。日志保留 jest.log。',
    'mock 首轮 6/10 通过；修正测试适配器允许覆盖 props 暴露字段，并模拟评分改变后父级属性回传；业务文件未因这些失败修改。一次夹具修复后 10/10 通过。失败日志保留 jest-no-watchman.log。'
  ]
}
fs.writeFileSync(path.join(__dirname, 'validation.json'), JSON.stringify(validation, null, 2) + '\n')
console.log('静态检查及证据汇总通过，矩阵规则数：' + ruleIds.length)
