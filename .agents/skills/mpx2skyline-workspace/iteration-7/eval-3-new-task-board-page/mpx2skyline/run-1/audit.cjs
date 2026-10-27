const fs = require('fs')
const path = require('path')
const assert = require('assert')
const { execSync } = require('child_process')
const { prepare, mount, findNode } = require('./harness.cjs')

const root = process.cwd()
const outputs = path.resolve(__dirname, '../outputs')
const read = file => fs.readFileSync(file, 'utf8')
const matrix = read(path.resolve(root, '../mpx2skyline/references/skyline-audit-matrix.md'))
const scopeFiles = ['pages/task-board.mpx', 'components/rating-selector.mpx', 'components/segmented-control.mpx', 'app.json']

// Execute the Skill's complete aggregate scan, preserving candidate lines.
const command = matrix.match(/```bash\n([\s\S]*?)\n```/)[1].replace('<scope>', "'" + outputs + "'")
let candidates
try { candidates = execSync(command, { cwd: root, encoding: 'utf8' }) } catch (error) {
  if (error.status !== 1) throw error
  candidates = error.stdout
}
fs.writeFileSync(path.join(__dirname, 'audit-command.txt'), command + '\n')
fs.writeFileSync(path.join(__dirname, 'audit-candidates.log'), candidates)

