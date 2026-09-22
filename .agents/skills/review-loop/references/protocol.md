# 评审循环协议

当前协议版本：`3.0.0`。

## 工作区

每次运行使用独立工作区：

```text
.agent-workflows/review-loop/<task-id>/
  goal.md
  state.json
  plan.md
  reviews/
  diffs/
  logs/
  runtime/
    roles/
    reviewer-runs/
```

只有在不可变评审历史尚不存在时，`init-workspace.js --force` 才能替换初始文件。如果 `reviews/` 或 `runtime/reviewer-runs/` 非空，必须创建新任务 ID，不得复用工作区。

文件说明：

- `goal.md`：用户原始需求和约束。
- `state.json`：机器可读的工作流状态。
- `plan.md`：中文技术方案，以及方案循环修订记录和代码循环执行记录。
- `reviews/*.md`：固定格式的纯 Markdown reviewer 输出；脚本直接解析和校验其章节。
- `diffs/code-diff-N.patch`：Prepare 时生成的评审交接产物，内容严格等于初始基线到当前轮绑定工作树的 diff，同时供 reviewer 评审和人工回溯，不表示相邻轮次间变化。
- `logs/*.md`：中文角色日志。
- `runtime/roles/`：供支持动态注册的宿主使用的临时角色定义；Codex 项目角色使用 `.codex/agents/`。
- `runtime/reviewer-runs/`：不可变的评审执行记录。每条记录把一个当前轮次新建的平台原生 reviewer 子 Agent、角色和轮次，与仅含路径的初始输入、全部输入摘要、Git 树、执行证据及已校验 reviewer 结果绑定。不同轮次的 Agent ID 不得重复。

## 中文输出契约

所有面向用户或需要用户确认的自然语言中间产物必须使用中文，包括：

- `plan.md` 中的目标说明、背景约束、技术方案、影响范围、验证方案、风险与回滚、方案循环修订记录和代码循环执行记录；
- `reviews/*.md` 中的摘要、分类、目标说明、问题说明、修改建议和剩余风险；
- `logs/*.md` 中的 planner/coder 日志；
- 方案确认与最终确认节点展示的终止原因说明、逐轮评审摘要、未接受问题、差异摘要、验证结论、剩余风险和确认提问；
- 因达到最大轮数、隔离失败或环境不支持而向用户提供的说明。

命令、文件路径、代码符号、Markdown 固定字段名、协议状态与枚举值、模型/平台标识和工具原始输出可保留原文；但对这些内容的解释、结论和处置理由必须使用中文。

## Reviewer-run 契约

进入 `plan_reviewing` 或 `code_reviewing` 后，运行：

```bash
node .agents/skills/review-loop/scripts/review-manager.js \
  --task-id <task-id> \
  --kind plan|code \
  --round N \
  --prepare
```

Prepare 会冻结仅含路径的请求，并返回交给全新宿主原生 reviewer 子 Agent 的精确提示词。编排者必须为当前每一轮评审创建全新、独立的子 Agent，不得恢复或复用任何历史 plan-reviewer/code-reviewer，也不得继承父级会话、planner 或 coder 的任何上下文；然后将其唯一且包含中文评审内容的 Markdown 响应保存到仓库外的临时文件，并运行：

```bash
node .agents/skills/review-loop/scripts/review-manager.js \
  --task-id <task-id> --kind plan|code --round N \
  --finalize --input <temporary-markdown> --agent-id <native-agent-id>
```

Finalize 会先确认 `--agent-id` 未被任何历史 reviewer-run 使用，再重建请求和 Git 树，然后恰好写入一个 `runtime/reviewer-runs/{kind}-review-N.json` 以及规范评审产物。对当前已完成运行记录的幂等持久化重试可以使用其原 Agent ID，但新评审轮次不得恢复旧会话。两个平台都禁止手动持久化评审。

如果 reviewer-run 已存在但规范评审尚未持久化，`check-recoverability.js` 会先根据绑定输入重新校验该运行记录。未变化且有效的运行记录可以重试以完成持久化；陈旧或无效的运行证据要求重新开始任务。

Prepare 和 finalize 会重新计算每个输入摘要和工作树。代码评审会重建初始基线树与当前工作树，把二者的树摘要绑定到请求，并将同一份差异写入 `diffs/code-diff-N.patch`。该 patch 属于 reviewer 输入，其 SHA-256 摘要也会绑定到请求。Finalize、状态校验和最终确认都会拒绝与绑定树不一致或摘要发生变化的评审 patch。方案、reviewer 指令、基线清单、之前的评审、coder 日志、评审 patch 或代码树发生变化时，已完成运行记录失效，不得把其结果复用于不同内容。

