#!/usr/bin/env python3
"""Aggregate deterministic Mpx2Web grades with the shared skill-creator schema."""
import argparse
import json
from pathlib import Path
import run_evals as runner


def aggregate(model, effort, samples=1):
    config, _ = runner.load_configs()
    expected = []
    for item in config['evals']:
        case = runner.WORKSPACE / f"eval-{item['id']}-{item['name']}"
        for group in ('mpx2web', 'no_skill'):
            for number in range(1, samples + 1):
                target = case / group / f'run-{number}' / 'grading.json'
                if not target.is_file():
                    raise ValueError(f'missing grading: {target}')
                grade = json.loads(target.read_text())
                ids = [row['id'] for row in item['assertions']]
                if [row.get('id') for row in grade.get('expectations', [])] != ids:
                    raise ValueError(f'stale grading assertions: {target}')
                expected.append((item['id'], group, number))
    base = runner.load_module('common_aggregate', runner.SKILL_CREATOR / 'scripts/aggregate_benchmark.py')
    payload = base.generate_benchmark(runner.WORKSPACE, 'mpx2web', str(runner.PROJECT_ROOT / '.agents/skills/mpx2web'))
    actual = [(row['eval_id'], row['configuration'], row['run_number']) for row in payload['runs']]
    if set(actual) != set(expected) or len(actual) != len(expected):
        raise ValueError('unexpected or mixed grading runs')
    payload['metadata'].update(
        executor_model=f'{model} ({effort})',
        analyzer_model='deterministic Python checks',
        suite_revision=config['suite_revision'],
        grader_method=config['scoring']['grader_method'],
        score_weighting='case mean, matching Mpx2RN iteration-17',
    )
    payload['notes'] = [
        '评分方式与 Mpx2RN iteration-17 对齐：每条断言由 Python 确定性静态检查返回 PASS/FAIL。',
        '汇总分对各 Case 的通过率取平均；不使用额外评分模型。',
        '本 Benchmark 不执行构建、浏览器、SSR renderer、E2E 或真机验收。',
    ]
    runner.write_json(runner.WORKSPACE / 'benchmark.json', payload)
    markdown = base.generate_markdown(payload) + '\n'
    (runner.WORKSPACE / 'benchmark.md').write_text(markdown)
    (runner.WORKSPACE / 'result.md').write_text(markdown)
    viewer = runner.load_module('common_viewer', runner.SKILL_CREATOR / 'eval-viewer/generate_review.py')
    runs = viewer.find_runs(runner.WORKSPACE)
    (runner.WORKSPACE / 'review.html').write_text(viewer.generate_html(runs, 'Mpx2Web 确定性静态评测', benchmark=payload))
    return payload


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model', required=True)
    parser.add_argument('--reasoning-effort', required=True)
    parser.add_argument('--samples', type=int, default=1)
    args = parser.parse_args()
    payload = aggregate(args.model, args.reasoning_effort, args.samples)
    print(f"[complete] {runner.WORKSPACE / 'benchmark.md'}")
    for group, values in payload['run_summary'].items():
        if group != 'delta':
            print(f"{group}: {values['pass_rate']['mean']:.2%}")


if __name__ == '__main__':
    main()
