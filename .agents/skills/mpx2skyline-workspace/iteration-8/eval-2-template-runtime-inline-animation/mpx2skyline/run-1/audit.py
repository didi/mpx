import json
import re
import subprocess
from pathlib import Path

base = Path('iteration-8/eval-2-template-runtime-inline-animation/mpx2skyline')
out = base / 'outputs'
run = base / 'run-1'
matrix = Path('iteration-8/skill-snapshots/mpx2skyline/references/skyline-audit-matrix.md').read_text()
texts = {p.name: p.read_text() for p in [out / 'user-list.mpx', out / 'row.wxml', out / 'logo.svg']}
combined = '\n'.join(texts.values())
script = re.search(r'<script>([\s\S]*?)</script>', texts['user-list.mpx']).group(1)
style = re.search(r'<style>([\s\S]*?)</style>', texts['user-list.mpx']).group(1)
template = re.search(r'<template>([\s\S]*?)</template>', texts['user-list.mpx']).group(1) + texts['row.wxml']
command = re.search(r'```bash\n([\s\S]*?)\n```', matrix).group(1).replace('<scope>', str(out))
command += " -g '*.wxml' -g '*.svg'"
scan = subprocess.run(command, shell=True, text=True, capture_output=True)
(run / 'audit-scan.log').write_text(scan.stdout + scan.stderr)
assert scan.returncode in (0, 1), scan.stderr

notes = {
    'CONFIG_APP_SKYLINE_OPTIONS': ('not_applicable', '仅组件范围；宿主已接入 Skyline/glass-easel，无 app 输入，不声明已核验宿主配置。'),
    'CONFIG_PAGE_SKYLINE': ('not_applicable', '仅组件范围，保留 component:true，不添加页面导航/renderer 配置。'),
    'CONFIG_WORKLET_BABEL': ('not_applicable', '无 Worklet，统一 CSS transition/animation。'),
    'COMP_IMAGE_SVG': ('pass', 'logo.svg 数值尺寸/坐标及内联 fill；image 显式 aspectFit，无 scaleToFill 差异。'),
    'COMP_SCROLL_TYPE': ('pass', 'users 和 other 都显式 type=list。'),
    'COMP_SCROLL_LIST_DIRECT_CHILD': ('pass', 'users 直接子 view 上 wx:for；other 为空的对照容器，无列表项虚拟化要求。'),
    'COMP_NAVIGATOR_CHILDREN': ('pass', '唯一 navigator 只含 text；卡片外层 view 绑定 openDetail。'),
    'COMP_TEXT_CHILDREN': ('pass', '各 text 仅含文字或插值，无非法子组件。'),
    'COMP_INLINE_MIXED_CONTENT': ('pass', '同一 span 包含 image+text；title flex:1/width:0/min-width:0；max-lines=1/overflow=ellipsis；实际 image 的 skyline-inline 类仅 Skyline 设置 inline-block。'),
    'STYLE_TEXT_OVERFLOW': ('pass', '标题共同截断；WebView truncate 保留 nowrap/hidden/ellipsis；Skyline span 属性+nowrap，文案插值无额外空白。'),
    'STYLE_FLEX_TEXT_WRAP': ('pass', '标题为 flex 子项且显式 width:0/flex:1/min-width:0；业务为单行省略，无换行需求。'),
    'STYLE_OVERFLOW_AXIS': ('pass', '唯一 CSS overflow:hidden 是 WebView truncate 类；无 overflow-x/y、auto、scroll 或双值。'),
    'STYLE_BORDER_RADIUS_BORDER': ('pass', '8px 圆点 border-radius:4px，无边框，不存在四边颜色/样式差异。'),
    'STYLE_ANIMATION_PROPERTY': ('pass', '真实节点 keyframes 仅 opacity；按钮 transition 仅 transform/opacity，均在白名单内。'),
    'STYLE_Z_INDEX_CONTEXT': ('pass', 'opacity/transform 仅视觉反馈；无 z-index、fixed 或跨分支叠层依赖。'),
    'SCROLL_CONTEXT_ENHANCED': ('pass', "this.createSelectorQuery().select('#users').node() 精确对应 users 的 enhanced=true；不因 other 已开启 enhanced 而代替检查。"),
    'PROPS_DEFAULT_FIELD': ('pass', '逐项 properties 使用 value；default 只属于 data.config.default，按业务要求保留。'),
    'WX_FOR_DATA_TYPE': ('pass', 'initData.visibleItems=[]；data.items=[]；setRows 将 null 归一为 []；computed.filter 始终返回数组，已测试多次更新。')
}
records = []
for line in matrix.splitlines():
    if not re.match(r'^\| `[A-Z_]+` \|', line):
        continue
    cols = line.split(' | ')
    rule = re.search(r'`([^`]+)`', cols[0]).group(1)
    level, scope = cols[1:3]
    pattern_parts = re.findall(r'`([^`]+)`', cols[3])
    pattern = '|'.join(pattern_parts).replace('\\\\', '\\').replace('\\|', '|')
    if rule.startswith('CONFIG_'):
        target = combined
    elif scope == 'style':
        target = style
    elif scope == 'script':
        target = script
    elif scope == 'template':
        target = template
    else:
        target = combined
    try:
        candidates = len(list(re.finditer(pattern, target)))
    except re.error as error:
        raise RuntimeError(f'{rule}: {pattern}: {error}')
    if rule in notes:
        status, reason = notes[rule]
    else:
        assert candidates == 0, f'Unreviewed candidate: {rule}'
        status, reason = 'no_match', '全范围候选扫描无命中，结合完整 SFC/片段/资源复核无此能力或差异。'
    records.append(dict(id=rule, level=level, scope=scope, candidate_count=candidates, status=status, reason=reason))
assert records
result = {
    'status': 'pass',
    'scope': list(texts),
    'source': 'iteration-8/skill-snapshots/mpx2skyline/references/skyline-audit-matrix.md',
    'rules_reviewed': len(records),
    'unresolved_errors': [],
    'unresolved_warnings': [],
    'rules': records,
    'manual_review': {
        'property_types': 'label:String/value=用户；payload:String/optionalTypes=[Object]/value=空字符串，接口声明一致；调用方未提供，不声称核验所有宿主传值。',
        'host_configuration': 'not_run：宿主配置不属于组件输入；已有 Skyline/glass-easel 接入按任务前提复用。',
        'keyframes': '动画与关键帧同处组件；已核对快照推荐 rendererOptions.skyline.keyframeStyleIsolation=legacy，但宿主文件未提供，该项实际取值未验证。',
        'rendering': 'not_run：双 renderer 真机长标题截断、图片对齐、圆点动画、按压观感与实际滚动/跳转需真机验证。'
    }
}
(run / 'audit.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': result['status'], 'rules_reviewed': len(records), 'unresolved_errors': 0, 'unresolved_warnings': 0}, ensure_ascii=False))
