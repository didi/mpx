# iteration-4 · DSH 复测报告

在 DeepSeek Harness 0.2.1-rc.5 中用 `DeepSeek-V4.1-Flash`（构建 1017，别名 `deepseek-flash`，推理等级 High）复刻 [iteration-2](../iteration-2/README.md) 的 mpx Skill 对照评测：8 个场景、mpx / noskill 两组、48 条断言，交付后独立 ESLint 与六目标单文件编译。

执行日期 2026-11-03；模型构建号 1017，接口只返回别名，无更细的权重版本串。

题目与断言从 git `0508ba54c`（iteration-1）恢复 —— iteration-2 的原始输入已按规范删除，因此**同源但非逐字复现**。

## 结果

| 场景 | mpx | noskill |
| --- | --- | --- |
| 构建目标、条件文件与配置归属 | 6/6 | 4/6 |
| 图文布局、间距与样式作用范围 | 7/7 | 6/7 |
| 刷新、吸顶与节点定位 | 7/7 | 5/7 |
| 弹层、键盘与窗口尺寸 | 5/5 | 4/5 |
| 登录适配、任务句柄与请求取消 | 6/6 | 3/6 |
| 响应式动态组件与首次渲染能力 | 7/7 | 3/7 |
| 路由参数、部署与异步分包 | 5/5 | 1/5 |
| 共享业务的 Web SSR 请求隔离 | 5/5 | 3/5 |
| **合计** | **48/48** | **29/48（60.4%）** |

单任务平均用量：mpx 563.0 万 token / 497.7 秒，noskill 260.3 万 token / 516.6 秒。

token 为会话日志中逐步 `input + output + cacheRead` 的累加，口径高于 CLI 的 `input + output`，跨轮不可并列。

## 文档

- [分数与用量](benchmark.md) / [JSON](benchmark.json)
- [逐条评分与证据](assessment-report.md) / [JSON](assessment-report.json)
- [信息源审计](source-audit.json)：16/16 通过
- [独立验证汇总](validation/checks-summary.md) / [JSON](validation/checks-summary.json)
- [分析备注](analysis-notes.json)

执行时 mpx 组只能读取本运行目录（`TASK.md`、`input/`、`skill/`、`outputs/`），noskill 组只能读取 `TASK.md`、`input/`、`outputs/`；工具侧不做文件系统隔离，靠独立目录 + 提示词白名单 + 会话日志事后审计。首轮 8 次因评分提示词误置于运行目录被读取，已整体作废并在移动评分资料后重跑，成绩只取重跑结果。

## 与 iteration-2 的执行差异

| 维度 | iteration-2 | iteration-4 |
| --- | --- | --- |
| 执行载体 | `codex exec` | DSH subagent |
| 模型 / 强度 | `gpt-6.1-sol` / high / priority | `DeepSeek-V4.1-Flash`（1017）/ High |
| 隔离 | 文件工具白名单 + CLI 配置 | 自包含目录 + 提示词白名单 + 事后审计 |
| 评分 | 独立 grader Agent 逐条语义核验 | 同，口径对齐 iteration-2 |

两轮模型不同，绝对分不可直接比较，同轮 mpx 与 noskill 的差值才可解释为 Skill 增益。iteration-2 的分数与原始对比见其归档，本目录不重复记录。

## 边界

- 静态设计符合率，不是构建或真机通过率。mpx 组仍有 2 个场景存在编译错误，noskill 组有 5 个。
- 真机、浏览器、SSR hydration、完整 App 构建均未验证，各条 unverified 已逐项记录。
- 原始输入、交付物、Skill 快照、评分提示词与执行日志已清理，不能从本归档重新执行或重新评分。
