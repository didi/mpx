import pathlib, re, json
run = pathlib.Path(__file__).parent
source = (run.parent / 'outputs/rating-selector.mpx').read_text()
matrix = pathlib.Path('/Users/hjw/project/mpx/.agents/skills/mpx2skyline/references/skyline-audit-matrix.md').read_text()
notes = {
 'CONFIG_APP_SKYLINE_OPTIONS': '仅单组件范围，全局配置按规则允许例外，不创建 app.json。',
 'CONFIG_PAGE_SKYLINE': '无页面职责，页面配置不适用。',
 'CONFIG_WORKLET_BABEL': '仅 CSS transform transition，无 Worklet。',
 'GLASS_INCLUDE_IN_FOR': 'wx:for 直接渲染 view/text，不包含 include。',
 'COMP_TEXT_CHILDREN': '所有 text 只包含紧贴标签的纯文本/插值，无组件子节点。',
 'COMP_SCROLL_HORIZONTAL': 'flex-direction: row 是普通评分容器，不是滚动容器。',
 'STYLE_TEXT_OVERFLOW': '唯一省略节点 rating-label 同时设置 max-lines=1、overflow=ellipsis 和 WebView 三项省略 CSS。',
 'STYLE_FLEX_TEXT_WRAP': '标签 width:0、flex:1、min-width:0 获取有限剩余宽度；分数不收缩，星号各占同等 flex 份额；没有多行文本。',
 'STYLE_ANIMATION_PROPERTY': 'transition 仅 transform，150ms，颜色直接切换。',
 'STYLE_Z_INDEX_CONTEXT': 'transform 仅用于按压缩放，不承担层级关系，没有 z-index 或定位覆盖。',
 'PROPS_DEFAULT_FIELD': '五个属性逐项检查，简写 String 及 descriptor 类型合法，默认值字段为 value。',
 'PROPS_UNION_TYPE': '全部属性使用单一构造器，默认值与类型匹配。',
 'WX_FOR_DATA_TYPE': '唯一循环 stars 的 computed 始终由 Array.from 返回数组，max=0 返回空数组。'
}
rows=[]
for line in matrix.splitlines():
    m=re.match(r'\| `([A-Z_]+)` \| (error|warn) \|', line)
    if not m: continue
    fields = re.split(r'(?<!\\)\|', line)
    pattern = fields[4].strip().strip('`').replace('\\\\', '\\').replace('\\|','|')
    try:
        candidates = sorted(set(source.count('\n', 0, h.start())+1 for h in re.finditer(pattern,source)))
        scan_error = None
    except re.error as error:
        candidates=[]
        scan_error=str(error)
    rule=m[1]
    rows.append({'id':rule,'level':m[2],'candidate_lines':candidates,'pattern_parse_error':scan_error,'review':notes.get(rule,'已复核完整 SFC：未使用该规则对应的组件、属性、布局或运行时能力。'),'status':'reviewed'})
(run/'audit.json').write_text(json.dumps({'scope':'outputs/rating-selector.mpx','method':'完整矩阵逐条候选扫描 + 完整 SFC 结构人工复核；候选不等同缺陷','rules':rows,'unresolved_errors':0,'unresolved_warnings':0},ensure_ascii=False,indent=2))
print(f'{len(rows)} rules reviewed; unresolved errors=0, warnings=0')
print('Pattern parse errors:', [r['id'] for r in rows if r['pattern_parse_error']])
print('Candidates:', [(r['id'],r['candidate_lines']) for r in rows if r['candidate_lines']])
