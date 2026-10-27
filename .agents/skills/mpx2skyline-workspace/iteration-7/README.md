# Mpx2Skyline 评测集（iteration-7）

执行流程与 `mpx2rn-workspace/iteration-18` 对齐：仅比较 **mpx / mpx2skyline**，4 个 case、8 次独立 Codex 运行，模型显式传入 `gpt-6.1-sol`、思考强度 `high`。本轮 **8/8 已完成**，Agent 语义评分为 **mpx 37/40、mpx2skyline 38/40**。查看 [对比报告](benchmark.md)、[逐项证据](score-audit.md) 和 [产物页面](review.html)。

保留原有 40 条 Skyline 能力断言（适配 33、创建 7），输入业务需求与断言内容不变。输入中的不兼容写法仍是待修复 fixture，不能提前清理。两组都只考虑微信 wx 平台的 WebView / Skyline。

[定义](evals.json) · [评分标准](grading-standard.md) · [通用契约](common-validation.json) · [创建契约](creation-validation.json) · [断言迁移](assertion-migration.json)

## 用例与交付

| Case | 主要文件 | 其他交付 | 能力分母 |
| --- | --- | --- | ---: |
| 0 style-layout | style-card.mpx | report.md | 14 |
| 1 page-scroll-sticky-layer-config | orders.mpx | app.json、service.js、report.md | 11 |
| 2 template-runtime-inline-animation | user-list.mpx | row.wxml、logo.svg、report.md | 8 |
| 3 new-task-board-page | pages/task-board.mpx | 两个 components、app.json、report.md | 7 |

每个 case 共用只读 `input/`，两组各写 `eval-*/<group>/outputs/` 与 `run-1/`。准备阶段仅复制无需适配的 service.js / logo.svg；需要改造的 app.json、row.wxml 和 SFC 不预填到输出中。执行完成时检查所有交付文件非空，避免仅主文件存在就被算作完成。

## 环境

固定工作目录为 `.agents/skills/mpx2skyline-workspace`，同时设置 `codex exec -C` 与子进程 cwd；不继承父会话历史。`run_evals.py` 直接复用 RN iteration-17 的调度、Codex 命令、日志及 usage 采集实现，与 iteration-18 采用同一底层执行器，因此需要保留该目录。

workspace 根目录的 package.json、Babel 和 ESLint 配置与 RN workspace 保持一致的依赖声明。当前 node_modules 通过相对符号链接复用 RN 已安装依赖，两个环境解析到同一版本；package-lock.json 的依赖锁也从 RN 复制，仅更新根项目名（锁文件与 node_modules 均按仓库规则本地忽略）。不要经此链接单独安装或升级依赖；需要独立依赖时先解除链接，再依据本地锁执行 `npm ci`。

有意保留的目标差异：Mpx 配置仅设 `srcMode: wx`，去掉 RN projectName；`npm run compile-validate` 默认显式使用 `--target=wx`，复用统一 Skill 的基础编译脚本。两组都允许使用该脚本，但不得借此读取另一组 Skill 或 references。Skyline 与 WebView 共用 wx 编译目标，真实双渲染模式行为仍需宿主验证；局部 SFC 编译不等于完整宿主构建。

隔离与 RN 一致，属于提示词约束，不是文件系统读权限隔离。环境只提供工具，是否调用编译校验由本组 Skill 和任务要求决定，runner 不额外注入编译步骤。

## 准备与执行

在本 iteration 目录执行：

```bash
# 生成 8 个调度并复制业务依赖，不启动模型、不填写指标
PYTHONDONTWRITEBYTECODE=1 python3 run_evals.py \
  --model gpt-6.1-sol --reasoning-effort high \
  --groups mpx mpx2skyline > dispatches.json

# 开始模型评测时执行
PYTHONDONTWRITEBYTECODE=1 python3 run_evals.py --execute \
  --model gpt-6.1-sol --reasoning-effort high \
  --groups mpx mpx2skyline --max-workers 3
```

