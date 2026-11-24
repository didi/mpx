# Mpx2Ali 发布包评测

本轮已于 2026-10-29 完成：3 个用例 × 2 组，模型 `gpt-6.1-sol`、思考强度 `high`。统一 mpx Skill 与 mpx2ali 专项 Skill 均通过 15/15 条独立断言。

查看 [评测报告](benchmark.md)、[HTML 查看页](review.html) 和 [审计检查记录](audit/verification.json)。原始运行日志、Token、耗时与逐项评分保存在各组 `run-1/`；精简编译/探针证据保存在 `audit/`。仅验证静态、编译和状态行为，未做真机验证。

## 与历史轮次的差异

- 编译器、core、api-proxy 使用当前仓库源码，Webpack 与仓库共享同一实例。`npm run check-env` 检查真实解析路径，不能仅凭同为 2.11.1 的版本号判断。
- 导航任务统一使用 `navigationStyle`，不要求旧版替代配置。a50 检查框架自动生成 wx custom 与 ali 空标题、透明、穿透字段及组件保留；业务不重复维护等价导航分支。
- 文本与滚动条用例也使用相同发布包编译基准，核对框架已有转换和完整 App 样式入口，不添加旧包补丁。
- `skill-snapshots/.agents/skills/` 冻结本次更新后的两组 Skill。运行器对输入、本组 Skill 及发布包编译器 lib 分别记录前后哈希。
- iteration-2 的输出、评分、运行指标与审计保持历史口径；本轮没有复制任何旧答案或分数。

## 执行

先在仓库根目录安装依赖，再在评测工作区根目录执行：

```sh
npm install --ignore-scripts
npm run check-env
npm test
cd iteration-3
python3 run_evals.py --model gpt-6.1-sol --reasoning-effort high
python3 run_evals.py --execute --model gpt-6.1-sol --reasoning-effort high --max-workers 3
python3 grade.py --prepare
# 基于本轮实际输出及产物填写各组 run-1/assessment.json。
python3 grade.py
python3 ../../../skill-creator/eval-viewer/generate_review.py . --skill-name 'mpx vs mpx2ali' --benchmark benchmark.json --static review.html
```

默认只准备调度，不执行模型。`--execute` 会先运行已安装发布包检查，并将路径写入 environment.json。已有结果不能覆盖，再次运行需新建轮次。

主指标为通过断言数 / 15；编译与状态测试不等价于真机交互。新环境准备和导航探针检查见 validation.json，不能将这些检查当作模型评测结果。

## 共享发布包测试环境

五个测试集共用 `workspaces/package.json`、本地生成的 `package-lock.json` 和唯一的 `node_modules/`。框架统一使用 npm 官方源 `@mpxjs/*@latest`，不引用仓库 `packages/` 或复制/修改框架源码。

在 `workspaces/` 顶层准备一轮评测环境：

```bash
npm install
npm run update-framework
npm run check-env
npm test
```

子测试集仅保留自己的 `mpx.config.js`、Babel/ESLint 配置和执行脚本，Vue CLI 通过 `vuePlugins.resolveFrom` 从顶层发现插件；编译命令显式传入当前测试集 `--project-root=.`。各组共用本轮锁定版本，运行期间不更新。`npm ci` 仅复现锁文件，不保证最新版本。Webpack 使用与当前 Mpx 发布编译器兼容的 5.104.1，避免旧模块路径回退到仓库 Webpack 导致混用。

Skill 快照仅用于两组隔离。已有最终汇总来自历史环境，不代表当前发布包已完成模型评测；产物回归检查需要重新生成已清理的模型产物。重新评测应新建轮次，保留历史汇总。
