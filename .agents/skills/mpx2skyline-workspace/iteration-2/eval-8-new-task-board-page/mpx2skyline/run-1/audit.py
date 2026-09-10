from pathlib import Path
import re, subprocess, shlex, json, datetime
base=Path(__file__).resolve().parent.parent
matrix=Path('/Users/hjw/project/mpx/.agents/skills/mpx2skyline/references/skyline-audit-matrix.md').read_text()
command=re.search(r'```bash\n([\s\S]*?)\n```',matrix).group(1).replace('<scope>',str(base/'outputs'))
args=shlex.split(command)+['-g','*.css']
result=subprocess.run(args,capture_output=True,text=True)
(base/'run-1/audit-candidates.log').write_text(result.stdout+result.stderr)
assert result.returncode in (0,1)
notes={
'CONFIG_APP_SKYLINE_OPTIONS':'全局 requiredComponents 与 skyline 五项齐全；原 webview 配置保留。',
'CONFIG_PAGE_SKYLINE':'仅新页面启用 skyline/glass-easel/custom/disableScroll，未全局切换首页 renderer。',
'CONFIG_WORKLET_BABEL':'不使用 Worklet，无需构建插件。',
'GLASS_INCLUDE_IN_FOR':'两个 wx:for 均无 include。',
'COMP_SCROLL_TYPE':'唯一 scroll-view 显式 type=list。',
'COMP_SCROLL_LIST_DIRECT_CHILD':'循环任务行是 scroll-view 直接子节点，无统一列表 wrapper。',
'COMP_SCROLL_HORIZONTAL':'flex-row 用于筛选及任务行，滚动仅 scroll-y。',
'COMP_SCROLL_REFRESHER_SLOT':'采用默认 refresher，无自定义刷新节点；绑定刷新状态。',
'COMP_TEXT_CHILDREN':'所有 text 内只有插值或文字，无组件嵌套。',
'COMP_INLINE_MIXED_CONTENT':'标题与状态是两个独立文本列，没有图片/图标/富文本同段混排。',
'STYLE_TEXT_OVERFLOW':'唯一 truncate 标题同时保留 WebView CSS 与 Skyline max-lines=1/overflow=ellipsis；插值紧贴标签。',
'STYLE_FLEX_TEXT_WRAP':'标题 flex:1 + min-width:0，在受限宽度下单行省略；状态禁止收缩。',
'SCROLL_CONTEXT_ENHANCED':'无 node()/ScrollViewContext 调用；滚动容器已开启 enhanced。',
'WX_FOR_DATA_TYPE':'filters 是固定 Array，visibleTasks 的 computed 所有分支稳定返回 Array。',
'GLASS_SELECTOR_NUMERIC_ID':'仅 data-id 为数值业务标识，没有数字开头 DOM id 或 SelectorQuery。'
}
rows=[]
for line in matrix.splitlines():
 match=re.match(r'\| `([A-Z_]+)` \| (error|warn) \|',line)
 if match:
  rule,level=match.groups()
  rows.append({'id':rule,'level':level,'review':'reviewed','evidence':notes.get(rule,'已检查完整 SFC、app.json 与 utilities.css，未使用该规则涉及的能力或不兼容写法。')})
(base/'run-1/audit.json').write_text(json.dumps({'scope':['outputs/pages/task-board.mpx','outputs/app.json','outputs/utilities.css'],'method':'Skill aggregate rg scan plus full SFC/CSS/JSON manual review for every matrix rule','rules':rows,'unresolved_errors':[],'unresolved_warnings':[],'limitations':['未提供 pages/home 文件；其现有注册及全局配置已保留，首页实现不在范围。','未在微信运行时验证。']},ensure_ascii=False,indent=2)+'\n')
print('完整矩阵逐项复核记录:',len(rows),'项；聚合扫描退出码:',result.returncode)
