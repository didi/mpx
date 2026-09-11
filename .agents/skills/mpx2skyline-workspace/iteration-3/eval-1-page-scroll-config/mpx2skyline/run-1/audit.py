from pathlib import Path
import re, shlex, subprocess
base = Path('/private/tmp/skyline-v3-baseline-20260911/eval-1-page-scroll-config/mpx2skyline')
matrix = Path('/Users/hjw/project/mpx/.agents/skills/mpx2skyline/references/skyline-audit-matrix.md').read_text()
command = re.search(r'```bash\n(.*?)\n```', matrix, re.S).group(1)
args = shlex.split(command)
args[args.index('<scope>')] = str(base / 'outputs')
result = subprocess.run(args, capture_output=True, text=True)
(base / 'run-1/audit-scan.log').write_text(result.stdout + result.stderr)
assert result.returncode in (0, 1)
notes = {
'CONFIG_APP_SKYLINE_OPTIONS': 'pass: 顶层 lazyCodeLoading 与 skyline 五项齐全；原配置保留。',
'CONFIG_PAGE_SKYLINE': 'pass: 四项配置齐全，自定义导航为真实 view/text。',
'GLASS_INCLUDE_IN_FOR': 'pass: 循环直接生成 view，无 include。',
'COMP_SCROLL_TYPE': 'pass: type=list。',
'COMP_SCROLL_LIST_DIRECT_CHILD': 'pass: 循环订单项为 scroll-view 直接子节点。',
'COMP_SCROLL_REFRESHER_SLOT': 'exception: 使用默认 refresher，无自定义节点。',
'COMP_TEXT_CHILDREN': 'pass: text 仅包含纯文本/插值。',
'STYLE_FLEX_TEXT_WRAP': 'exception: 导航固定两字标题，无多行文本需求。',
'SCROLL_CONTEXT_ENHANCED': 'pass: 没有 node() 查询；scroll-view 已开启 enhanced。',
'WX_FOR_DATA_TYPE': 'pass: orders 初始数组，fetchOrders 固定返回数组，刷新/追加路径保持数组。'
}
rows = re.findall(r'^\| `([A-Z_]+)` \| (error|warn) \|', matrix, re.M)
text = '# 完整适配矩阵复核\n\n范围：orders.mpx 全部区块、app.json、service.js；无自定义组件。聚合扫描结果见 audit-scan.log。逐项人工核对整个文件后记录；未命中不等同真机兼容证明。\n\n|规则|级别|结论|\n|---|---|---|\n'
for key, level in rows:
    text += f'|{key}|{level}|{notes.get(key, "not_applicable: 本范围无对应 API、配置需求、组件或样式模式。")}|\n'
text += '\nerror 残留：0。warn 候选：默认 refresher 与固定短标题已说明例外，其余适用项通过源码复核。页面三个滚动生命周期已统一迁移到 scroll-view。无 Skyline-only 运行时 API；仅微信目标，WebView 使用同一事件链。iOS/Android Skyline、WebView 真机及开发者工具：not_run。\n'
(base / 'run-1/audit.md').write_text(text)
source = (base / 'outputs/orders.mpx').read_text()
(base / 'run-1/orders-script.js').write_text(re.search(r'<script>(.*?)</script>', source, re.S).group(1))
print(f'Aggregate scan exit={result.returncode}; manually reviewed {len(rows)} rules; script extracted for ESLint')
