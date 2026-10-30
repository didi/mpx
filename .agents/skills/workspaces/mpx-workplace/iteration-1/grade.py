#!/usr/bin/env python3
"""Prepare evidence reviews, then emit RN-compatible grading and benchmark files.

No model run or unreviewed assertion is silently scored as zero or as passing.
Semantic checks are reviewed against source, build artifacts and real logs.
"""
import argparse
import importlib.util
import json
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent
AGGREGATOR = WORKSPACE.parents[2] / 'skill-creator/scripts/aggregate_benchmark.py'


def read_json(path):
    return json.loads(path.read_text())


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def load_run(case, group):
    run_dir = WORKSPACE / f"eval-{case['id']}-{case['name']}" / group / 'run-1'
    for name in ('run.json', 'agent.jsonl', 'metrics.json', 'source-snapshot.json'):
        if not (run_dir / name).is_file():
            raise ValueError(f'missing run artifact: {run_dir / name}')
    run = read_json(run_dir / 'run.json')
    if run['returncode'] != 0 or not run['output_exists'] or not run['sources_unchanged']:
        raise ValueError(f'failed or incomplete execution: {run_dir}')
    if (run['eval_id'], run['group']) != (case['id'], group):
        raise ValueError(f'run identity mismatch: {run_dir}')
    for name in case['outputs']:
        path = run_dir.parent / 'outputs' / name
        if not path.is_file() or not path.stat().st_size:
            raise ValueError(f'missing deliverable: {path}')
    metrics = read_json(run_dir / 'metrics.json')
    for key in ('total_tokens', 'duration_ms', 'tool_calls'):
        value = metrics.get(key)
        if type(value) not in (int, float) or value < 0:
            raise ValueError(f'missing or invalid execution metric {key}: {run_dir}')
    return run_dir, run, metrics


def prepare(case, run_dir):
    path = run_dir / 'assessment.json'
    if not path.exists():
        write_json(path, {'eval_id': case['id'], 'expectations': [dict(
            item, status='pending', evidence=[], unverified=[], blocked_by=[]) for item in case['assertions']]})


def grade_run(case, group):
    run_dir, run, metrics = load_run(case, group)
    assessment = read_json(run_dir / 'assessment.json')
    items = assessment['expectations']
    if assessment['eval_id'] != case['id'] or [item['id'] for item in items] != [
            item['id'] for item in case['assertions']]:
        raise ValueError(f'assessment does not match case: {run_dir}')
    for item in items:
        if item['status'] not in ('passed', 'failed', 'pending'):
            raise ValueError(f"invalid status for {item['id']}: {run_dir}")
        if not isinstance(item['evidence'], list) or any(
                not isinstance(value, str) or not value.strip() for value in item['evidence']):
            raise ValueError(f"invalid evidence for {item['id']}: {run_dir}")
        if item['status'] != 'pending' and not item['evidence']:
            raise ValueError(f"missing evidence for {item['id']}: {run_dir}")
    counts = {status: sum(item['status'] == status for item in items)
              for status in ('passed', 'failed', 'pending')}
    write_json(run_dir / 'review-status.json', dict(
        counts, total=len(items), pass_rate=counts['passed'] / len(items),
        coverage=(counts['passed'] + counts['failed']) / len(items),
        expectations=items))
    if counts['pending']:
        return run_dir, run, None
    expectations = [dict(id=definition['id'], assertion_id=definition['id'], text=definition['text'],
                         passed=item['status'] == 'passed', evidence='; '.join(item['evidence']))
                    for definition, item in zip(case['assertions'], items)]
    passed = counts['passed']
    grading = {
        'eval_id': case['id'], 'run_kind': group, 'expectations': expectations,
        'summary': {'passed': passed, 'failed': len(items) - passed,
                    'total': len(items), 'pass_rate': passed / len(items)},
        'timing': {'total_tokens': metrics['total_tokens'],
                   'total_duration_seconds': metrics['duration_ms'] / 1000},
        'execution_metrics': {'total_tool_calls': metrics['tool_calls']},
    }
    return run_dir, run, grading


