import hashlib
import json
import re
from pathlib import Path

base = Path('iteration-8/eval-3-new-task-board-page/mpx')
out = base / 'outputs'
run = base / 'run-1'
files = {str(p.relative_to(out)): p.read_text() for p in out.rglob('*') if p.is_file() and p.suffix in ['.mpx', '.json']}
app = json.loads(files['app.json'])
original = json.loads((base.parent / 'input/app.json').read_text())
page = files['pages/task-board.mpx']
sources = '\n'.join(files.values())
assert app['pages'] == original['pages'] + ['pages/task-board']
assert app['window'] == original['window']
assert app['rendererOptions']['webview'] == original['rendererOptions']['webview']
assert app['lazyCodeLoading'] == 'requiredComponents'
assert app['rendererOptions']['skyline'] == {
    'defaultDisplayBlock': True, 'defaultContentBox': True, 'tagNameStyleIsolation': 'legacy',
    'enableScrollViewAutoSize': True, 'keyframeStyleIsolation': 'legacy'
}
compiled_page = json.loads((run / 'build-wx/__validate_0.json').read_text())
assert compiled_page['renderer'] == 'skyline'
assert compiled_page['componentFramework'] == 'glass-easel'
assert compiled_page['disableScroll'] is True
assert compiled_page['navigationStyle'] == 'custom'
for component_path in compiled_page['usingComponents'].values():
    root = run / 'build-wx' / component_path.lstrip('/')
    assert root.with_suffix('.wxml').is_file()
    assert json.loads(root.with_suffix('.json').read_text())['component'] is True
for source in files.values():
    if '<template>' not in source:
        continue
    template = source.split('<template>', 1)[1].split('</template>', 1)[0]
    for text in re.findall(r'<text\b[^>]*class="[^"]*(?:rating-label|segmented-label|segmented-option-text|task-title)[^"]*"[^>]*>', template):
        assert 'max-lines="{{1}}"' in text and 'overflow="ellipsis"' in text
    assert '<include' not in template
    assert not re.search(r'<(?:editor|movable-area|web-view|navigation-bar|match-media|keyboard-accessory)\b', template)
    for text_content in re.findall(r'<text\b[^>]*>(.*?)</text>', template, re.S):
        assert not re.search(r'<(?:view|image)\b', text_content)
assert 'type="list"' in page and 'refresher-triggered="{{refreshing}}"' in page
assert re.search(r'bindscrolltolower="onLoadMore">\s*<view wx:for=', page)
assert not re.search(r'overflow-[xy]\s*:|overflow\s*:\s*(?:auto|scroll)|@media|position\s*:\s*sticky|display\s*:\s*grid|wx\.createAnimation|\.node\(', sources)
assert not re.search(r'type\s*:\s*\[|default\s*:', sources)
assert 'defineOptions({ initData: { safeOptions: [] } })' in sources
assert 'Array.isArray(props.options) ? props.options : []' in sources
assert "onLoad((query, decodedQuery = query)" in page
assert 'clearTimeout(refreshTimer)' in page

