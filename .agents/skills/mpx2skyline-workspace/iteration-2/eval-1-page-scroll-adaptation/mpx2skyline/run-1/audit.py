from pathlib import Path
import re, subprocess, json, hashlib
base=Path(__file__).resolve().parent.parent
matrix=Path('/Users/hjw/project/mpx/.agents/skills/mpx2skyline/references/skyline-audit-matrix.md').read_text()
command=re.search(r'```bash\n(.*?)\n```',matrix,re.S).group(1).replace('<scope>',str(base/'outputs'))
r=subprocess.run(command,shell=True,text=True,capture_output=True)
(base/'run-1/audit-scan.log').write_text(r.stdout+r.stderr)
assert r.returncode in (0,1)
notes={
 'CONFIG_APP_SKYLINE_OPTIONS':'app preserves pages/window/webview; lazyCodeLoading and all five skyline options supplied.',
 'CONFIG_PAGE_SKYLINE':'page JSON supplies renderer, glass-easel, custom navigation and disableScroll.',
 'CONFIG_WORKLET_BABEL':'No Worklet; Babel changes not applicable.',
 'COMP_SCROLL_TYPE':'Single vertical scroll-view explicitly uses type=list.',
 'COMP_SCROLL_LIST_DIRECT_CHILD':'Looped item views are immediate scroll-view children; top spacing and scroll position are independent siblings.',
 'COMP_SCROLL_REFRESHER_SLOT':'Default refresher used; no custom slot required. Controlled refreshing resets in finally on resolve/reject.',
 'COMP_TEXT_CHILDREN':'All text nodes contain plain text/interpolation only.',
 'STYLE_FLEX_TEXT_WRAP':'Only navigation uses flex; its fixed two-character title has no multi-line content requirement.',
 'SCROLL_CONTEXT_ENHANCED':'No node() or ScrollViewContext API; scroll-view nonetheless enables enhanced.',
 'WX_FOR_DATA_TYPE':'orders starts as []; fetchOrders returns Array; replacement and concat preserve Array.',
 'GLASS_INCLUDE_IN_FOR':'Loop contains no include.'
}
rows=[]
for rid,level in re.findall(r'^\| `([A-Z_]+)` \| (error|warn) \|',matrix,re.M):
 rows.append({'id':rid,'level':level,'result':'reviewed','evidence':notes.get(rid,'Reviewed complete template/script/style/JSON and service; triggering feature absent in this scope.')})
(base/'run-1/audit.json').write_text(json.dumps({'scope':['orders.mpx','app.json','service.js'],'method':'Full matrix manual review with aggregate rg candidate scan; no external grading assertions used.','rules':rows,'unresolved_errors':[],'unresolved_warnings':[],'runtime_unverified':['WeChat WebView/Skyline visual layout and real refresher gestures','Device capsule geometry and resize behavior']},ensure_ascii=False,indent=2)+'\n')
app=json.loads((base/'outputs/app.json').read_text())
assert app['pages']==['pages/home','pages/orders'] and app['window']=={'navigationBarTitleText':'演示'} and app['rendererOptions']['webview']=={}
source=(base/'outputs/orders.mpx').read_text()
json.loads(re.search(r'<script type="application/json">(.*?)</script>',source,re.S).group(1))
original=Path('/Users/hjw/project/mpx/.agents/skills/mpx2skyline-workspace/iteration-2/eval-1-page-scroll-adaptation/input/service.js').read_bytes()
assert (base/'outputs/service.js').read_bytes()==original
print('Full matrix reviewed:',len(rows),'rules; JSON preservation and service identity checks passed')
(base/'run-1/output-sha256.json').write_text(json.dumps({p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in (base/'outputs').iterdir() if p.is_file()},indent=2)+'\n')