支持 `--evals 0 1`、`--groups mpx` 与 `--codex-bin`。模型参数仍要求显式传入；本轮采用 RN iteration-18 的值，不受旧 runner 帮助中“与父会话一致”的表述限制。禁止旧的 no_skill / merged_skill 分组，统一 Skill 路径已确定为 `../mpx/SKILL.md`。

每次执行生成 `run-1/agent.jsonl`、`stderr.log`、`run.json`、`metrics.json`、`timing.json` 和执行前后输入/Skill 哈希 `source-snapshot.json`，总体状态写 `execution-results.json`。Token 来自 Codex JSONL usage，耗时来自实际进程；执行失败或交付缺失会使入口返回非零。已有 agent.jsonl 的运行拒绝覆盖，重跑前需归档整个对应组目录。

## 评分与报告

RN 的逐条静态检查不能直接用于 Skyline 的布局、交互和多文件语义。这里保留原 `verification` 判定，使用证据审核生成相同的 grading / benchmark / review 产物格式，不用关键词命中代替真实能力判断。

```bash
# 模型实际运行后，创建未评分模板；不会覆盖已有审核
PYTHONDONTWRITEBYTECODE=1 python3 grade.py --prepare

# 审核完成后生成 run-1/grading.json 与 grading-summary.json
PYTHONDONTWRITEBYTECODE=1 python3 grade.py

# 所有 8 组评分齐全后聚合并生成静态查看页面
PYTHONDONTWRITEBYTECODE=1 python3 report.py
```

评分者按 `evals.json` 的 verification 检查本组完整 outputs、report.md 和验证证据，填写 `run-1/assessment.json` 每条断言的 `passed: true/false` 及非空 `evidence`。证据应定位到文件、节点、调用链或真实验证记录；证据不足填 false 并解释。未审核的 null 不能计分。通用契约与创建业务要求另记 `run-1/validation.json`，阻断能力时同步影响对应断言。评分者不得读取另一组结果作相对评分。

`grade.py` 支持 `--evals` / `--groups`；局部评分时 grading-summary.json 仅包含本次选择。`report.py` 要求完整 8 次结果及相同模型/思考强度，复用 skill-creator 聚合器与 `eval-viewer/generate_review.py`，输出 benchmark.json、benchmark.md、review.html。报告分别列出适配 / 创建总分，case 通过率均值与 40 分总分区别呈现；每组每例仅 1 次，不复用历史分数。准备阶段不生成 benchmark 或虚构模型结果。

## 本地验证

从仓库根目录运行：

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover \
  -s .agents/skills/mpx2skyline-workspace/iteration-7 -p 'test_*.py' -v
node_modules/.bin/jest \
  --config .agents/skills/mpx2skyline-workspace/iteration-7/jest.config.json \
  --runInBand --watchman=false
node_modules/.bin/eslint --no-ignore \
  .agents/skills/mpx2skyline-workspace/iteration-7/validate-suite.test.cjs \
  .agents/skills/mpx2skyline-workspace/mpx.config.js
```

Python 测试覆盖调度隔离、依赖预置、多文件完成判定、真实日志协议解析、评分证据门槛和分项聚合；Codex 进程在测试中 mock，不消耗模型评测。Jest 核验 40 条断言、metadata、fixture / 定义哈希与环境对齐。修改定义后同步 source-snapshot.json；不要将定义哈希当作实际运行快照。检查结果见 definition-validation.json。

本次检查：Python 5 项、Jest 7 项和相关 ESLint 全部通过；8 个调度准备完成；workspace 内最小 SFC 的 wx 真实编译通过（0 error / 0 warning）；临时合成数据的 benchmark / review 生成通过。以上为准备阶段检查；本轮正式执行结果另见 execution-results.json。

本轮已确认正式执行命令、上下文隔离、并发及指标采集与 RN 使用同一实现，依赖安装也相同，详见 execution-protocol-audit.json。评分机制有所不同：独立 Agent 完成语义判定，grade.py 仅校验/汇总，并非 RN 的静态脚本评分器。原始业务产物未修改；每组每例仅一次，评分过程和局部编译不等于真机验收。