评审完成后，确认节点使用更窄的检查以适应正常交互。`confirm-plan` 只比较 `plan.md` 与已评审摘要；`confirm-final` 比较当前 Git 树与已评审树，并校验评审 patch。之后修改任务工作区内的评审历史或日志，不会追溯性地使已完成评审失效；修改或删除评审 patch 会使证据失效。未忽略的仓库变化仍属于 Git 树漂移。方案/代码变化默认会被阻止，但用户当前消息明确接受时，可以传入 `--accept-changed-inputs true --override-reason <中文理由>`。转换会在 `state.json.confirmationOverrides` 中保存轮次、已评审/当前摘要或树、变更路径、理由和时间戳。不可变 reviewer-run 本身仍必须匹配评审完成时捕获的摘要，不能被覆盖。

在任一确认阶段，`check-recoverability.js` 和 `validate-state.js` 都会重新校验不可变运行记录、其中保存的摘要和规范评审产物。方案或 Git 树漂移仍由用户决定是否接受；reviewer 证据缺失或被修改时必须重新开始任务。

该机制通过全新、独立且不继承父级会话上下文的原生子 Agent 实现对话隔离，并使用 Git 树漂移检查保护禁止写入契约。它不隔离仓库读取：reviewer 可以检查宿主会话可见的文件。

## 状态契约

`state.json` 由脚本管理，不得手动编辑。

```json
{
  "protocolVersion": "3.0.0",
  "taskId": "support-rn-xxx",
  "phase": "plan_drafting",
  "planRound": 0,
  "codeRound": 0,
  "maxRounds": 3,
  "planStatus": "drafting",
  "codeStatus": "pending",
  "awaitingUserConfirmation": false,
  "lastReviewFile": "",
  "lastReviewerRunDigest": "",
  "confirmationOverrides": [],
  "terminationReason": "",
  "roleMode": "",
  "platform": ""
}
```

`maxRounds` 默认为 `3`，初始化任务时可以自定义。初始化后，只能在 `max_rounds_reached` 确认节点由用户当前消息明确确认后增加；在该节点拒绝结果并不能跳过上限恢复起草。详见 `state-machine.md`。`validate-state.js` 强制其为 `1` 到 `10` 的整数。

## 方案契约

`plan.md` 是主要交接产物。它必须使用中文并保留历史，不得覆盖之前轮次。

必需章节：

```markdown
# 需求目标

# 背景与约束

# 技术方案

# 影响范围

# 验证方案

# 风险与回滚

# 方案循环修订记录

# 代码循环执行记录
```

`planner` 可以更新技术方案和“方案循环修订记录”。`coder` 可以更新“代码循环执行记录”；如果实现过程中发现方案不匹配，也可以修正方案，但必须用中文说明理由。

Reviewer 不得编辑 `plan.md`。

## Reviewer Markdown 契约

Reviewer 输出必须是以下固定结构的纯 Markdown 文档，且自然语言值使用中文。运行时 reviewer 配置不属于评审正文。脚本直接根据标题和字段解析、校验该文档：

````markdown
# Review Loop 评审

- 轮次：`1`
- 结论：`changes_requested`

## 评审摘要

方案整体可行，但需要补充失败恢复策略。

## 已检查文件

- `AGENTS.md`
- `src/example.js`

## 评审问题

### `P1`

- 严重程度：`major`
- 分类：稳定性
- 目标：`技术方案/流程恢复`

#### 问题

缺少中断后从 `state.json` 恢复的规则。

#### 建议

补充 `state.json` 的状态枚举和恢复入口。

## 剩余风险

无。
````

规则：

- `结论` 只能是 `approved` 或 `changes_requested`。
- `严重程度` 只能是 `critical`、`major`、`minor` 或 `nit`。
- `approved` 要求“评审问题”为 `无。`。
- `changes_requested` 要求至少有一条严重程度不是 `nit` 的问题。
- `nit` 永远不阻塞循环终止。
- 两种状态都必须包含评审摘要、已检查文件、评审问题和剩余风险。Reviewer 仍需完成调用链、验证与反例检查，但不在评审正文记录这些过程。
- 宿主原生 reviewer 配置只记录在内部 reviewer-run 执行证据中，不属于评审 Markdown。
- 剩余风险为多项时，每项使用一个 `- ` 列表项；没有剩余风险时填写 `无。`。
- 摘要、问题内容和剩余风险等自然语言内容必须使用中文；技术标识可保留原文。