// Each outcome below is a scoped source/structure review, not a renderer test.
const reviewed = {
  CONFIG_APP_SKYLINE_OPTIONS: '顶层 lazyCodeLoading 与 skyline 五项基线齐全；保留原 window、首页顺序和 webview 对象；未将宿主全局改成 Skyline。',
  CONFIG_PAGE_SKYLINE: '页面声明 skyline/glass-easel/custom/disableScroll；自定义导航由状态栏、胶囊区域测量与首页事件组成。',
  CONFIG_WORKLET_BABEL: '不适用：无 Worklet，仅 transform/opacity transition。',
  GLASS_TEMPLATE_FRAGMENT: '不适用：无 include 或模板片段依赖。',
  GLASS_TEMPLATE_ESCAPE: '模板属性均使用合法双引号边界；绑定内字符串使用单引号，无反斜杠转义。',
  COMP_UNSUPPORTED: '未使用不支持组件；使用 view/text/scroll-view 与本次两个自定义组件。',
  COMP_PENDING_SUPPORT: '不适用：未使用 match-media、keyboard-accessory。',
  COMP_WEBVIEW_ONLY_ATTR: '无 WebView-only 组件属性/取值。max-lines/overflow 在 text 上供 Skyline 省略，WXSS 同时保留 WebView 省略。',
  COMP_IMAGE_SVG: '不适用：无图像或 SVG 资源。',
  COMP_SCROLL_TYPE: '唯一 scroll-view 显式 type=list。',
  COMP_SCROLL_LIST_DIRECT_CHILD: '循环 task-card 是 scroll-view 直接子节点，无单一列表 wrapper。',
  COMP_SCROLL_NESTED: '不适用：无嵌套滚动。',
  COMP_SCROLL_HORIZONTAL: '不适用：无横向滚动容器；普通 Flex 行由 defaultDisplayBlock 的 row 基线对齐。',
  COMP_SCROLL_HORIZONTAL_CHILD_WIDTH: '不适用：无 scroll-x。',
  COMP_SCROLL_REFRESHER_SLOT: '例外：使用原生默认 refresher，不存在需声明 slot 的自定义刷新节点。',
  COMP_NAVIGATOR_CHILDREN: '不适用：无 navigator；首页入口通过 view 点击事件跳转。',
  COMP_TEXT_CHILDREN: '全部 text 仅承载文本，无非 text 子组件。',
  COMP_INLINE_MIXED_CONTENT: '不适用：各文本/图标为独立 Flex 节点，无同段图文混排。',
  COMP_STICKY_STRUCTURE: '不适用：固定顶部区域位于 scroll-view 外，非滚动内容吸顶，不依赖 sticky。',
  COMP_PICKER_VIEW_INDICATOR: '不适用：无 picker-view。',
  COMP_SWIPER_LIMIT: '不适用：无 swiper。',
  STYLE_MEDIA_SCREEN: '不适用：无媒体查询；窄屏采用弹性剩余宽度与显式窗口高度。',
  STYLE_SELECTOR_UNSUPPORTED: '样式只用语义 class；没有通配、属性、伪类或伪元素选择器。',
  STYLE_TEXT_OVERFLOW: 'board-title/task-title/rating-label/segmented-label/segmented-option-text 均有 max-lines=1、overflow=ellipsis 与 WebView 三项单行省略样式；插值贴合标签。',
  STYLE_FLEX_TEXT_WRAP: '需要截断的 Flex 子项显式 width:0+flex:1 或 width:100%；星级/分数 flex-shrink:0。任务标题宽度参照 task-content 剩余宽度。',
  STYLE_OVERFLOW_AXIS: '唯一 overflow 值为 hidden，服务文本裁剪；滚动使用 scroll-view，无单轴 overflow。',
  STYLE_LAYOUT_UNSUPPORTED: '无 grid/flow-root/float 等；根节点列 Flex，scroll-view height:0+flex:1+min-height:0，有确定窗口高度。',
  STYLE_TEXT_UNSUPPORTED: '只用单行 nowrap 与常规文字样式，无不支持文本声明。',
  STYLE_FONT_POSTSCRIPT_NAME: '不适用：未引入自定义字体或 PostScript name。',
  STYLE_FONT: '仅明确 bold 字重，无 500/600/bolder/lighter/oblique。',
  STYLE_TEXT_DECORATION: '仅 task-title-completed 的 text 节点使用单值 line-through。',
  STYLE_BORDER_RADIUS_BORDER: '圆角边框四边统一 solid、同色；完成态通过 border-color 同时修改四边。',
  STYLE_BACKGROUND_MASK_LIMIT: '仅纯背景色，无背景图、多层背景或 mask。',
  STYLE_FILTER_LIMIT: '不适用：无 filter/backdrop-filter。',
  STYLE_BOX_SHADOW_MULTI: '不适用：无 box-shadow。',
  STYLE_CALC_ANGLE: '不适用：无 calc。',
  STYLE_PSEUDO_ANIMATION: '不适用：无伪元素动画。',
  STYLE_ANIMATION_FILL_MODE: '不适用：无 keyframes 动画。',
  STYLE_ANIMATION_PROPERTY: '真实可点击 view 仅过渡 transform 与 opacity，均在白名单，持续 150ms；按压为 scale(0.96)/0.7，结束与取消恢复 1。',
  STYLE_Z_INDEX_CONTEXT: '无 z-index、fixed 或重叠层级假设；transform/opacity 仅作按压反馈。',
  STYLE_NEGATIVE_MARGIN_OCCUPANCY: '无负 margin；父容器 padding 与单侧兄弟间距。',
  GLASS_SELECTOR_NUMERIC_ID: '不适用：无 id 或节点查询选择器。',
  ANIMATION_WEBVIEW_API: '未使用 wx.createAnimation 或实例动画 API。',
  SCROLL_CONTEXT_ENHANCED: 'scroll-view 开启 enhanced；未调用 node() 或 ScrollViewContext。',
  SELECTOR_QUERY_SCOPE: '不适用：无 SelectorQuery。',
  PROPS_DEFAULT_FIELD: '两个组件 props descriptor 均使用 type/value；setup defineProps 编译结果是 properties。',
  WX_FOR_DATA_TYPE: 'visibleTasks、stars、safeOptions 有 initData=[]；计算结果始终 Array，options=null 统一归一化。',
  PROPS_UNION_TYPE: 'props 使用 String/Number/Boolean/Array 单一 type，默认值与页面传值一致；无 type 数组声明。'
}

