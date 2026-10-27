const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const root = __dirname
const output = path.join(root, '../outputs/style-card.mpx')
const matrix = fs.readFileSync(path.resolve('../mpx2skyline/references/skyline-audit-matrix.md'), 'utf8')
const review = {
  CONFIG_APP_SKYLINE_OPTIONS: ['not_applicable', 'Single component scope; task confirms host defaultDisplayBlock/defaultContentBox. No app configuration edited.'],
  CONFIG_PAGE_SKYLINE: ['not_applicable', 'Component declaration only; no page in input scope.'],
  CONFIG_WORKLET_BABEL: ['not_applicable', 'No Worklet.'],
  GLASS_TEMPLATE_FRAGMENT: ['passed', 'No include/template fragments.'],
  GLASS_TEMPLATE_ESCAPE: ['passed', 'Reviewed complete attributes; no backslash quote escapes.'],
  COMP_UNSUPPORTED: ['passed', 'Only view/text/scroll-view native elements.'],
  COMP_PENDING_SUPPORT: ['not_applicable', 'No match-media or keyboard-accessory.'],
  COMP_WEBVIEW_ONLY_ATTR: ['not_applicable', 'No listed WebView-only attributes.'],
  COMP_IMAGE_SVG: ['not_applicable', 'No images/SVG.'],
  COMP_SCROLL_TYPE: ['passed', 'Single scroll-view explicitly type=custom.'],
  COMP_SCROLL_LIST_DIRECT_CHILD: ['not_applicable', 'Custom horizontal layout; no list virtualization.'],
  COMP_SCROLL_NESTED: ['not_applicable', 'No nested scroll-view.'],
  COMP_SCROLL_HORIZONTAL: ['passed', 'scroll-x and enable-flex true; explicit flex-direction:row.'],
  COMP_SCROLL_HORIZONTAL_CHILD_WIDTH: ['passed', 'Direct child fit-content has width:100%; viewport 320px; item flex-basis 0 gives equal halves.'],
  COMP_SCROLL_REFRESHER_SLOT: ['not_applicable', 'No refresher.'],
  COMP_NAVIGATOR_CHILDREN: ['not_applicable', 'No navigator.'],
  COMP_TEXT_CHILDREN: ['passed', 'All text elements contain only literal text or interpolation.'],
  COMP_INLINE_MIXED_CONTENT: ['not_applicable', 'No inline media or mixed-content paragraph.'],
  COMP_STICKY_STRUCTURE: ['not_applicable', 'No sticky behavior.'],
  COMP_PICKER_VIEW_INDICATOR: ['not_applicable', 'No picker-view.'],
  COMP_SWIPER_LIMIT: ['not_applicable', 'No swiper.'],
  STYLE_MEDIA_SCREEN: ['passed', 'Every media selector is card-webview, assigned only outside Skyline. Skyline small class uses windowWidth<=320.'],
  STYLE_SELECTOR_UNSUPPORTED: ['passed', 'Attribute selector replaced by badge-sale class; only class selectors remain.'],
  STYLE_TEXT_OVERFLOW: ['passed', 'Title retains WebView CSS and adds max-lines=1/overflow=ellipsis; interpolation has no literal whitespace.'],
  STYLE_FLEX_TEXT_WRAP: ['passed', 'Two labels have width:50%; scroll items have definite allocated width; remaining flex wrappers contain block views.'],
  STYLE_OVERFLOW_AXIS: ['passed', 'Only single-value hidden retained for title and outer.'],
  STYLE_LAYOUT_UNSUPPORTED: ['passed', 'Grid replaced by explicit row Flex; no other listed unsupported layout properties.'],
  STYLE_TEXT_UNSUPPORTED: ['passed', 'No listed unsupported values.'],
  STYLE_FONT_POSTSCRIPT_NAME: ['documented_exception', 'City-Semibold has independent @font-face family. Trip-Medium is host-provided; preserve approved family without unapproved bold substitution. Binary PostScript metadata is unavailable.'],
  STYLE_FONT: ['documented_warning', 'Keep approved 600/500 weights; target device weight matching remains unverified.'],
  STYLE_TEXT_DECORATION: ['not_applicable', 'No text decoration.'],
  STYLE_BORDER_RADIUS_BORDER: ['not_applicable', 'No border/radius combinations.'],
  STYLE_BACKGROUND_MASK_LIMIT: ['not_applicable', 'Only solid backgrounds; no multi-layer background/mask.'],
  STYLE_FILTER_LIMIT: ['passed', 'Independent blur retained; compound blur->brightness split into inner blur and outer brightness.'],
  STYLE_BOX_SHADOW_MULTI: ['passed', 'RGBA internal commas are not shadow separators; two opaque shadows split into same-size nested boxes in original paint order.'],
  STYLE_CALC_ANGLE: ['not_applicable', 'No calc().'],
  STYLE_PSEUDO_ANIMATION: ['not_applicable', 'No pseudo-elements/animations.'],
  STYLE_ANIMATION_FILL_MODE: ['not_applicable', 'No animation.'],
  STYLE_ANIMATION_PROPERTY: ['not_applicable', 'No transition/animation.'],
  STYLE_Z_INDEX_CONTEXT: ['not_applicable', 'No z-index/fixed/transform/opacity dependencies. Filter composition uses direct nesting without layer comparison.'],
  STYLE_NEGATIVE_MARGIN_OCCUPANCY: ['passed', 'Host and tips-wrapper explicitly column Flex. Positive 28rpx wrapper margin compensates original collapsed -28rpx to retain content top 92rpx. Ordinary -8rpx margin untouched. Algebra checked; actual renderer geometry not_run.'],
  GLASS_SELECTOR_NUMERIC_ID: ['not_applicable', 'No ids or selector queries.'],
  ANIMATION_WEBVIEW_API: ['not_applicable', 'No animation API.'],
  SCROLL_CONTEXT_ENHANCED: ['not_applicable', 'No node()/ScrollViewContext acquisition, so enhanced is not required.'],
  SELECTOR_QUERY_SCOPE: ['not_applicable', 'No SelectorQuery.'],
  PROPS_DEFAULT_FIELD: ['passed', 'Only title property; correct value field.'],
  WX_FOR_DATA_TYPE: ['not_applicable', 'No wx:for.'],
  PROPS_UNION_TYPE: ['passed', 'title is String with a string default; no caller in input, interface preserved.']
}

