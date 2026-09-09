# Claude Code 集成

Claude Code 使用真实的原生子 Agent 承担 `planner`、`plan-reviewer`、`coder` 和 `code-reviewer`。不得把任何角色作为单 Agent 角色扮演运行，也不得启动独立的 `claude -p` reviewer 进程。

## 角色发现

使用 `scripts/prepare-agent-roles.js` 把全部四个角色准备为临时任务角色或项目 Agent：

```text
.claude/agents/planner.md
.claude/agents/plan-reviewer.md
.claude/agents/coder.md
.claude/agents/code-reviewer.md
```

只有宿主能为当前会话注册临时角色时，临时角色才有效。项目角色需要用户明确确认，并执行 `/agents` 重新加载或重启会话。

## 启动角色

首次需要时，以具名原生子 Agent 启动 planner 和 coder；后续方案轮次可以复用原 planner，后续代码轮次也可以复用原 coder。不得在 planner 与 coder 之间复用同一个实例。

`plan-reviewer` 和 `code-reviewer` 的每一轮评审都必须通过 Claude Code 原生 Agent/Task 工具创建全新独立任务；不得恢复或复用任何历史 reviewer 任务，也不得继承父级会话、planner 或 coder 的任何上下文。任务消息必须再次明确这是当前轮次新建的独立实例。Finalize 会校验 `--agent-id` 未在历史 reviewer-run 中出现。如果宿主支持工具允许/拒绝配置，将 reviewer 的工具限制为只读检查。

每轮 reviewer 执行以下步骤：

1. 运行 `review-manager.js --task-id <id> --kind plan|code --round N --prepare`。
2. 将返回的提示词原样传给对应 reviewer 角色。
3. 确认 reviewer 以本轮全新且不继承上下文的原生任务拉起，Agent ID 未用于任何之前轮次，只返回一份符合固定格式的 Markdown 文档，且不得写入仓库。
4. 将响应保存到仓库外的临时文件。
5. 运行 `review-manager.js ... --finalize --input <file> --agent-id <id>`。

Prepare 会绑定输入摘要和当前 Git 树，并把 `diffs/code-diff-N.patch` 作为代码 reviewer 与人工共同使用的评审交接产物。Finalize 会重建请求，并在写入不可变 reviewer-run 和规范评审前拒绝输入、工作树或评审 patch 漂移。宿主原生 reviewer 配置只记录在 reviewer-run 的执行证据中，不信任 reviewer 自报配置，也不写入评审 Markdown。
上下文隔离由上述启动方式保证。

所有需展示给用户或等待用户确认的自然语言产物必须使用中文；平台命令、路径、协议字段和枚举值可保留原文。

## 失败处理

如果 Claude Code 无法创建新的原生子 Agent，停止工作流，并用中文说明 review-loop 需要原生 planner、reviewer 和 coder 子 Agent 支持。
