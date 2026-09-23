"""Per-run Codex isolation; shared RN metrics, no mutation of user config."""
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import time

DISABLED_FEATURES = ('plugins', 'remote_plugin', 'hooks', 'apps', 'skill_search',
                     'memories', 'external_agent_memory_import', 'shell_snapshot',
                     'browser_use', 'computer_use', 'tool_suggest')
TRANSIENT_OUTPUT_PARTS = {'.cache', '.verify-dist', 'dist', 'node_modules', 'tmp'}


def skill_files(root):
    """Find Skill manifests and follow directory symlinks on every supported Python."""
    seen = set()
    for directory, children, files in os.walk(root, followlinks=True):
        resolved = Path(directory).resolve()
        if resolved in seen:
            children[:] = []
            continue
        seen.add(resolved)
        if 'SKILL.md' in files:
            yield Path(directory) / 'SKILL.md'


def overrides(neutral, base, project, readonly=False):
    home = Path.home().resolve()
    # Disable discovery, not merely access after a Skill was already injected.
    skills = []
    for root in (home / '.agents/skills', home / '.codex/skills'):
        if root.exists():
            for path in skill_files(root):
                skills.append('{path=' + json.dumps(str(path.resolve())) + ',enabled=false}')
                skills.append('{path=' + json.dumps(str(path.parent.resolve())) + ',enabled=false}')
    # Do not deny dependency ancestors: Node realpath must lstat those paths.
    # This is a known-path deny policy, not an all-machine allowlist.
    filesystem = {':root': 'read', str(home / '.agents'): 'deny', str(home / '.codex'): 'deny',
                  str(neutral): 'read' if readonly else 'write'}
    for name in ('.git', '.codex', '.claude', 'AGENTS.md', 'CLAUDE.md', 'skills-lock.json'):
        filesystem[str(project / name)] = 'deny'
    for child in (project / '.agents/skills').iterdir():
        if child != base:
            filesystem[str(child)] = 'deny'
    for child in base.iterdir():
        if child.name not in ('node_modules', 'package.json', 'package-lock.json', 'babel.config.json'):
            filesystem[str(child)] = 'deny'
    for parent in (Path('/private/tmp'), Path('/private/var/folders')):
        for child in parent.iterdir():
            if child != neutral:
                filesystem[str(child)] = 'deny'
    # More specific read grants protect inputs/fixtures and the Has-only copy.
    for name in ('input', 'fixtures', 'skill', 'package.json', 'package-lock.json'):
        filesystem[str(neutral / name)] = 'read'
    permissions = '{' + ','.join(json.dumps(path) + '=' + json.dumps(access)
                                for path, access in filesystem.items()) + '}'
    return [
        'project_doc_max_bytes=0', 'skills.config=[' + ','.join(skills) + ']',
        'approval_policy="never"', 'web_search="disabled"',
        'default_permissions="benchmark"',
        'permissions.benchmark.filesystem=' + permissions,
        'permissions.benchmark.network.enabled=false',
    ]


def command(neutral, model, effort, base, project, codex_bin='codex', readonly=False):
    args = [codex_bin, 'exec', '--ignore-user-config', '--ignore-rules', '--ephemeral',
            '--skip-git-repo-check', '--strict-config', '-C', str(neutral), '-m', model,
            '-c', 'model_reasoning_effort=' + json.dumps(effort)]
    for feature in DISABLED_FEATURES:
        args.extend(['--disable', feature])
    for override in overrides(neutral, base, project, readonly):
        args.extend(['-c', override])
    return args + ['--color', 'never', '--json', '-']


def mapped_prompt(dispatch, neutral, base, project):
    """Replace directory tokens once; a Skill name is not a workspace prefix."""
    mappings = {
        str(Path(dispatch['output_root'])): str(neutral / 'outputs'),
        str(Path(dispatch['case_root'])): str(neutral),
        str(base): str(neutral),
    }
    if dispatch['group'] == 'mpx2web':
        mappings[str(project / '.agents/skills/mpx2web')] = str(neutral / 'skill')
    pattern = '|'.join(re.escape(path) + r'(?![\w.-])'
                       for path in sorted(mappings, key=len, reverse=True))
    prompt = re.sub(pattern, lambda match: mappings[match.group()], dispatch['prompt'])
    for expected in (str(neutral / 'input'), str(neutral / 'outputs')):
        if expected not in prompt:
            raise ValueError(f'isolated prompt is missing {expected}')
    if str(base) in prompt:
        raise ValueError('isolated prompt still contains a source workspace path')
    return prompt


