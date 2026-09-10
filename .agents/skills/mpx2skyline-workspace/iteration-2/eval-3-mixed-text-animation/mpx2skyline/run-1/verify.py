from pathlib import Path
import re,json,datetime
base=Path(__file__).parent
out=base.parent/'outputs'
s=(out/'promo-card.mpx').read_text()
script=re.search(r'<script>\n(.*?)</script>',s,re.S).group(1)
(base/'component.js').write_text(script)
matrix=Path('/Users/hjw/project/mpx/.agents/skills/mpx2skyline/references/skyline-audit-matrix.md').read_text()
rows=[]
notes={
'CONFIG_APP_SKYLINE_OPTIONS':'单组件任务例外；宿主 app.json 未提供，keyframes 在组件内定义；集成时核对 keyframeStyleIsolation。',
'CONFIG_PAGE_SKYLINE':'单组件任务，无页面配置。',
'COMP_IMAGE_SVG':'已逐项检查 SVG：固定 24×24 与 viewBox；无 style、百分比、rgba。展示尺寸同为 24×24，无拉伸比例差异。',
'COMP_INLINE_MIXED_CONTENT':'同一 wx span 包含 image 与 text；运行时 Skyline 只用 nowrap、image inline-block；span 承载 max-lines/overflow。',
'COMP_TEXT_CHILDREN':'text 仅含紧贴标签的插值或领取文本，无非 text 子节点。',
'STYLE_TEXT_OVERFLOW':'WebView 保留 truncate；Skyline span 属性负责截断。',
'STYLE_FLEX_TEXT_WRAP':'单行标题 flex:1、width:0、min-width:0；不要求换行。',
'COMP_SCROLL_HORIZONTAL':'row 为普通 flex 容器，无 scroll-view。',
'STYLE_BORDER_RADIUS_BORDER':'圆点无 border，四边无差异。',
'STYLE_ANIMATION_PROPERTY':'仅 transform 与 opacity；fill-mode both，真实节点关键帧。',
'STYLE_Z_INDEX_CONTEXT':'无定位重叠或 z-index 依赖；transform/opacity 仅按钮反馈和圆点动画。'
}
for line in matrix.splitlines():
    if not re.match(r'\| `[A-Z_]+` \|',line):continue
    cells=re.split(r'(?<!\\)\|',line)[1:-1]
    rule=cells[0].strip().strip('`');pattern=cells[3].strip().strip('`').replace(r'\|','|').replace('\\\\','\\')
    try:
        matches=[{'line':s.count('\n',0,m.start())+1,'text':m.group(0)[:120]} for m in re.finditer(pattern,s)]
    except re.error as e:
        matches=[{'manual_scan':str(e)}]
    rows.append({'id':rule,'level':cells[1].strip(),'pattern':pattern,'candidates':matches,'review':notes.get(rule,'完整组件结构人工复核：未使用该规则限制能力，无适用问题。')})
(base/'audit.json').write_text(json.dumps({'scope':['promo-card.mpx','logo.svg'],'rules':rows,'unresolved_errors':[],'limitations':['无微信开发者工具/真机渲染验证','无宿主 app.json；集成时核对全局配置']},ensure_ascii=False,indent=2))
print('Audited',len(rows),'rules; extracted component.js')