编排者必须为每轮评审以禁止写入契约启动全新、独立且不继承父级会话上下文的原生 reviewer，不得恢复或复用任何历史 reviewer。Reviewer 只返回一份固定格式的纯 Markdown 文档，不写入仓库文件。Prepare/finalize 会绑定 Git 树并拒绝漂移、拒绝历史重复 Agent ID、直接解析并校验 Markdown 后持久化响应。代码 reviewer 接收初始基线到当前绑定工作树的 `diffs/code-diff-N.patch`，但不查找、比较或记录相邻轮次差异。持久化前会校验预期轮次、输入摘要、树摘要及评审 patch；只有在匹配的评审阶段，才能为 `state.json` 推导出的下一轮写入 `reviews/*-review-N.md`。

已有评审产物不可变；仅当待写内容逐字节相同时，命令才作为幂等重试成功。新评审产物使用排他创建。任务工作区和 `reviews/` 目录必须是预期的规范非符号链接目录，已有产物必须是普通非符号链接文件。无论符号链接指向的 Markdown 是否有效或逐字节相同，只要产物或任一受检父目录被符号链接替换就会被拒绝。持久化、校验、迁移和状态推进使用相同的产物路径安全检查。状态推进只接受当前任务、预期类型与轮次的规范普通文件 `reviews/{kind}-review-N.md`；`.json` 评审产物会被拒绝。

使用 `scripts/validate-review-markdown.js` 重新校验已经持久化的当前评审。该命令直接解析 `.md` 文档并校验章节、字段和状态关系。

## 旧工作区

协议 `1.0.0` 和 `2.0.0` 工作区默认为只读。运行 `scripts/check-recoverability.js` 检查其状态。旧工作区包含任何 `.json` 评审产物时，不允许迁移，必须创建新任务。只有尚未产生评审，或评审已经符合当前纯 Markdown 契约的工作区，才可由 `scripts/migrate-workspace.js` 在校验基线、轮次、范围和评审产物后恢复。

处于 `awaiting_plan_confirm` 或更晚阶段的工作区，要求最新已完成方案评审符合当前证据契约并为 `approved`，除非其轮次达到 `maxRounds`。`awaiting_final_confirm` 和 `done` 对最新已完成代码评审采用同等规则。阶段计数也必须描述可达状态：确认阶段必须存在对应的已完成轮次，方案阶段不能包含已完成代码轮次。旧版通过结论不能满足当前证据门槛。

Codex 和 Claude Code 工作区若已经停在 `awaiting_plan_confirm` 或 `awaiting_final_confirm`，无法迁移，因为协议 1 没有待确认内容对应的不可变 reviewer-run 产物或摘要。迁移会保持其只读；必须开始新任务。

对于干净的版本 1 基线，`head` 必须能解析到提交及其树；任何声明的基线树必须作为树对象存在，并等于 `head^{tree}`。脏的版本 1 基线无法重建。基线检查失败时，旧状态和协议迁移记录均保持不变。

每个已完成代码轮次，以及 `code_reviewing` 中当前未评审轮次，都必须具有完整范围元数据：四个 tree/head 字段必须是非空字符串，全部路径字段必须是字符串数组。每份范围的 `baselineHead` 和 `baselineTree` 必须匹配重建基线；第 1 轮从该基线树开始，后续 `previousTree` 必须等于上一份范围的 `currentTree`，且每个 `currentTree` 都必须作为 Git 树对象存在。

路径数组中的每一项经 trim 后都必须非空，并按跨平台 Git 路径语义保持仓库相对路径。POSIX 绝对路径、Windows 根路径/驱动器绝对路径、驱动器相对路径、UNC 和设备路径都会被拒绝。反斜杠先作为分隔符处理，再规范化为 Git 使用的 POSIX 斜杠表示；`.`、`..` 和 `../` 逃逸都会被拒绝。

迁移会根据基线到当前树重新计算 `cumulativePaths`，根据前一树到当前树重新计算 `roundPaths`；已存数组必须与排序后的 Git 路径完全一致。`claimedPaths` 是保存的 coder 声明，`unexpectedPaths` 是其相对于 `roundPaths` 的补集：两个数组都必须唯一、保持 `roundPaths` 顺序、互不重叠并共同覆盖每条当前轮路径。`code-diff-N.patch` 和 `code-round-N.patch` 必须与根据同一组已校验树对重建的 Git 差异逐字节匹配。任何结构、对象、路径、分区、补丁或链路失败都会保持协议 1 状态不变。

成功迁移会把来源版本和纯 Markdown 格式记录到 `runtime/protocol-migration.json`，并通过受控命令升级 `state.json`。如果无法安全重建，迁移会失败且不改变状态；应开始新任务，不得转换、重写或继续使用旧 JSON review。

## 轮次记录

Planner/coder 对 reviewer 意见的每次回应都必须用中文记录：

- 问题 ID；
- 接受、拒绝或部分接受；
- 理由；
- 方案或代码变化摘要。

不得静默丢弃被拒绝的问题。
