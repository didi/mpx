from pathlib import Path
import hashlib
import json
import re
import xml.etree.ElementTree as ET

base = Path('iteration-7/eval-2-template-runtime-inline-animation/mpx')
outputs = base / 'outputs'
run = base / 'run-1'
source = (outputs / 'user-list.mpx').read_text()
row = (outputs / 'row.wxml').read_text()
svg = (outputs / 'logo.svg').read_text()
style = re.search(r'<style>(.*?)</style>', source, re.S)[1]
config = json.loads(re.search(r'<script type="application/json">(.*?)</script>', source, re.S)[1])
assert config == {'component': True}
assert '<include' not in source
assert re.search(r'<template name="user-row">', row)
assert not re.search(r'id=[\'"][0-9]', source)
assert not re.search(r'::|createAnimation|animationData|animation-fill-mode:\s*(none|backwards)', source)
assert not re.search(r'overflow-[xy]|@media|display:\s*(grid|flow-root)|position:\s*sticky', style)
assert re.search(r'createSelectorQuery\(\)\.select\(\'#users\'\)\.node\(\)', source)
assert re.search(r'<scroll-view id="users"[^>]*enhanced="{{true}}"', source)
assert len(re.findall(r'<scroll-view\b', source)) == len(re.findall(r'<scroll-view[^>]*type="list"', source)) == 2
root = ET.fromstring(svg)
assert root.attrib['width'] == root.attrib['height'] == '24'
assert '<style' not in svg and '%' not in svg and 'rgba(' not in svg
assert (outputs / 'logo.svg').read_bytes() == (base.parent / 'input/logo.svg').read_bytes()

