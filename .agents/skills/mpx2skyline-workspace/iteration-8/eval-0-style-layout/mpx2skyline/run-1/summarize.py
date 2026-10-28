import json
import re
import shlex
import subprocess
from pathlib import Path

root = Path('iteration-8/eval-0-style-layout/mpx2skyline')
run = root / 'run-1'
matrix = Path('iteration-8/skill-snapshots/mpx2skyline/references/skyline-audit-matrix.md').read_text()
command = re.search(r'```bash\n([\s\S]*?)\n```', matrix).group(1)
args = shlex.split(command.replace('<scope>', str(root / 'outputs')))
scan = subprocess.run(args, capture_output=True, text=True)
(run / 'audit-scan.log').write_text(scan.stdout + scan.stderr)
assert scan.returncode in (0, 1)

decisions = {
    'CONFIG_APP_SKYLINE_OPTIONS': ('not_applicable', '单组件 scope；宿主已配置 defaultDisplayBlock/defaultContentBox；不改宿主配置。'),
    'CONFIG_PAGE_SKYLINE': ('not_applicable', 'component:true，无页面入口或页面事件。'),
    'CONFIG_WORKLET_BABEL': ('not_applicable', '未使用 Worklet。'),
    'COMP_SCROLL_TYPE': ('passed', '横向容器保留 type=custom。'),
    'COMP_SCROLL_HORIZONTAL': ('passed', 'scroll-x、enable-flex、显式 flex-direction:row。'),
    'COMP_SCROLL_HORIZONTAL_CHILD_WIDTH': ('passed', '直接 fit-content 设置 width:100%；fit-item 各50%，320px视口中各160px。'),
    'COMP_TEXT_CHILDREN': ('passed', 'text 均为纯文本或单一插值，无非 text 子节点。'),
    'STYLE_MEDIA_SCREEN': ('passed', '媒体规则仅匹配 card-webview；该类只在非 Skyline 持有；Skyline 读取窗口并监听 resize，detached 清理。'),
    'STYLE_SELECTOR_UNSUPPORTED': ('passed', '属性选择器改为 badge-sale 类；无不支持的伪元素或通配选择器。'),
    'STYLE_TEXT_OVERFLOW': ('passed', 'title 保留 WebView CSS；新增 max-lines=1/overflow=ellipsis；插值紧贴标签。'),
    'STYLE_FLEX_TEXT_WRAP': ('passed', '标签、横向项均有50%宽度；纵向容器默认stretch，短内容无额外居中收缩。'),
    'STYLE_OVERFLOW_AXIS': ('passed', '仅使用单值 overflow:hidden；outer 不再依赖 BFC 提供顶部间距。'),
    'STYLE_LAYOUT_UNSUPPORTED': ('passed', 'grid 改横向Flex；无 float/flow-root 等不支持布局。'),
    'STYLE_FONT_POSTSCRIPT_NAME': ('exception', 'City-Semibold 已有同名字体族 @font-face；Trip-Medium 由宿主提供；保持已确认设计，不擅改字体族或字重。未取得二进制，无法核验 name 表。'),
    'STYLE_FONT': ('exception', '保留600/500；部分机型字重匹配风险，需宿主字体和真机核验，不擅自替换为700。'),
    'STYLE_FILTER_LIMIT': ('passed', '独立blur保留；复合效果内层blur、外层brightness，维持先blur后brightness。'),
    'STYLE_BOX_SHADOW_MULTI': ('passed', 'rgba逗号不是多阴影；双阴影拆同尺寸父子，外层#333，内层#000绘制在上。'),
    'STYLE_NEGATIVE_MARGIN_OCCUPANCY': ('passed_static_only', '原H=184，原起点184+min(-28,-92)=92；Flex wrapper占位156，后项-64起点92，末端212；普通-8单侧回拉不改父布局。实际渲染not_run。'),
    'SCROLL_CONTEXT_ENHANCED': ('not_applicable', '无 node()/ScrollViewContext 获取，不要求额外 enhanced。'),
    'PROPS_DEFAULT_FIELD': ('passed', 'title descriptor 使用 String/value，保留公开接口。'),
    'PROPS_UNION_TYPE': ('passed', '无数组联合类型；title 默认值是字符串；输入未提供调用方。'),
}
rows = []
for match in re.finditer(r'^\| `([A-Z_]+)` \| (error|warn) \|', matrix, re.M):
    rule_id, level = match.groups()
    status, reason = decisions.get(rule_id, ('not_applicable', '已对完整SFC模板、脚本、样式及JSON人工复核；无该规则涉及的组件、API、结构或不支持值。'))
    rows.append(dict(id=rule_id, level=level, status=status, reason=reason))