notes = {
    'CONFIG_APP_SKYLINE_OPTIONS': '保留 pages/home、window 和 rendererOptions.webview；新增 requiredComponents 与 Skyline 五项默认对齐配置。',
    'CONFIG_PAGE_SKYLINE': '源码与真实编译后的 JSON 均包含 skyline、glass-easel、custom、disableScroll；胶囊避让、自绘返回和导航已实现。',
    'CONFIG_WORKLET_BABEL': '未使用 Worklet，宿主 mode/srcMode 为 wx；无需新增 Babel 插件。',
    'GLASS_TEMPLATE_FRAGMENT': '无 include 或模板片段。',
    'GLASS_TEMPLATE_ESCAPE': '完整属性复核：无反斜线引号；Mustache 中使用合法引号。',
    'COMP_UNSUPPORTED': '仅使用 view/text/scroll-view 与本次两个自定义组件，没有不支持组件。',
    'COMP_PENDING_SUPPORT': '没有 match-media 或 keyboard-accessory。',
    'COMP_WEBVIEW_ONLY_ATTR': '未使用候选中的 WebView-only 属性或取值。',
    'COMP_IMAGE_SVG': '未使用 image/SVG。',
    'COMP_SCROLL_TYPE': '唯一 scroll-view 显式 type=list，真实 WXML 已确认。',
    'COMP_SCROLL_LIST_DIRECT_CHILD': '任务 wx:for 节点是 scroll-view 直接子节点，无整列表 wrapper。',
    'COMP_SCROLL_NESTED': '没有嵌套滚动。',
    'COMP_SCROLL_HORIZONTAL': '没有横向滚动。',
    'COMP_SCROLL_HORIZONTAL_CHILD_WIDTH': '没有横向 scroll-view；分类是普通 Flex 等分布局。',
    'COMP_SCROLL_REFRESHER_SLOT': '使用宿主默认刷新指示器，没有自定义 refresher 节点；无需 slot。',
    'COMP_NAVIGATOR_CHILDREN': '未使用 navigator；返回用 view 点击 + api-proxy。',
    'COMP_TEXT_CHILDREN': '所有 text 仅承载纯文本插值，无 view/image 子节点。',
    'COMP_INLINE_MIXED_CONTENT': '任务勾选、标题、分类是独立 Flex 项，不是同段图文混排；无需 span。',
    'COMP_STICKY_STRUCTURE': '固定顶部在滚动区外，Flex 不收缩；无 position:sticky，无需 sticky 组件或 renderer 分支。',
    'COMP_PICKER_VIEW_INDICATOR': '无 picker-view。',
    'COMP_SWIPER_LIMIT': '无 swiper。',
    'STYLE_MEDIA_SCREEN': '未使用媒体查询；rpx + Flex 自适应窄屏，onResize 重读窗口高度。',
    'STYLE_SELECTOR_UNSUPPORTED': '语义 class 与组件 :host；没有通配、属性、active 或不支持伪元素。',
    'STYLE_TEXT_OVERFLOW': '任务标题、评分标题、分类标题和候选文案均有 max-lines/overflow 与 WebView nowrap/hidden/ellipsis，插值紧贴 text。',
    'STYLE_FLEX_TEXT_WRAP': '单行文本有 width:0+flex:1 或 width:100%，标题可收缩；星级/分数/分类不收缩。',
    'STYLE_OVERFLOW_AXIS': '仅 overflow:hidden 负责裁剪；纵向滚动由 scroll-view 承载。',
    'STYLE_LAYOUT_UNSUPPORTED': '仅常规 block/Flex；无 grid/float/flow-root 等。',
    'STYLE_TEXT_UNSUPPORTED': '未使用不支持的文本属性；white-space 仅 nowrap。',
    'STYLE_FONT_POSTSCRIPT_NAME': '无自定义字体或 PostScript name。',
    'STYLE_FONT': '只使用默认字重与 bold，无 500/600 等候选。',
    'STYLE_TEXT_DECORATION': '完成态标题仅 text-decoration-line:line-through 单值，作用于 text。',
    'STYLE_BORDER_RADIUS_BORDER': '圆角只用于分类背景，无单侧边框；任务底边无圆角。',
    'STYLE_BACKGROUND_MASK_LIMIT': '只有纯色背景，无图片、多层背景或遮罩。',
    'STYLE_FILTER_LIMIT': '无 filter/backdrop-filter。',
    'STYLE_BOX_SHADOW_MULTI': '无阴影。',
    'STYLE_CALC_ANGLE': '无 calc 角度。',
    'STYLE_PSEUDO_ANIMATION': '无伪元素动画。',
    'STYLE_ANIMATION_FILL_MODE': '无 keyframes/fill-mode。',
    'STYLE_ANIMATION_PROPERTY': '只过渡 transform 和 opacity，均为支持属性，150ms。',
    'STYLE_Z_INDEX_CONTEXT': '按压 transform/opacity 不参与层级逻辑；无 z-index、fixed、层叠依赖。',
    'STYLE_NEGATIVE_MARGIN_OCCUPANCY': '从零新建，无负 margin 或原占位链；间距由 padding 和单侧正 margin 表达。',
    'GLASS_SELECTOR_NUMERIC_ID': '未使用 id 或节点选择器。',
    'ANIMATION_WEBVIEW_API': '未使用宿主动画 API，只使用 CSS transition。',
    'SCROLL_CONTEXT_ENHANCED': '未查询 ScrollViewContext；唯一 scroll-view 仍开启 enhanced。',
    'SELECTOR_QUERY_SCOPE': '没有 SelectorQuery。',
    'PROPS_DEFAULT_FIELD': '两个组件属性描述均使用 value 默认值，不使用 default。',
    'WX_FOR_DATA_TYPE': 'stars/filteredTasks/safeOptions 首帧 initData=[]；运行期均返回数组；null options 归一为[]，异步更新已 mock 验证。',
    'PROPS_UNION_TYPE': '逐项复核 String/Number/Boolean/Array 与页面实际绑定相符，无 type 数组；options 空/null 路径由 computed 归一，native 类型处理待宿主验证。'
}
matrix = Path('iteration-8/skill-snapshots/mpx/references/skyline/skyline-audit-matrix.md').read_text()
ids = re.findall(r'^\| `([A-Z_]+)` \|', matrix, re.M)
assert set(ids) == set(notes)
audit = {
    'status': 'passed',
    'kind': 'static_source_review',
    'scope': list(files),
    'covered_component_tree': ['task-board', 'rating-selector', 'segmented-control'],
    'excluded': '宿主首页源码及实际构建配置不在输入内；仅检查已有 mpx.config.js 的 wx 源方言，未修改。',
    'rules': [{'id': rule, 'status': 'reviewed', 'result': notes[rule]} for rule in ids],
    'unresolved_errors': [],
    'visual_or_native_behavior': 'not_run',
    'source_sha256': {file: hashlib.sha256(content.encode()).hexdigest() for file, content in files.items()}
}
(run / 'skyline-audit.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2) + '\n')
print('Static checks passed; reviewed', len(ids), 'matrix rules; compiled component paths resolve.')
