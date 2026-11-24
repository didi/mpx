---
name: review-loop
description: 当用户要求评审循环、自评审工作流、planner/reviewer/coder/code-reviewer 协作、先方案后编码、多轮 Agent 评审，或要求稳定的子 Agent 工作流依次产出方案、等待用户确认、实现代码、评审差异并保留修订记录时，使用此 Skill。此 Skill 必须使用真实子 Agent，不得退化为单 Agent 角色扮演。
---

# 评审循环

使用此 Skill 执行两个阶段的工作流：

1. 方案循环：`planner` 编写或修订 `plan.md`，`plan-reviewer` 对其进行评审。
2. 代码循环：用户确认方案后，`coder` 实施已确认方案，`code-reviewer` 评审产生的差异。

该工作流必须使用真实的 planner、reviewer 和 coder 子 Agent。如果当前环境无法创建新的原生子 Agent，停止并告知用户本次会话无法运行 `review-loop`。Codex 和 Claude Code 的四个角色都使用宿主原生子 Agent。

## 必需准备

开始任务前：

1. 读取 `references/protocol.md`、`references/state-machine.md` 和 `references/role-contracts.md`。
2. 根据当前平台读取 `references/codex.md` 或 `references/claude-code.md`。
3. 创建任务 ID。
4. 运行 `scripts/init-workspace.js`，创建 `.agent-workflows/review-loop/<task-id>/`。
5. 运行 `scripts/prepare-agent-roles.js`，准备当前平台的真实子 Agent 角色。
6. 在推进流程前运行 `scripts/validate-state.js`。

`maxRounds` 默认为 `3`。如果用户指定最大循环轮数，将其传给 `init-workspace.js`。

## 强制规则

- 在方案循环结束且用户明确确认方案前，不得实现代码。
- 所有面向用户或需要用户确认的自然语言中间产物必须使用中文，包括技术方案、评审摘要与结论、问题说明与修改建议、方案修订记录、代码执行记录、角色日志、验证结果说明、剩余风险，以及确认节点的汇总和提问。命令、路径、代码符号、Markdown 固定字段名、协议枚举值和工具原始输出可保留原文。
- 不得让 reviewer 角色修改仓库文件。Reviewer 只返回一份符合固定格式的 Markdown 文档；编排者通过 `scripts/review-manager.js --finalize` 解析、持久化并校验该文档。
- `plan-reviewer` 和 `code-reviewer` 的每一轮评审都必须创建全新、独立的原生子 Agent 实例；即使角色和评审类型相同，也不得恢复或复用任何之前轮次创建的 reviewer，且不得继承父级会话、planner 或 coder 的任何上下文。`review-manager.js --finalize` 会拒绝与历史 reviewer-run 重复的 `--agent-id`。
- `planner` 和 `coder` 可以跨轮复用各自之前创建的子 Agent 实例，以保留方案修订或代码实现上下文；二者不得相互复用实例。
- 在 Codex 或 Claude Code 中，运行 `scripts/review-manager.js --prepare`，将返回的仅含路径的提示词交给新的原生 reviewer 子 Agent，把其唯一纯 Markdown 响应保存到仓库外的临时文件，再运行 `scripts/review-manager.js --finalize --input <file> --agent-id <id>`。Prepare 会绑定全部输入和 Git 树；finalize 会拒绝漂移、直接校验 Markdown、写入不可变的 reviewer-run 并将规范评审持久化为 `reviews/*-review-N.md`。不得直接调用 `scripts/persist-review-markdown.js`。
- 后续只读复验使用 `scripts/validate-review-markdown.js`，该命令直接解析和校验 `.md` 文档。
- 每轮代码实现和验证完成后直接执行 `coder-complete`。该转换只校验初始基线与当前工作树可以安全重建，不生成差异文件或轮次范围文件。
- Prepare 会把初始基线到绑定工作树的完整 diff 写入 `diffs/code-diff-N.patch`，作为代码 reviewer 与人工共同使用的评审交接产物，并将其内容摘要绑定到 reviewer 请求。
- 不得生成、传递或记录相邻代码轮次间的增量 patch；`code-diff-N.patch` 始终表示初始基线到当前评审版本的差异。
- Prepare 会在 reviewer-run 中绑定当前工作树摘要；评审期间代码发生变化时 finalize 会拒绝结果，必须重新开始当前评审轮次。
- 所有状态转换都使用 `scripts/advance-state.js`，不得手动编辑 `state.json`。
- reviewer 返回 `approved` 或循环达到 `state.json.maxRounds` 时停止当前循环。
- 因达到 `maxRounds` 而停止时，用中文汇总剩余问题，并询问用户要继续、接受还是修订。
- 在确认节点等待期间，如果已评审的方案或代码发生变化，优先开启新一轮评审。只有用户当前消息明确接受变化时才可覆盖，并传入 `--accept-changed-inputs true` 和非空的 `--override-reason`。转换会把接受的漂移记录到 `state.json.confirmationOverrides`。
- 只能在 `max_rounds_reached` 确认节点增加 `maxRounds`；在该节点拒绝结果后，必须由用户当前消息明确给出更高上限，才能恢复起草。传入 `--user-confirmed true`；不得复用更早的笼统指令绕过已配置上限。
- 在 `plan.md` 中保留每轮修订记录，并以中文书写记录内容。

## 工作流角色

四个必需角色是：

- `planner`
- `plan-reviewer`
- `coder`
- `code-reviewer`

使用 `templates/roles/` 下的模板作为角色定义。在 Codex 和 Claude Code 中，四个角色都必须是原生子 Agent。Planner/coder 后续轮次可以继续使用各自已有实例；plan-reviewer/code-reviewer 每一轮必须新建实例，并禁用父级会话上下文继承。

## 用户确认节点

方案循环结束后，用中文向用户展示：

- `plan.md` 路径
- 方案循环终止原因
- 按轮次整理的评审摘要
- 未接受的问题及理由

用中文询问是否进入代码循环。只有用户明确确认后，才运行 `advance-state.js --event confirm-plan`。

代码循环结束后，用中文向用户展示：

- `plan.md` 路径
- 差异摘要
- 代码循环终止原因
- 验证命令及结果
- 剩余风险

用中文询问是否接受最终结果。只有用户明确确认后，才运行 `advance-state.js --event confirm-final`。