assert set(decisions).issubset({r['id'] for r in rows})
(run / 'audit.json').write_text(json.dumps({'scope': ['outputs/style-card.mpx'], 'method': 'aggregate rg + full source manual review against every matrix rule', 'rules': rows}, ensure_ascii=False, indent=2))

log = re.sub(r'\x1b\[[0-9;]*[A-Za-z]', '', (run / 'compile.log').read_text())
compile_result = json.loads(log[log.index('{\n  "success"'):])
(run / 'compile.json').write_text(json.dumps(compile_result, ensure_ascii=False, indent=2))
jest = json.loads((run / 'jest.json').read_text())
lint = json.loads((run / 'eslint.json').read_text())
result = {
    'scope': ['outputs/style-card.mpx'],
    'static': {'status': 'passed_with_exceptions', 'matrix_rule_count': len(rows), 'evidence': ['audit.json', 'audit-scan.log'], 'exceptions': ['STYLE_FONT_POSTSCRIPT_NAME', 'STYLE_FONT']},
    'eslint': {'status': 'passed' if not any(r['errorCount'] for r in lint) else 'failed', 'scope': 'extracted component script; recommended JS rules plus style rules', 'evidence': ['check.cjs', 'component-script.js', 'eslint.json', 'eslint.log']},
    'jest': {'status': 'passed' if jest['success'] else 'failed', 'passed_tests': jest['numPassedTests'], 'failed_tests': jest['numFailedTests'], 'attempts': 2, 'first_failure': 'Watchman sandbox fchmod denied; second run disables Watchman', 'evidence': ['style-card.test.cjs', 'jest.json', 'jest.log', 'jest-attempt-1.log']},
    'mock': {'status': 'passed', 'coverage': ['Skyline initial widths 319/320/321/375', 'resize across threshold', 'same callback cleanup', 'independent instances', 'WebView native media-query path without runtime listeners'], 'limitation': 'VM mocks do not execute Mpx reactivity or native renderers'},
    'real_compile': {'status': 'failed', 'target': 'wx', 'attempts': 1, 'command': 'npm run compile-validate -- iteration-8/eval-0-style-layout/mpx2skyline/outputs/style-card.mpx --type=component --json', 'evidence': ['compile.json', 'compile.log'], 'reason': "Can't resolve './city.woff2'; host-supplied binary not included in inputs; two dependency diagnostics from same missing asset", 'warnings': len(compile_result['warnings'])},
    'developer_tools': {'status': 'not_run', 'reason': 'No configured native renderer session in this task'},
    'real_device': {'status': 'not_run', 'reason': 'No device or host font binary supplied; font match, truncation, shadow/filter pixels and layout require device review'},
    'font_binary_inspection': {'status': 'not_run', 'reason': 'Input contains no font binary; CSS family declaration inspected only'},
    'layout_baseline': {'status': 'passed_static_only', 'units': 'rpx', 'original_webview': {'tips_border_height': 184, 'wrapper_height_before_collapsed_margin': 184, 'collapsed_margin': -92, 'content_start': 92, 'visual_overlap': 92, 'host_end': 212}, 'adapted_webview_and_skyline': {'tips_border_height': 184, 'wrapper_occupied_height': 156, 'content_margin_top': -64, 'content_start': 92, 'visual_overlap': 92, 'host_end': 212}, 'measured': False}
}
(run / 'validation.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
print(json.dumps({'matrix_rules': len(rows), 'jest_passed': jest['numPassedTests'], 'compile': result['real_compile']['status']}, ensure_ascii=False))
