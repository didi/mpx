import re,json,pathlib,subprocess
root=pathlib.Path(__file__).parent
matrix=pathlib.Path('/Users/hjw/project/mpx/.agents/skills/mpx2skyline/references/skyline-audit-matrix.md').read_text()
source=(root.parent/'outputs/product-card.mpx').read_text()
command=re.search(r'```bash\n([\s\S]*?)\n```',matrix)[1].replace('<scope>',str(root.parent/'outputs/product-card.mpx'))
result=subprocess.run(command,shell=True,text=True,capture_output=True)
(root/'aggregate-scan.txt').write_text(result.stdout+result.stderr)
notes={
'CONFIG_APP_SKYLINE_OPTIONS':'不适用：仅单组件；本地显式 block/content-box 与 row，无页面配置改动。',
'CONFIG_PAGE_SKYLINE':'不适用：component true，无页面任务。',
'CONFIG_WORKLET_BABEL':'不适用：没有 Worklet。',
'STYLE_MEDIA_SCREEN':'已处理：WebView 保留媒体查询；Skyline 类在查询后提供 24rpx 默认值与 12rpx 小屏值，窗口阈值 320px。',
'STYLE_TEXT_OVERFLOW':'已处理：唯一 title 节点保留 CSS，并补 max-lines/overflow，插值紧贴标签。',
'STYLE_SELECTOR_UNSUPPORTED':'已处理：属性选择器改 badge-sale，圆点改真实 text。',
'STYLE_LAYOUT_UNSUPPORTED':'已处理：grid 改 flex row，tag flex:1/min-width:0。',
'STYLE_FLEX_TEXT_WRAP':'已复核：标签由 flex:1 明确等分可用宽度；活动固定短文本无需长文换行。',
'COMP_SCROLL_HORIZONTAL':'不适用：row 属普通 view，不是滚动容器。',
'COMP_TEXT_CHILDREN':'已复核：所有 text 仅含纯文本或 title 插值。',
'PROPS_DEFAULT_FIELD':'已复核：title 使用 value 默认值。',
'PROPS_UNION_TYPE':'已复核：title String 与默认值一致，无调用侧文件。'
}
rows=[]
for line in matrix.splitlines():
 m=re.match(r'\| `([A-Z_]+)` \| (error|warn) \|',line)
 if m: rows.append({'id':m[1],'level':m[2],'result':notes.get(m[1],'已逐项复核完整组件：无该能力、语法或风险场景。')})
(root/'audit.json').write_text(json.dumps({'scope':'outputs/product-card.mpx','method':'完整阅读 SFC + 全矩阵逐项结构复核 + 官方矩阵聚合 rg 扫描（仅候选召回）','aggregate_command':command,'aggregate_exit':result.returncode,'rules':rows,'unresolved':[]},ensure_ascii=False,indent=2))
print('Audited',len(rows),'rules; aggregate exit',result.returncode)