async function main () {
  await prepare()
  const page = mount('pages/task-board')
  const rating = mount('components/rating-selector')
  const segmented = mount('components/segmented-control')
  const app = JSON.parse(read(path.join(outputs, 'app.json')))
  const hostInput = JSON.parse(read(path.resolve(__dirname, '../../input/app.json')))
  assert.deepStrictEqual(app.window, hostInput.window)
  assert.deepStrictEqual(app.rendererOptions.webview, hostInput.rendererOptions.webview)
  assert.strictEqual(app.pages[0], 'pages/home')
  assert(app.pages.includes('pages/task-board'))
  assert.strictEqual(app.lazyCodeLoading, 'requiredComponents')
  assert.deepStrictEqual(app.rendererOptions.skyline, {
    defaultDisplayBlock: true, defaultContentBox: true, tagNameStyleIsolation: 'legacy',
    enableScrollViewAutoSize: true, keyframeStyleIsolation: 'legacy'
  })
  const compiledConfig = JSON.parse(read(path.join(__dirname, 'compiled/__validate_0.json')))
  assert.strictEqual(compiledConfig.renderer, 'skyline')
  assert.strictEqual(compiledConfig.componentFramework, 'glass-easel')
  assert.strictEqual(compiledConfig.navigationStyle, 'custom')
  assert.strictEqual(compiledConfig.disableScroll, true)
  const scroll = findNode(page, 'scroll-view')
  assert.strictEqual(scroll.attributes.type, 'list')
  assert.strictEqual(scroll.attributes['refresher-triggered'], '{{refreshing}}')
  assert(/<scroll-view[^>]*><view[^>]*wx:for="{{visibleTasks}}"/.test(page.wxml))
  assert(page.wxml.indexOf('class="board-header"') < page.wxml.indexOf('<scroll-view'))
  ;[rating, segmented].forEach(instance => {
    assert.strictEqual(JSON.parse(read(compiledPathFor(instance.name, 'json'))).component, true)
    Object.values(instance.options.properties).forEach(descriptor => {
      assert(Object.prototype.hasOwnProperty.call(descriptor, 'value'))
      assert(!Object.prototype.hasOwnProperty.call(descriptor, 'default'))
      assert(!Array.isArray(descriptor.type))
    })
  })
  const sources = scopeFiles.filter(file => file.endsWith('.mpx')).map(file => read(path.join(outputs, file)))
  const ellipsisCounts = sources.map(source => {
    const template = source.match(/<template>([\s\S]*?)<\/template>/)[1]
    const nodes = template.match(/<text\b[^>]*max-lines="\{\{1\}\}"[^>]*overflow="ellipsis"[^>]*>/g) || []
    return nodes.length
  })
  assert.deepStrictEqual(ellipsisCounts, [2, 1, 2])
  const rowRules = Array.from(matrix.matchAll(/^\| `([^`]+)` \| (error|warn) \|/gm)).map(match => {
    assert(reviewed[match[1]], 'Missing matrix review: ' + match[1])
    return { id: match[1], level: match[2], status: 'reviewed_clear', reason: reviewed[match[1]] }
  })
  const result = {
    status: 'passed', method: 'Skill aggregate rg scan + source/compiled structure review + targeted assertions',
    scope: scopeFiles, rulesReviewed: rowRules.length, unresolvedErrors: [], unresolvedWarnings: [],
    rules: rowRules,
    limits: ['静态与 mock 不证明真实渲染、窄屏实际排版或原生手势表现', '首页源码未提供，仅保留宿主配置与跳转入口']
  }
  fs.writeFileSync(path.join(__dirname, 'audit.json'), JSON.stringify(result, null, 2))
  console.log(JSON.stringify({ status: result.status, rulesReviewed: rowRules.length, ellipsisNodes: ellipsisCounts }, null, 2))
}

function compiledPathFor (name, extension) { return require('./harness.cjs').compiledPath(name, extension) }
main().catch(error => { console.error(error); process.exitCode = 1 })