def aggregate():
    config = read_json(WORKSPACE / 'evals.json')
    # Validate the entire matrix before publishing any grading or benchmark.
    results = [grade_run(case, group['id']) for case in config['evals']
               for group in config['comparison']['groups']]
    if any(grading is None for _, _, grading in results):
        # Do not leave a stale final score when a review becomes pending again.
        for filename in ('benchmark.json', 'benchmark.md', 'grading-summary.json'):
            (WORKSPACE / filename).unlink(missing_ok=True)
        for run_dir, _, grading in results:
            if grading is None:
                (run_dir / 'grading.json').unlink(missing_ok=True)
        raise ValueError('pending reviews: see each run-1/review-status.json; no final benchmark emitted')
    settings = {(run['model'], run['reasoning_effort']) for _, run, _ in results}
    if len(settings) != 1:
        raise ValueError('comparison requires the same model and reasoning effort')
    for run_dir, _, grading in results:
        write_json(run_dir / 'grading.json', grading)
        write_json(run_dir / 'timing.json', grading['timing'])
    spec = importlib.util.spec_from_file_location('skill_benchmark', AGGREGATOR)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    benchmark = module.generate_benchmark(WORKSPACE, config['skill_name'], str(WORKSPACE.parents[2] / 'mpx'))
    # The shared loader conditionally reads timing.json and may miss tokens
    # when duration is nonzero. Use the validated timing for every run.
    timings = {(run['eval_id'], run['group']): grading['timing']
               for _, run, grading in results}
    for row in benchmark['runs']:
        timing = timings[(row['eval_id'], row['configuration'])]
        row['result']['tokens'] = timing['total_tokens']
        row['result']['time_seconds'] = timing['total_duration_seconds']
    benchmark['run_summary'] = module.aggregate_results({
        group['id']: [row['result'] for row in benchmark['runs']
                      if row['configuration'] == group['id']]
        for group in config['comparison']['groups']})
    model, effort = next(iter(settings))
    benchmark['metadata'].update(executor_model=model, reasoning_effort=effort,
                                 analyzer_model='evidence review', runs_per_configuration=1)
    benchmark['weighted_summary'] = {}
    for group in config['comparison']['groups']:
        values = [grading['summary'] for _, run, grading in results if run['group'] == group['id']]
        passed, total = sum(v['passed'] for v in values), sum(v['total'] for v in values)
        benchmark['weighted_summary'][group['id']] = {
            'passed': passed, 'total': total, 'pass_rate': passed / total}
    total = sum(len(case['assertions']) for case in config['evals'])
    benchmark['notes'] = [
        f"每组 {len(config['evals'])} 个 case、{total} 条独立断言；加权通过率为通过断言数 / {total}。每个 case 每组仅运行一次。",
        '各 case 断言数不同；主指标使用加权通过率，Summary 中 Pass Rate 为逐 case 平均值，不混用。',
        '语义断言依据 assessment.json 的显式证据评分；不以关键词匹配代替行为验证。',
        '耗时与 Token 来自真实运行。input_tokens 已包含 cached_input_tokens，缓存不重复相加。',
        '静态与编译验证不代表多端宿主行为通过。差值方向为 mpx - noskill。',
    ]
    write_json(WORKSPACE / 'benchmark.json', benchmark)
    weighted = ['## 按独立断言计分', '', '| 配置 | 通过 / 总数 | 加权通过率 |', '| --- | ---: | ---: |']
    for group, summary in benchmark['weighted_summary'].items():
        weighted.append(f"| {group} | {summary['passed']} / {summary['total']} | {summary['pass_rate']:.2%} |")
    markdown = module.generate_markdown(benchmark).replace(
        '## Summary', '\n'.join(weighted) + '\n\n## Summary')
    (WORKSPACE / 'benchmark.md').write_text(markdown + '\n')
    write_json(WORKSPACE / 'grading-summary.json', benchmark['weighted_summary'])
    return benchmark


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--prepare', action='store_true', help='prepare unscored assessments after runs')
    args = parser.parse_args()
    if args.prepare:
        config = read_json(WORKSPACE / 'evals.json')
        for case in config['evals']:
            for group in config['comparison']['groups']:
                run_dir, _, _ = load_run(case, group['id'])
                prepare(case, run_dir)
    else:
        aggregate()


if __name__ == '__main__':
    main()