def run(dispatch, base_runner, base, project, codex_bin='codex'):
    run_dir = Path(dispatch['metrics_path']).parent
    output = Path(dispatch['output_root'])
    neutral = Path(tempfile.mkdtemp(prefix='mpx-eval-isolated-', dir='/private/tmp')).resolve()
    recovery = run_dir / 'workspace-recovery.json'
    published = False
    recovery.write_text(json.dumps({'workspace': str(neutral), 'status': 'running'}) + '\n')
    try:
        case = Path(dispatch['case_root'])
        for name in ('input', 'fixtures'):
            if (case / name).exists():
                shutil.copytree(case / name, neutral / name)
        shutil.copytree(output, neutral / 'outputs')
        package = json.loads((base / 'package.json').read_text())
        # Do not expose the old npm alias that calls Skill-specific validators.
        package['scripts'] = {}
        (neutral / 'package.json').write_text(json.dumps(package, indent=2) + '\n')
        if (base / 'package-lock.json').exists():
            shutil.copyfile(base / 'package-lock.json', neutral / 'package-lock.json')
        (neutral / 'node_modules').symlink_to(base / 'node_modules', target_is_directory=True)
        skill = project / '.agents/skills/mpx2web'
        if dispatch['group'] == 'mpx2web':
            shutil.copytree(skill, neutral / 'skill', ignore=shutil.ignore_patterns('__pycache__'))
        prompt = mapped_prompt(dispatch, neutral, base, project)
        if not (neutral / 'input').is_dir():
            raise ValueError('isolated input directory is missing')
        if dispatch['group'] == 'mpx2web' and not (neutral / 'skill/SKILL.md').is_file():
            raise ValueError('isolated Skill is missing')
        args = command(neutral, dispatch['model'], dispatch['reasoning_effort'], base, project, codex_bin)
        started = time.monotonic()
        (neutral / 'tmp').mkdir()
        environment = dict(os.environ, TMPDIR=str(neutral / 'tmp'))
        result = subprocess.run(args, cwd=neutral, input=prompt, capture_output=True,
                                text=True, check=False, env=environment)
        duration = round((time.monotonic() - started) * 1000)
        (run_dir / 'agent.jsonl').write_text(result.stdout)
        base_runner.write_metrics(Path(dispatch['metrics_path']), base_runner.extract_metrics(result.stdout, duration))
        # Only the submitted output tree is published. Symlinks cannot smuggle
        # references to a Skill, another candidate or mutable source directory.
        submitted = neutral / 'outputs'
        if submitted.is_symlink() or any(p.is_symlink() for p in submitted.rglob('*')):
            raise ValueError('candidate outputs contain symlinks')
        missing = [name for name in dispatch['required_outputs']
                   if not (submitted / name).is_file() or not (submitted / name).stat().st_size]
        if result.returncode == 0 and not missing:
            for source in submitted.rglob('*'):
                relative = source.relative_to(submitted)
                if source.is_file() and not TRANSIENT_OUTPUT_PARTS.intersection(relative.parts):
                    target = output / relative
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copyfile(source, target)
                    if target.read_bytes() != source.read_bytes():
                        raise OSError(f'output publication failed: {target}')
            published = True
        else:
            recovery.write_text(json.dumps({'workspace': str(neutral), 'status': 'retained',
                                            'returncode': result.returncode, 'missing_outputs': missing}) + '\n')
        return {
            'description': dispatch['description'], 'cwd': str(neutral),
            'command': args[:-1] + ['<prompt-via-stdin>'],
            'returncode': result.returncode, 'duration_ms': duration,
            'stderr': result.stderr[-4000:] if result.stderr else '',
            'recovery_workspace': None if published else str(neutral),
            'isolation': {'policy': 'codex-filesystem-deny-v1',
                          'skill_access': 'explicit-copy-only' if dispatch['group'] == 'mpx2web' else 'denied',
                          'historical_results': 'known_paths_denied', 'automatic_skills': 'disabled',
                          'scope': 'Known Skill/history paths and existing temporary-directory snapshot; not an all-machine allowlist.',
                          'shared_validator': 'installed-framework-only'},
        }
    finally:
        # Never discard a candidate after a failed/misdirected write or exception.
        # The workspace receipt is written before invoking the model, so even an
        # interrupted parent leaves an exact recovery location.
        if published:
            shutil.rmtree(neutral)
            recovery.unlink()
