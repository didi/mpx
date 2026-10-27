const fs = require('fs')
const path = require('path')
const assert = require('assert/strict')
const base = path.resolve(__dirname, '../outputs')
const source = fs.readFileSync(path.join(base, 'orders.mpx'), 'utf8')
const app = JSON.parse(fs.readFileSync(path.join(base, 'app.json')))
const inputApp = JSON.parse(fs.readFileSync(path.resolve(base, '../../input/app.json')))
const service = fs.readFileSync(path.join(base, 'service.js'), 'utf8')
const page = JSON.parse(source.match(/<script type="application\/json">([\s\S]*?)<\/script>/)[1])
const template = source.match(/<template>([\s\S]*?)<\/template>/)[1]
const style = source.match(/<style>([\s\S]*?)<\/style>/)[1]
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
const findings = []
const matrix = fs.readFileSync(path.resolve(process.cwd(), '../mpx2skyline/references/skyline-audit-matrix.md'), 'utf8')
const rules = [...matrix.matchAll(/^\| `([A-Z_]+)` \| (error|warn) \|/gm)].map(match => ({ id: match[1], level: match[2] }))
function pass (id, note, check) {
  check()
  findings.push({ id, status: 'passed', note })
}
function absent (id, pattern, area = source) {
  assert(!pattern.test(area), id)
  findings.push({ id, status: 'not_applicable', note: 'Checked source; no applicable feature/pattern.' })
}
// Minimal XML tree for this template. No dynamic tag names or fragments exist.
const root = { tag: 'root', children: [] }
const stack = [root]
for (const match of template.matchAll(/<(\/?)([\w-]+)\b([^>]*?)(\/?)>/g)) {
  if (match[1]) { assert.equal(stack.pop().tag, match[2]); continue }
  const node = { tag: match[2], attrs: match[3], children: [], line: source.slice(0, source.indexOf(match[0])).split('\n').length }
  stack[stack.length - 1].children.push(node)
  if (!match[4]) stack.push(node)
}
assert.equal(stack.length, 1)
const nodes = []
function visit (node) { nodes.push(node); node.children.forEach(visit) }
visit(root)
const scrolls = nodes.filter(node => node.tag === 'scroll-view')
const skyOuter = scrolls.find(node => node.attrs.includes('type="nested"'))
const webOuter = scrolls.find(node => node.attrs.includes('wx:else'))
const skyMain = skyOuter.children[1].children[0]
const webMain = webOuter.children[1]
const strips = scrolls.filter(node => node.attrs.includes('scroll-x'))
pass('CONFIG_APP_SKYLINE_OPTIONS', 'Top-level lazyCodeLoading; all five skyline options; original home/window/webview preserved.', () => {
  assert.equal(app.lazyCodeLoading, 'requiredComponents')
  assert.deepEqual(app.pages, inputApp.pages)
  assert.deepEqual(app.window, inputApp.window)
  assert.deepEqual(app.rendererOptions.webview, inputApp.rendererOptions.webview)
  assert.deepEqual(app.rendererOptions.skyline, { defaultDisplayBlock: true, defaultContentBox: true, tagNameStyleIsolation: 'legacy', enableScrollViewAutoSize: true, keyframeStyleIsolation: 'legacy' })
  assert(!app.renderer)
})
pass('CONFIG_PAGE_SKYLINE', 'Only orders opts into skyline/glass-easel; actual custom navigation; page scrolling disabled.', () => {
  assert.equal(page.renderer, 'skyline'); assert.equal(page.componentFramework, 'glass-easel')
  assert.equal(page.disableScroll, true); assert.equal(page.navigationStyle, 'custom')
  assert.equal(page.navigationBarTitleText, '订单'); assert.equal(page.enablePullDownRefresh, false)
  assert(template.includes('class="navigation-title"')); assert(template.includes('<text>订单</text>'))
})
absent('CONFIG_WORKLET_BABEL', /worklet:|['"]worklet['"]|wx\.worklet/)
absent('GLASS_TEMPLATE_FRAGMENT', /<include\b/, template)
absent('GLASS_TEMPLATE_ESCAPE', /\\["']/, template)
absent('COMP_UNSUPPORTED', /<(web-view|editor|movable-area|movable-view|progress|navigation-bar|xr-frame)\b/, template)
absent('COMP_PENDING_SUPPORT', /<(match-media|keyboard-accessory)\b/, template)
absent('COMP_WEBVIEW_ONLY_ATTR', /lazy-load|forceHttps|space=|decode=|placeholder-class|safe-password-|snap-to-edge|mode="(top|bottom|center|left|right)/, template)
absent('COMP_IMAGE_SVG', /<image|<svg|\.svg/, template)
pass('COMP_SCROLL_TYPE', 'All six scroll-view declarations have explicit types.', () => { assert.equal(scrolls.length, 6); scrolls.forEach(node => assert(/type="(nested|custom|list)"/.test(node.attrs))) })
pass('COMP_SCROLL_LIST_DIRECT_CHILD', 'Horizontal list tiles and WebView outer summary/main are direct children; Skyline uses nested/custom.', () => {
  strips.forEach(node => { assert.equal(node.children[0].tag, 'view'); assert(node.children[0].attrs.includes('wx:for')); assert(node.children[0].attrs.includes('class="tile"')) })
  assert.equal(webOuter.children.length, 2)
})
pass('COMP_SCROLL_NESTED', 'Skyline outer header/body each has exactly one child; inner custom associates with nested-scroll-view; native nodes isolated from WebView.', () => {
  assert(skyOuter.attrs.includes("renderer === 'skyline'"))
  assert.deepEqual(skyOuter.children.map(node => node.tag), ['nested-scroll-header', 'nested-scroll-body'])
  skyOuter.children.forEach(node => assert.equal(node.children.length, 1))
  assert(skyMain.attrs.includes('type="custom"')); assert(skyMain.attrs.includes('associative-container="nested-scroll-view"'))
  assert.equal(webOuter.children[0].tag, 'view'); assert.equal(webMain.tag, 'scroll-view')
})
pass('COMP_SCROLL_HORIZONTAL', 'Both strips have scroll-x + enable-flex + explicit row layout.', () => { strips.forEach(node => assert(node.attrs.includes('enable-flex="{{true}}"'))); assert(/\.strip\s*\{[^}]*display: flex;[^}]*flex-direction: row;/.test(style)) })
pass('COMP_SCROLL_HORIZONTAL_CHILD_WIDTH', 'Direct tile items explicitly width:120px and flex-shrink:0.', () => { assert(/\.tile\s*\{[^}]*flex-shrink: 0;[^}]*width: 120px;/.test(style)) })
pass('COMP_SCROLL_REFRESHER_SLOT', 'Default refresher only; exactly one active business scroll-view in either renderer branch.', () => {
  assert(!template.includes('slot="refresher"'))
  ;[skyMain, webMain].forEach(node => {
    assert(node.attrs.includes('bindrefresherrefresh="onRefresh"')); assert(node.attrs.includes('refresher-triggered="{{refreshing}}"'))
    assert(node.attrs.includes('catchscrolltolower="loadMore"')); assert(node.attrs.includes('catchscroll="onScroll"'))
  })
  assert.equal(scrolls.filter(node => node.attrs.includes('refresher-enabled')).length, 2)
})
absent('COMP_NAVIGATOR_CHILDREN', /<navigator\b/, template)
pass('COMP_TEXT_CHILDREN', 'All text nodes contain only text/interpolation.', () => { nodes.filter(node => node.tag === 'text').forEach(node => assert.equal(node.children.length, 0)) })
absent('COMP_INLINE_MIXED_CONTENT', /<image|<rich-text|<special-text|<mpx-icon|line-clamp|truncate|span/, template)
pass('COMP_STICKY_STRUCTURE', 'Skyline custom scroll direct sticky-section, header first with opaque background; CSS sticky only in WebView branch.', () => {
  const section = skyMain.children[0]
  assert.equal(section.tag, 'sticky-section'); assert.equal(section.children[0].tag, 'sticky-header')
  assert.equal(section.children.filter(node => node.tag === 'sticky-header').length, 1)
  assert(/\.header\s*\{[^}]*background: #fff;/.test(style))
  assert(webMain.children[0].children[0].attrs.includes('webview-sticky'))
  assert(!skyOuter.attrs.includes('webview-sticky'))
})
absent('COMP_PICKER_VIEW_INDICATOR', /<picker-view/, template)
absent('COMP_SWIPER_LIMIT', /<swiper/, template)
absent('STYLE_MEDIA_SCREEN', /@media screen/, style)
absent('STYLE_SELECTOR_UNSUPPORTED', /(?:^|[\s,{])\*\s*[{,]|\[[^\]]+\]|::[\w-]+/, style)
absent('STYLE_TEXT_OVERFLOW', /text-overflow|-webkit-line-clamp|truncate|line-clamp/)
pass('STYLE_FLEX_TEXT_WRAP', 'Flex text is the short, fixed title only; order text has explicit 120px tile width.', () => { assert(/\.tile\s*\{[^}]*width: 120px/.test(style)); assert(template.includes('<text>订单</text>')) })
pass('STYLE_OVERFLOW_AXIS', 'Only overall overflow:hidden on root for clipping; scrolling uses native containers.', () => { assert(!/overflow-[xy]|overflow:\s*(auto|scroll)|overflow:\s*\w+\s+\w+/.test(style)); assert(style.includes('.page { overflow: hidden;')) })
absent('STYLE_LAYOUT_UNSUPPORTED', /display:\s*(grid|flow-root)|float\s*:|contain\s*:|resize\s*:|visibility:\s*collapse|outline\s*:|cursor\s*:|justify-items|column-/, style)
absent('STYLE_TEXT_UNSUPPORTED', /(?<![-\w])direction\s*:|text-indent|overflow-wrap|writing-mode|text-decoration-thickness|list-style-|white-space:\s*(pre|pre-wrap|pre-line)|word-break:\s*(keep-all|break-word)|text-align:\s*(justify-all|match-parent)|vertical-align:\s*(text-top|text-bottom)/, style)
absent('STYLE_FONT_POSTSCRIPT_NAME', /font-family\s*:[^;]+-(Medium|Semibold|Bold)/, style)
absent('STYLE_FONT', /font-weight\s*:\s*(500|600|bolder|lighter)|font-style\s*:\s*oblique/, style)
absent('STYLE_TEXT_DECORATION', /text-decoration/, style)
absent('STYLE_BORDER_RADIUS_BORDER', /border-radius|border-(top|right|bottom|left)-(color|style)/, style)
absent('STYLE_BACKGROUND_MASK_LIMIT', /background-(image|position|repeat|size|attachment|origin|clip)|mask-/, style)
absent('STYLE_FILTER_LIMIT', /filter\s*:/, style)
absent('STYLE_BOX_SHADOW_MULTI', /box-shadow\s*:/, style)
absent('STYLE_CALC_ANGLE', /calc\([^)]*(deg|rad|turn)/, style)
absent('STYLE_PSEUDO_ANIMATION', /::(before|after)[\s\S]*animation/, style)
absent('STYLE_ANIMATION_FILL_MODE', /animation-fill-mode/, style)
absent('STYLE_ANIMATION_PROPERTY', /transition|animation/, style)
pass('STYLE_Z_INDEX_CONTEXT', 'Fab and modal are fixed siblings outside scrolling; modal3 > fab2. No transform/negative z-index. WebView header local z-index1.', () => {
  const pageNode = root.children[0]
  const fab = pageNode.children.find(node => node.attrs.includes('class="fab"'))
  const modal = pageNode.children.find(node => node.attrs.includes('class="modal"'))
  assert(fab && modal); assert(/\.fab\s*\{[^}]*position: fixed;[^}]*z-index: 2;/.test(style)); assert(/\.modal\s*\{[^}]*position: fixed;[^}]*z-index: 3;/.test(style))
  assert(!/transform|opacity|z-index:\s*-/.test(style))
})
absent('STYLE_NEGATIVE_MARGIN_OCCUPANCY', /margin[^;]*-[0-9]/, style)
absent('GLASS_SELECTOR_NUMERIC_ID', /id=["']?[0-9]|select\(['"]#[0-9]/)
absent('ANIMATION_WEBVIEW_API', /\.animate\(|\.applyAnimation\(|\.clearAnimation\(|\.setInitialRenderingCache\(|wx\.createAnimation/)
pass('SCROLL_CONTEXT_ENHANCED', 'No ScrollViewContext/node() API; all scroll containers nevertheless use enhanced.', () => { assert(!/\.node\(/.test(script)); scrolls.forEach(node => assert(node.attrs.includes('enhanced="{{true}}"'))) })
absent('SELECTOR_QUERY_SCOPE', /wx\.createSelectorQuery/, script)
absent('PROPS_DEFAULT_FIELD', /properties\s*:/, script)
pass('WX_FOR_DATA_TYPE', 'sections defaults to []; service always returns arrays, failures retain prior list. Jest verifies IDs and data paths.', () => {
  assert(/sections: \[\]/.test(script)); assert(service.includes('Promise.resolve(Array.from'))
  assert(script.includes('this.sections.concat(sections)'))
  assert.equal(service, fs.readFileSync(path.resolve(base, '../../input/service.js'), 'utf8'))
})
absent('PROPS_UNION_TYPE', /properties\s*:/, script)
assert.equal(findings.length, rules.length)
rules.forEach(rule => assert(findings.find(finding => finding.id === rule.id), rule.id))
assert(!/onPullDownRefresh|onReachBottom|onPageScroll|stopPullDownRefresh/.test(script))
assert(/\.summary\s*\{[^}]*height: 120px;/.test(style))
fs.writeFileSync(path.join(__dirname, 'audit-results.json'), JSON.stringify({ status: 'passed', scope: ['orders.mpx (all blocks)', 'app.json', 'service.js'], matrixRuleCount: rules.length, unresolvedErrors: [], unresolvedWarnings: [], findings: rules.map(rule => Object.assign({}, rule, findings.find(finding => finding.id === rule.id))), limitations: ['Static structural review does not prove device gestures, sticky visuals or native event delivery.'] }, null, 2) + '\n')
console.log('Static audit passed: ' + rules.length + ' matrix rules, no unexplained error/warn findings.')
