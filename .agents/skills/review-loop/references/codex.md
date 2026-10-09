# Codex 集成

Codex 使用真实的原生子 Agent 承担 `planner`、`plan-reviewer`、`coder` 和 `code-reviewer`。不得把任何角色作为单 Agent 角色扮演运行，也不得启动嵌套的 `codex exec` 进程。

## 角色发现

使用 `scripts/prepare-agent-roles.js --mode project` 准备以下项目 Agent：

```text
.codex/agents/planner.toml
.codex/agents/plan-reviewer.toml
.codex/agents/coder.toml
.codex/agents/code-reviewer.toml
```

在 `auto` 模式下，准备脚本会校验全部四个定义。创建或刷新项目 Agent 文件前必须询问用户。

## 启动角色

首次需要时，以具名原生子 Agent 启动 planner 和 coder；后续方案轮次可以通过 `followup_task` 复用原 planner，后续代码轮次也可以复用原 coder。不得在 planner 与 coder 之间复用同一个实例。

`plan-reviewer` 和 `code-reviewer` 的每一轮评审都必须使用新的 `spawn_agent` 调用并设置 `fork_turns: "none"`；不得对之前创建的 reviewer 使用 `followup_task`，也不得恢复或复用任何历史 reviewer 实例。任务消息必须再次强调这是当前轮次新建的独立实例，不继承父级会话、planner 或 coder 的任何上下文。Finalize 会校验 `--agent-id` 未在历史 reviewer-run 中出现。

每轮 reviewer 执行以下步骤：

1. 运行 `review-manager.js --task-id <id> --kind plan|code --round N --prepare`。
2. 将返回的提示词原样传给对应 reviewer 角色。
3. 确认 reviewer 由本轮新的 `spawn_agent` 调用以 `fork_turns: "none"` 拉起，Agent ID 未用于任何之前轮次，只返回一份符合固定格式的 Markdown 文档，且不得写入仓库。
4. 将响应保存到仓库外的临时文件。
5. 运行 `review-manager.js ... --finalize --input <file> --agent-id <id>`。

Prepare 会绑定输入摘要和当前 Git 树，并把 `diffs/code-diff-N.patch` 作为代码 reviewer 与人工共同使用的评审交接产物。Finalize 会重建请求，并在写入不可变 reviewer-run 和规范评审前拒绝任何输入、工作树或评审 patch 漂移。
上下文隔离由上述启动方式保证。

Codex 原生子 Agent 当前不支持按 Agent 覆盖沙箱配置。因此 reviewer 采用由 Git 树漂移校验保障的禁止写入契约，而不是单独强制执行的操作系统沙箱。宿主选择的模型、推理强度、只读契约和来源只记录在内部 reviewer-run 执行证据中，不写入评审 Markdown，也不表示固定了 CLI 模型。

所有需展示给用户或等待用户确认的自然语言产物必须使用中文；平台命令、路径、协议字段和枚举值可保留原文。

## 失败处理

如果 Codex 无法创建新的原生子 Agent，停止工作流，并用中文说明 review-loop 需要原生 planner、reviewer 和 coder 子 Agent 支持。
