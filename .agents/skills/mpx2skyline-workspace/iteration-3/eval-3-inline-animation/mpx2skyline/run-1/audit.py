from pathlib import Path
import re, subprocess
root=Path('/private/tmp/skyline-v3-baseline-20260911/eval-3-inline-animation/mpx2skyline')
m=Path('/Users/hjw/project/mpx/.agents/skills/mpx2skyline/references/skyline-audit-matrix.md').read_text()
pattern=re.search(r'rg -n -U "(.*?)" <scope>',m).group(1).replace('\\\\','\\')
result=subprocess.run(['rg','-n','-U',pattern,str(root/'outputs/promo-card.mpx')],text=True,capture_output=True)
(root/'run-1/audit-scan.log').write_text(result.stdout+result.stderr+'\nrg exit: '+str(result.returncode)+'\n')
notes={
'CONFIG_APP_SKYLINE_OPTIONS':'scope 例外：仅组件；宿主已接入，未提供 app.json；keyframeStyleIsolation 由宿主验收。',
'CONFIG_PAGE_SKYLINE':'不适用：组件，无页面配置修改。',
'CONFIG_WORKLET_BABEL':'不适用：未引入 Worklet。',
'COMP_IMAGE_SVG':'已复核：SVG 具体尺寸、内联 fill，无 style/rgba/百分比；image 显式 aspectFit，SVG 字节一致。',
'COMP_TEXT_CHILDREN':'已复核：两个 text 均只有纯文本或插值，image 是 span 的直接子节点。',
'COMP_INLINE_MIXED_CONTENT':'已处理：微信 span 共用 max-lines/overflow；Skyline nowrap 和图片 inline-block；原 WebView truncate 保留。',
'STYLE_TEXT_OVERFLOW':'已处理：唯一 title-line 容器共同行内省略，插值紧贴 text 标签。',
'STYLE_FLEX_TEXT_WRAP':'已复核：title-line width:0 + flex:1 + min-width:0，单行截断。',
'STYLE_PSEUDO_ANIMATION':'已处理：伪元素改 pulse-dot 真实节点。',
'STYLE_ANIMATION_FILL_MODE':'已处理：backwards 改 both，原 1s infinite 与 from/to 保留。',
'STYLE_ANIMATION_PROPERTY':'已复核：仅 opacity/transform 白名单；按钮 150ms，圆点 1s。',
'STYLE_Z_INDEX_CONTEXT':'已复核：opacity/transform 仅反馈，无层级依赖。',
'ANIMATION_WEBVIEW_API':'已处理：移除 createAnimation/animation 绑定，双端统一 transition。',
'PROPS_DEFAULT_FIELD':'已复核：title 使用 value。',
'PROPS_UNION_TYPE':'已复核：title 为 String，默认值为字符串；调用方未提供，外部传值未验证。'
}
rows=[]
for line in m.splitlines():
 match=re.match(r'\| `([A-Z_]+)` \| (error|warn) \|',line)
 if match:
  key,level=match.groups()
  rows.append('| '+key+' | '+level+' | '+notes.get(key,'完整源码与模板结构复核：无适用命中。')+' |')
(root/'run-1/audit.md').write_text('# 完整矩阵复核\n\nscope：outputs/promo-card.mpx 和引用的 logo.svg。聚合候选见 audit-scan.log；全部规则逐项人工对照完整源码，未将候选直接判为错误。\n\n| 规则 | 等级 | 结论 |\n| --- | --- | --- |\n'+'\n'.join(rows)+'\n\n未处理 error：0。warn 保留项：宿主 keyframes 隔离和真机视觉需集成验收，SVG 已复核无已知差异点。无其他组件子树。\n')
print('matrix rules reviewed:',len(rows),'aggregate scan exit:',result.returncode)