# Full matrix dispositions are source/structure review, not renderer test results.
notes = {
'CONFIG_APP_SKYLINE_OPTIONS': ('not_applicable', '仅组件范围；未提供 app.json，宿主配置未核验。keyframes 与使用节点在同一个组件样式内，名称 userListPulse。'),
'CONFIG_PAGE_SKYLINE': ('not_applicable', '仅组件范围；宿主页 Skyline/glass-easel 已由任务确认，不在组件 JSON 添加页面配置。'),
'CONFIG_WORKLET_BABEL': ('not_applicable', '仅 CSS animation/transition，不使用 Worklet。'),
'GLASS_TEMPLATE_FRAGMENT': ('passed', 'import row.wxml + user-row 具名模板，显式传 index/item。'),
'GLASS_TEMPLATE_ESCAPE': ('passed', '完整模板属性无反斜杠引号；绑定内外定界无冲突。'),
'COMP_UNSUPPORTED': ('not_applicable', '无不支持的基础组件。'),
'COMP_PENDING_SUPPORT': ('not_applicable', '无 match-media/keyboard-accessory。'),
'COMP_WEBVIEW_ONLY_ATTR': ('passed', '无依赖 WebView-only 属性/裁剪模式。'),
'COMP_IMAGE_SVG': ('passed', 'SVG 24x24 数值尺寸与 circle 内联填色保留；image 显式 aspectFit。'),
'COMP_SCROLL_TYPE': ('passed', 'other 与 users 均显式 type=list。'),
'COMP_SCROLL_LIST_DIRECT_CHILD': ('passed', 'users 循环 view 为直接列表项；other 保留原空辅助容器，不依赖列表虚拟化。'),
'COMP_SCROLL_NESTED': ('not_applicable', '两个 scroll-view 为兄弟，无嵌套滚动。'),
'COMP_SCROLL_HORIZONTAL': ('not_applicable', '未开启横向滚动。'),
'COMP_SCROLL_HORIZONTAL_CHILD_WIDTH': ('not_applicable', '无横向 scroll-view 直接子节点。'),
'COMP_SCROLL_REFRESHER_SLOT': ('not_applicable', '无下拉刷新节点或刷新需求。'),
'COMP_NAVIGATOR_CHILDREN': ('passed', '简单入口仅 text；复杂卡片由外层 view 点击 navigateTo。'),
'COMP_TEXT_CHILDREN': ('passed', '所有 text 仅包含文字或插值。'),
'COMP_INLINE_MIXED_CONTENT': ('passed', '图标/label 同处 span，整段 max-lines=1/overflow=ellipsis；视觉待微信验证。'),
'COMP_STICKY_STRUCTURE': ('not_applicable', '无吸顶。'),
'COMP_PICKER_VIEW_INDICATOR': ('not_applicable', '无 picker-view。'),
'COMP_SWIPER_LIMIT': ('not_applicable', '无 swiper。'),
'STYLE_MEDIA_SCREEN': ('not_applicable', '无媒体查询。'),
'STYLE_SELECTOR_UNSUPPORTED': ('passed', '使用类选择器，未用通配/属性/伪元素选择器。'),
'STYLE_TEXT_OVERFLOW': ('passed', 'span 对整段设置单行省略；保留 WebView nowrap/hidden/text-overflow；插值紧贴 text。'),
'STYLE_FLEX_TEXT_WRAP': ('passed', '标题需求为单行；span flex:1,width:0,min-width:0 在 heading 分配剩余宽度。'),
'STYLE_OVERFLOW_AXIS': ('passed', '仅 overflow:hidden，无 auto/scroll/单轴或双值 overflow。'),
'STYLE_LAYOUT_UNSUPPORTED': ('not_applicable', '无 grid/flow-root/float 等受限布局。'),
'STYLE_TEXT_UNSUPPORTED': ('passed', 'white-space:nowrap、vertical-align:middle，无已列不支持文本值。'),
'STYLE_FONT_POSTSCRIPT_NAME': ('not_applicable', '无字体资源或字体族变更。'),
'STYLE_FONT': ('not_applicable', '无 500/600/bolder/lighter/oblique。'),
'STYLE_TEXT_DECORATION': ('not_applicable', '无文本装饰。'),
'STYLE_BORDER_RADIUS_BORDER': ('passed', '圆点 border-radius:4px，无四边边框差异。'),
'STYLE_BACKGROUND_MASK_LIMIT': ('not_applicable', '只有单色背景，无背景图/遮罩。'),
'STYLE_FILTER_LIMIT': ('not_applicable', '无滤镜。'),
'STYLE_BOX_SHADOW_MULTI': ('not_applicable', '无阴影。'),
'STYLE_CALC_ANGLE': ('not_applicable', '无 calc。'),
'STYLE_PSEUDO_ANIMATION': ('passed', 'pulse 为真实 view，原伪元素移除。'),
'STYLE_ANIMATION_FILL_MODE': ('passed', 'both + 显式初始 opacity:.3，不再使用 backwards。'),
'STYLE_ANIMATION_PROPERTY': ('passed', '圆点只动画 opacity；按钮只 transition transform/opacity，150ms。'),
'STYLE_Z_INDEX_CONTEXT': ('passed', 'transform/opacity 仅作反馈，无 z-index、fixed 或遮挡层级依赖。'),
'STYLE_NEGATIVE_MARGIN_OCCUPANCY': ('not_applicable', '无负 margin 或折叠占位链。'),
'GLASS_SELECTOR_NUMERIC_ID': ('passed', 'id 与 selector 同步改为 users，other 未混淆。'),
'ANIMATION_WEBVIEW_API': ('passed', '移除 wx.createAnimation/animationData，双 renderer 共用 CSS。'),
'SCROLL_CONTEXT_ENHANCED': ('passed', "select('#users').node() 精确关联已开启 enhanced 的 users。"),
'SELECTOR_QUERY_SCOPE': ('passed', '使用 this.createSelectorQuery() 限定组件作用域。'),
'PROPS_DEFAULT_FIELD': ('passed', 'properties 均使用 value；config.default 是业务数据，保留 keep。'),
'WX_FOR_DATA_TYPE': ('passed', 'initData.visibleItems=[]；items 默认[]，computed 对 null/undefined 回退[]后过滤；setRows 更新均有 mock 覆盖。'),
'PROPS_UNION_TYPE': ('passed', 'label String；payload String + optionalTypes:[Object]，默认空串；未放宽类型。调用侧未提供。')
}
matrix = Path('../mpx/references/skyline/skyline-audit-matrix.md').read_text()
rules = re.findall(r'^\| `([A-Z_]+)` \| (error|warn) \|', matrix, re.M)
assert {key for key, level in rules} == set(notes)
audit = {
    'status': 'passed',
    'kind': 'static_assertions_and_manual_full_matrix_review',
    'scope': ['user-list.mpx', 'row.wxml', 'logo.svg'],
    'unresolved_errors': [],
    'unresolved_warnings': [],
    'rules': [dict(id=key, level=level, status=notes[key][0], evidence=notes[key][1]) for key, level in rules],
    'limits': ['不验证宿主 app/page 配置、调用侧 props 或任何真实渲染。', 'passed 仅表示静态检查项满足，不代表真机效果通过。']
}
(run / 'static-audit.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2) + '\n')
(run / 'static-audit.md').write_text('完整检查矩阵：仅组件、外部行片段及 SVG；所有状态均为静态复核。\n\n| 规则 | 级别 | 状态 | 依据 |\n| --- | --- | --- | --- |\n' + '\n'.join(f'| {key} | {level} | {notes[key][0]} | {notes[key][1]} |' for key, level in rules) + '\n')
print(json.dumps({'status': 'passed', 'rules_reviewed': len(rules)}, ensure_ascii=False))

log = (run / 'compile.log').read_text()
compile_result = json.loads(log[log.index('{\n  "success"'):])
(run / 'compile-result.json').write_text(json.dumps(compile_result, ensure_ascii=False, indent=2) + '\n')
jest = json.loads((run / 'jest-results.json').read_text())
assert jest['success'] and jest['numPassedTests'] == 14
assert compile_result['success'] and not compile_result['errors'] and not compile_result['warnings']
assert not (run / 'eslint.log').read_text().strip()
validation = {
    'target': 'wx',
    'renderers': ['webview', 'skyline'],
    'scope': ['user-list.mpx', 'row.wxml', 'logo.svg'],
    'static': {'status': 'passed', 'evidence': ['static-audit.json', 'static-audit.md', 'static-audit.py'], 'rules_reviewed': len(rules)},
    'eslint': {'status': 'passed', 'exit_code': 0, 'evidence': 'eslint.log', 'scope': 'outputs/user-list.mpx'},
    'mock': {
        'status': 'passed', 'runner': 'Jest', 'tests_passed': jest['numPassedTests'],
        'evidence': ['user-list.test.cjs', 'jest.config.cjs', 'jest-results.json', 'jest.log'],
        'covers': ['初始化及数据返回前空列表', 'null/数组替换/空数组更新', 'visible 过滤后 index/item', '组件作用域 #users 查询与重复回顶调用，other 未调用', '按下/松开/取消/tap', '卡片 API 跳转和简单 navigator URL 静态契约'],
        'limits': 'VM 截获 createComponent；computed 手动求值，WXML 仅字段替换；不运行 Mpx 响应式或微信模板/路由/滚动引擎。两组 renderer 参数运行相同共用逻辑，不是两种真实 renderer。',
        'attempts': [
            {'attempt': 1, 'status': 'failed', 'cause': 'Watchman 无权修改宿主状态目录，测试未开始。', 'fix': '仅 run-1 Jest 配置关闭 Watchman。', 'evidence': 'jest-attempt-1.log'},
            {'attempt': 2, 'status': 'failed', 'cause': '测试正则把 {{1}} 中的 {1} 解释为量词，13通过/1失败。', 'fix': '转义测试正则花括号，业务文件未改。', 'evidence': ['jest-attempt-2.log', 'jest-attempt-2.json']},
            {'attempt': 3, 'status': 'passed', 'fixes_so_far': 2, 'evidence': ['jest.log', 'jest-results.json']}
        ]
    },
    'real_compile': {'status': 'passed', 'target': 'wx', 'tool': '../mpx/scripts/compile-validate.js', 'errors': len(compile_result['errors']), 'warnings': len(compile_result['warnings']), 'evidence': ['compile.log', 'compile-result.json'], 'limits': '单组件真实 Mpx/webpack 编译；不验证微信 renderer、页面注册或真机。'},
    'wechat_devtools': {'webview': 'not_run', 'skyline': 'not_run', 'reason': '没有接入业务宿主或微信开发者工具。'},
    'real_device': {'webview': 'not_run', 'skyline': 'not_run', 'reason': '没有真机运行环境。'},
    'visual_and_actual_scroll': {'status': 'not_run', 'pending': ['两种 renderer 窄宽度和长 label 同段单行省略', '8px #f50 圆点1秒循环效果', '按钮150ms缩放/透明度与取消恢复', '用户列表实际滚动/重复回顶且 other 不动', '两个详情入口在真实页面路由到 /pages/detail']},
    'artifacts_sha256': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(outputs.iterdir()) if p.suffix in ['.mpx', '.wxml', '.svg']}
}
(run / 'validation.json').write_text(json.dumps(validation, ensure_ascii=False, indent=2) + '\n')
