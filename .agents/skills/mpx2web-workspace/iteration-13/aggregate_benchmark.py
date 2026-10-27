#!/usr/bin/env python3
"""Aggregate completed runs with skill-creator's RN-compatible report schema."""
import argparse
import importlib.util
import json
import run_evals as runner


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def aggregate(model, effort):
    config, _ = runner.load_configs()
    groups = [group['id'] for group in config['comparison']['groups']]
    expected = []
    for item in config['evals']:
        for group in groups:
            run = runner.WORKSPACE / f"eval-{item['id']}-{item['name']}" / group / 'run-1'
            for name in ('run.json', 'metrics.json', 'grading.json'):
                if not (run / name).is_file():
                    raise ValueError(f'missing run artifact: {run / name}')
            result = json.loads((run / 'run.json').read_text())
            if result['returncode'] != 0 or not result['output_exists']:
                raise ValueError(f'incomplete run: {run}')
            command = result['command']
            if command[command.index('-m') + 1] != model or f'model_reasoning_effort="{effort}"' not in command:
                raise ValueError(f'model or reasoning effort mismatch: {run}')
            grading = json.loads((run / 'grading.json').read_text())
            if [row['id'] for row in grading['expectations']] != [row['id'] for row in item['assertions']]:
                raise ValueError(f'stale grading assertions: {run}')
            expected.append((item['id'], group, 1))

    skill_creator = runner.PROJECT_ROOT / '.agents/skills/skill-creator'
    base = load_module('common_aggregate', skill_creator / 'scripts/aggregate_benchmark.py')
    payload = base.generate_benchmark(runner.WORKSPACE, config['skill_name'], str(runner.PROJECT_ROOT / '.agents/skills/mpx2web'))
    actual = [(row['eval_id'], row['configuration'], row['run_number']) for row in payload['runs']]
    if set(actual) != set(expected) or len(actual) != len(expected):
        raise ValueError('unexpected or mixed grading runs')
    payload['metadata'].update(
        executor_model=f'{model} ({effort})',
        analyzer_model='deterministic Python checks',
        score_weighting='case mean, matching Mpx2RN iteration-17',
    )
    payload['notes'] = [
        '4 个 eval，每组各运行 1 次，共 8 次运行；每组 26 条确定性二元断言。',
        '通过率为逐 eval 通过率的平均值，与 RN iteration-17 轮次报告一致。',
        '编译验证由各组 prompt 与 Skill 决定；静态断言分数不代表编译、浏览器或 SSR 运行通过。',
        'Token 和耗时来自本轮真实 agent JSONL usage 与执行时间，未复用历史测量。',
    ]
    (runner.WORKSPACE / 'benchmark.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n')
    (runner.WORKSPACE / 'benchmark.md').write_text(base.generate_markdown(payload) + '\n')
    viewer = load_module('common_viewer', skill_creator / 'eval-viewer/generate_review.py')
    (runner.WORKSPACE / 'review.html').write_text(viewer.generate_html(
        viewer.find_runs(runner.WORKSPACE), config['skill_name'], benchmark=payload))
    return payload


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model', required=True)
    parser.add_argument('--reasoning-effort', required=True)
    args = parser.parse_args()
    aggregate(args.model, args.reasoning_effort)
    print(runner.WORKSPACE / 'benchmark.md')


if __name__ == '__main__':
    main()
