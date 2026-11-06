# Skyline iteration-8：最新 Skill 对比复测

**执行后输入澄清（2026-10-29）**：case2现已明确宿主 `app.json` 启用 `rendererOptions.skyline.defaultDisplayBlock: true`。该前提未出现在本轮原执行输入中；下述39/40及既有产物/审计仍对应修改前的输入，不能作为修订输入的评分。修改前输入与元数据保存在 [输入修订归档](input-revisions/2026-10-29-host-config/revision.json)，此次未重跑模型。

沿用 iteration-7 的4个case和40条断言，仅比较 mpx / mpx2skyline，8次独立 codex exec，gpt-6.1-sol / high，并发3，不继承父会话。本轮8/8已完成，评分mpx 39/40、mpx2skyline 39/40。[对比报告](benchmark.md) · [产物页面](review.html) · [执行审计](execution-protocol-audit.json)。

本轮使用 skill-snapshots 中冻结的 Skill；后续执行的框架环境使用 npm latest 发布包。已移除两份 runtime-core 副本及 webpack alias，不再覆盖发布包的 builtInKeysMap.js。历史汇总保留原分数，不视为发布包重测结果。

执行：`python3 run_evals.py --execute --model gpt-6.1-sol --reasoning-effort high --groups mpx mpx2skyline --max-workers 3`。

评分仍为Agent逐项语义核验，grade.py校验并汇总assessment.json；不是自动静态谓词评分器。不复用旧产物或旧分数。`python3 grade.py` 后运行 `python3 report.py` 生成benchmark与review页面。本轮执行时的定义及输入与iteration-7相同；case2输入此后补明了宿主配置，修订输入尚未重跑。真机未运行应单独记录not_run。

独立性维护：运行协议已复制到本轮 execution.py，指标读取已内置到 grade.py，不再读取 RN 工作区。公共编译工具和修复版运行时已复制到 workspace/tools，解除固定 iteration 路径；本轮原快照保留。执行提示词通过本轮实际路径定位 Skill 快照，复制为新轮次后不会读取旧轮次快照。维护前指纹见 pre-independence-source-snapshot.json，历史执行证据与评分未重写。

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