const rules = Array.from(matrix.matchAll(/^\| `([A-Z_]+)` \| (error|warn) \|/gm), match => {
  if (!review[match[1]]) throw new Error('Missing manual review: ' + match[1])
  return { id: match[1], level: match[2], status: review[match[1]][0], reason: review[match[1]][1] }
})
if (rules.length !== Object.keys(review).length) throw new Error('Audit rule count mismatch')
fs.writeFileSync(path.join(root, 'audit.json'), JSON.stringify({
  scope: '../outputs/style-card.mpx',
  method: 'Skill aggregate rg scan plus full manual structure and declaration review; not a native renderer test',
  ruleCount: rules.length,
  unresolvedErrors: [],
  rules
}, null, 2) + '\n')

const compileLog = fs.readFileSync(path.join(root, 'compile.log'), 'utf8').replace(/\u001b\[[0-9;]*[A-Za-z]/g, '')
const compile = JSON.parse(compileLog.slice(compileLog.indexOf('{\n  "success"')))
fs.writeFileSync(path.join(root, 'compile-result.json'), JSON.stringify(compile, null, 2) + '\n')
const jest = JSON.parse(fs.readFileSync(path.join(root, 'jest-results.json'), 'utf8'))
const validation = {
  scope: ['../outputs/style-card.mpx'],
  target: ['wx/webview', 'wx/skyline/glass-easel'],
  sha256: crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex'),
  static: {
    status: 'passed_with_documented_font_exceptions',
    auditRuleCount: rules.length,
    evidence: ['audit-scan.sh', 'audit-scan.log', 'audit.json'],
    unresolvedErrors: [],
    warnings: ['Host font binary and PostScript metadata unavailable; 500/600 device matching unverified.']
  },
  eslint: { status: 'passed', exitCode: 0, evidence: 'eslint.log', command: 'npm run lint -- iteration-7/eval-0-style-layout/mpx2skyline/outputs/style-card.mpx' },
  mock: {
    status: jest.success ? 'passed' : 'failed',
    testsPassed: jest.numPassedTests,
    testsFailed: jest.numFailedTests,
    evidence: ['style-card.test.cjs', 'jest.config.cjs', 'jest.log', 'jest-results.json'],
    limits: 'VM mock of wx APIs and plain options lifecycle; CSS AST and algebra assertions do not measure rendering, font loading, clipping, or pixels.',
    infrastructureAttempts: [
      { attempt: 1, status: 'failed', reason: 'Watchman cannot chmod its state directory in sandbox', evidence: 'jest-attempt-1.log' },
      { attempt: 2, status: 'passed', fix: 'Disable Watchman only in run-1/jest.config.cjs' }
    ],
    testFailureFixes: 1
  },
  real_compile: {
    status: compile.success ? 'passed' : 'failed',
    exitCode: 1,
    attempts: 1,
    command: 'npm run compile-validate -- iteration-7/eval-0-style-layout/mpx2skyline/outputs/style-card.mpx --type=component --no-ignore-sub-components --json',
    evidence: ['compile.log', 'compile-result.json'],
    errors: compile.errors.map(error => ({ category: error.category, message: error.message })),
    warnings: compile.warnings,
    blocker: 'Input omits city.woff2; task assigns binary provision to host. Keep original independent font-family mapping; no fake font, altered-source compile, or successful compile claim.',
    limits: 'wx compiler only; it does not run the Skyline/glass-easel engine.'
  },
  developer_tools: { status: 'not_run', reason: 'No WeChat developer tools preview executed.' },
  real_device: { status: 'not_run', reason: 'No WeChat host/device attached; both renderer visual, font, scroll and resize acceptance remain to be run.' },
  overall: 'delivery_ready_with_host_font_dependency_and_unverified_native_visuals'
}
fs.writeFileSync(path.join(root, 'validation.json'), JSON.stringify(validation, null, 2) + '\n')
console.log(JSON.stringify({ auditRules: rules.length, jestPassed: jest.numPassedTests, compileStatus: validation.real_compile.status }, null, 2))
