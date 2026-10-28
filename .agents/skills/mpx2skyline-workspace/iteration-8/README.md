# Skyline iteration-8：最新 Skill 对比复测

沿用 iteration-7 的4个case和40条断言，仅比较 mpx / mpx2skyline，8次独立 codex exec，gpt-6.1-sol / high，并发3，不继承父会话。本轮8/8已完成，评分mpx 39/40、mpx2skyline 39/40。[对比报告](benchmark.md) · [产物页面](review.html) · [执行审计](execution-protocol-audit.json)。

本轮使用 skill-snapshots 中冻结的最新 Skill；源码、输入与依赖指纹见 environment.json。两组使用相同已安装依赖；隔离复制 core 2.11.1 并仅覆盖已修复的 builtInKeysMap.js，通过 workspace 的 webpack alias 供真实编译使用。旧node_modules不变。该环境修复可能影响首帧初始化结果，历史分差不能全部归因于Skill优化。

执行：`python3 run_evals.py --execute --model gpt-6.1-sol --reasoning-effort high --groups mpx mpx2skyline --max-workers 3`。

评分仍为Agent逐项语义核验，grade.py校验并汇总assessment.json；不是自动静态谓词评分器。不复用旧产物或旧分数。`python3 grade.py` 后运行 `python3 report.py` 生成benchmark与review页面。原始定义及输入与iteration-7相同，真机未运行应单独记录not_run。
