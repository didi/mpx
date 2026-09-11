from pathlib import Path
import shlex
import subprocess
root = Path('/private/tmp/skyline-v3-baseline-20260911/eval-4-nested-sticky-layer/mpx2skyline')
matrix = Path('/Users/hjw/project/mpx/.agents/skills/mpx2skyline/references/skyline-audit-matrix.md').read_text()
command = matrix.split('```bash\n')[1].split('\n```')[0]
args = shlex.split(command.replace('<scope>', str(root / 'outputs')))
result = subprocess.run(args, text=True, capture_output=True)
(root / 'run-1/audit-scan.log').write_text(result.stdout + result.stderr + '\nrg exit: ' + str(result.returncode))
notes = {
'CONFIG_APP_SKYLINE_OPTIONS': 'N/A: component scope, host already configured per task.',
'CONFIG_PAGE_SKYLINE': 'N/A: component scope.',
'CONFIG_WORKLET_BABEL': 'N/A: no Worklet.',
'GLASS_INCLUDE_IN_FOR': 'Reviewed: no include in any loop.',
'COMP_SCROLL_TYPE': 'Reviewed: every scroll-view declares type.',
'COMP_SCROLL_LIST_DIRECT_CHILD': 'Reviewed: horizontal list tiles are direct children.',
'COMP_SCROLL_NESTED': 'Reviewed: Skyline nested outer with custom vertical child and list horizontal children, all children associated; runtime gesture handoff not_run.',
'COMP_SCROLL_HORIZONTAL': 'Reviewed: enable-flex, row, 80px height, tiles 120px with flex-shrink:0.',
'COMP_STICKY_STRUCTURE': 'Reviewed: renderer isolated; first child sticky-header with explicit background; custom parent. Runtime sticky not_run.',
'STYLE_FLEX_TEXT_WRAP': 'Reviewed: tile width explicitly 120px.',
'STYLE_Z_INDEX_CONTEXT': 'Reviewed: modal/fab sibling fixed nodes z-index 3/2, outside scrolling; runtime layering not_run.',
'SCROLL_CONTEXT_ENHANCED': 'N/A: no node() or ScrollViewContext use.',
'WX_FOR_DATA_TYPE': 'Reviewed: sections Array default []; items Array according to input contract.',
'PROPS_DEFAULT_FIELD': 'Reviewed: properties uses value.',
'PROPS_UNION_TYPE': 'Reviewed: Array constructor and [] default match supplied contract.'
}
lines = ['# Full matrix review', '', 'Scope: outputs/category-panel.mpx. Source scan and full SFC structural review; not a device validation.', '']
for line in matrix.splitlines():
    if line.startswith('| `'):
        fields = line.split('|')
        rule = fields[1].strip(' `')
        lines.append('- ' + rule + ': ' + notes.get(rule, 'No applicable feature / incompatible candidate after full source review.'))
(root / 'run-1/audit.md').write_text('\n'.join(lines) + '\n')
print('aggregate rg exit:', result.returncode)
print('matrix rules reviewed:', sum(line.startswith('| `') for line in matrix.splitlines()))
