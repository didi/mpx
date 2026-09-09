# 目标

实现一个自带review loop的工作流，设置四个agent，分别是planner，plan-reviewer，coder，code-reviewer，执行流程如下：

1. 用户提出需求目标，进入plan loop
2. plan loop
   2.1 planner接收需求目标，制定产出技术方案[plan].md，提交给plan-reviewer
   2.2 plan-reviewer review技术方案，提出修改建议到planner
   2.3 planner评估修改建议，认为值得采纳的部分更新技术方案，不予采纳的部分说明原因，将修订记录更新到[plan].md，再整体提交到plan-reviewer
   2.4 plan-reviewer 再次review，并再次提出修改建议到planner，继续循环
   2.5 循环终止条件：plan-reviewer不再提出新的修改建议或循环次数达到 `maxRounds`（默认3次），将包含每一轮修订记录的技术方案[plan].md提交给用户确认
3. 用户确认产出最终版技术方案[plan].md，进入code loop
4. code loop
   4.1 coder接收技术方案，实施代码变更
   4.2 code-reviewer review代码变更，提出修改建议到coder
   4.3 coder评估修改建议，认为值得采纳的部分更新代码和技术方案，不予采纳的部分说明原因，将修订记录更新到[plan].md，
   4.4 code-reviewer 再次review，并再次提出修改建议到coder，继续循环
   4.5 循环终止条件：code-reviewer不再提出新的修改建议或循环次数达到 `maxRounds`（默认3次），将包含每一轮修订记录的技术方案[plan].md及代码diff提交给用户确认
5. 用户确认最终结果

# 要求

1. 流程100%稳定
2. 可迁移复用
3. 具备agent通用性，可同时支持codex和claude code

# 基础方案

## 总体思路

将四个 agent 设计为四个**逻辑角色**，而不是绑定某个具体平台的内置 agent 能力：

- `planner`：根据用户需求、仓库约束和相关上下文产出技术方案。
- `plan-reviewer`：只审查技术方案，不修改方案文件。
- `coder`：根据已确认的技术方案实施代码变更，并同步维护方案中的执行记录。
- `code-reviewer`：只审查代码 diff 与方案一致性，不直接修改代码。

实际运行时由触发 Skill 的主 agent 作为 `orchestrator` 串联上述角色。`orchestrator` 可以是 Codex 主会话，也可以是 Claude Code 主会话；运行环境必须支持真实 subagent，并将四个逻辑角色映射为独立 subagent。若无法创建真实 subagent，工作流直接终止并输出错误，不支持主会话串行模拟。四个角色之间不直接通过自由对话传递状态，而是通过文件产物和结构化 JSON 进行交接，保证流程可恢复、可审计、可迁移。

核心原则：

1. **单写多读**：每个阶段只有当前执行角色能写主产物，reviewer 只产出 review 文件。
2. **状态显式化**：循环轮次、采纳状态、终止原因全部写入 `state.json` 和 `[plan].md`。
3. **用户确认门禁**：plan loop 结束后必须用户确认，才能进入 code loop；code loop 结束后必须用户确认，流程才算完成。
4. **最大轮次兜底**：每个 loop 默认最多 3 轮，支持任务级自定义 `maxRounds`，避免无限循环。
5. **Skill 内隔离平台差异**：Codex / Claude Code 的差异只体现在 Skill 的平台说明与角色模板中，工作区协议保持一致。

## 工作区结构

每次执行创建一个独立工作目录，建议放在项目内可忽略目录中：

```text
.agent-workflows/review-loop/<task-id>/
  goal.md
  state.json
  plan.md
  reviews/
    plan-review-1.json
    plan-review-2.json
    plan-review-3.json
    code-review-1.json
    code-review-2.json
    code-review-3.json
  diffs/
    code-diff-1.patch
    code-diff-2.patch
    code-diff-3.patch
  logs/
    planner-1.md
    plan-reviewer-1.md
    coder-1.md
    code-reviewer-1.md
```

其中：

- `goal.md`：用户原始需求和补充约束。
- `state.json`：机器可读状态，供恢复流程和判断下一步使用。
- `plan.md`：主技术方案，即目标中的 `[plan].md`。
- `reviews/*.json`：reviewer 的结构化审查结果。
- `diffs/*.patch`：每轮 code loop 后的代码 diff 快照。
- `logs/*.md`：每个角色的自然语言输出备份，便于排查。

`state.json` 示例：

```json
{
  "taskId": "support-rn-xxx",
  "phase": "plan_loop",
  "planRound": 2,
  "codeRound": 0,
  "maxRounds": 3,
  "planStatus": "reviewing",
  "codeStatus": "pending",
  "awaitingUserConfirmation": false,
  "lastReviewFile": "reviews/plan-review-2.json",
  "terminationReason": ""
}
```

`maxRounds` 为任务级配置，默认值为 `3`。用户可以在触发 Skill 时指定，例如“最多 review 5 轮”；未指定时由 `init-workspace.js` 写入默认值。`validate-state.js` 需要校验 `maxRounds` 为正整数，建议限制在 `1-10` 之间，避免误配置导致过长循环。

## `[plan].md` 文档契约

`plan.md` 不只是技术方案，也是跨阶段交接和审计记录。建议固定包含以下章节：

```markdown
# 需求目标

# 背景与约束

# 技术方案

# 影响范围

# 验证方案

# 风险与回滚

# Plan Loop 修订记录

## 第 1 轮

- 采纳：
- 未采纳：
- 方案变更摘要：

# Code Loop 执行记录

## 第 1 轮

- 代码变更摘要：
- 采纳的 review 建议：
- 未采纳的 review 建议：
- 验证结果：
```

约束：

1. `planner` 只能修改 `需求目标` 到 `Plan Loop 修订记录` 之间的方案内容和 plan loop 修订记录。
2. `coder` 可以修改 `Code Loop 执行记录`，也可以在实现中发现方案需要校正时更新前文方案，但必须在执行记录中说明原因。
3. reviewer 不直接修改 `plan.md`，只能输出 review JSON。
4. 每轮修订必须保留历史记录，不覆盖上一轮。

## Review 结果契约

reviewer 输出必须是结构化 JSON，避免自然语言难以稳定解析。

```json
{
  "round": 1,
  "status": "changes_requested",
  "summary": "方案整体可行，但需要补充失败恢复策略。",
  "findings": [
    {
      "id": "P1",
      "severity": "major",
      "category": "stability",
      "target": "技术方案/流程恢复",
      "comment": "缺少中断后从 state.json 恢复的规则。",
      "suggestion": "补充 state.json 的状态枚举和恢复入口。"
    }
  ]
}
```

字段约束：

- `status` 只允许 `approved` 或 `changes_requested`。
- `severity` 只允许 `critical`、`major`、`minor`、`nit`。
- `findings` 为空时，`status` 必须是 `approved`。
- `approved` 表示 reviewer 没有新的实质性修改建议，可以结束当前 loop。
- `nit` 只作为建议记录，不阻塞 loop 终止；是否采纳由执行角色判断。

## Plan Loop 流程

```text
用户需求
  -> orchestrator 写入 goal.md / state.json
  -> planner 生成或修订 plan.md
  -> plan-reviewer 输出 reviews/plan-review-N.json
  -> orchestrator 判断终止条件
      -> approved：提交用户确认
      -> changes_requested 且 N < 3：planner 评估并修订
      -> changes_requested 且 N = 3：提交用户确认，并标明因达到最大轮次终止
```

`planner` 处理 review 建议时必须逐条决策：

- 采纳：更新方案，并在 `Plan Loop 修订记录` 中记录 finding id、变更摘要。
- 不采纳：不修改方案，但必须记录 finding id 和不采纳原因。
- 部分采纳：说明采纳范围和未采纳部分。

plan loop 终止后，`orchestrator` 向用户提交：

1. `plan.md` 当前版本。
2. plan loop 终止原因。
3. 未采纳建议清单。
4. 需要用户确认的问题。

只有用户明确确认后，才能进入 code loop。

## Code Loop 流程

```text
用户确认 plan.md
  -> coder 按方案实施代码变更
  -> orchestrator 生成 diffs/code-diff-N.patch
  -> code-reviewer 审查 plan.md + diff + 验证结果
  -> orchestrator 判断终止条件
      -> approved：提交用户最终确认
      -> changes_requested 且 N < 3：coder 评估并修订
      -> changes_requested 且 N = 3：提交用户最终确认，并标明因达到最大轮次终止
```

`coder` 每轮结束必须更新 `plan.md` 的 `Code Loop 执行记录`：

- 代码变更摘要。
- 与技术方案不一致的地方及原因。
- 采纳 / 未采纳的 code review 建议。
- 已执行的 eslint / jest / 其他验证命令及结果。
- 未能执行的验证命令及原因。

`code-reviewer` 的审查重点：

1. 代码是否忠实实现已确认方案。
2. 是否引入明显行为回归、边界遗漏或兼容性问题。
3. 是否违反仓库约束，例如运行时代码对象合并禁止 object spread。
4. 测试是否覆盖核心功能。
5. 文档 / Skill 是否在对外能力变化时同步更新。

## 状态机

建议将流程收敛为有限状态机，避免靠自然语言猜测下一步：

| 状态 | 允许动作 | 下一状态 |
| --- | --- | --- |
| `init` | 写入需求与初始化工作区 | `plan_drafting` |
| `plan_drafting` | planner 生成 / 修订方案 | `plan_reviewing` |
| `plan_reviewing` | plan-reviewer 输出审查结果 | `plan_drafting` / `awaiting_plan_confirm` |
| `awaiting_plan_confirm` | 用户确认 / 退回修改 | `code_drafting` / `plan_drafting` |
| `code_drafting` | coder 实施代码与记录 | `code_reviewing` |
| `code_reviewing` | code-reviewer 输出审查结果 | `code_drafting` / `awaiting_final_confirm` |
| `awaiting_final_confirm` | 用户确认 / 退回修改 | `done` / `code_drafting` |
| `done` | 流程结束 | - |

状态推进只由 `orchestrator` 执行。任一角色输出缺失、JSON 不合法、状态不匹配时，不推进状态，而是要求当前角色重新产出。

## Agent 提示词契约

### planner

输入：

- `goal.md`
- 当前 `plan.md`，如果存在
- 最近一轮 `plan-review-*.json`，如果存在
- 仓库 AGENTS.md / 子包 AGENTS.md / 相关上下文

职责：

1. 产出或修订可执行的技术方案。
2. 对 reviewer findings 逐条给出采纳决策。
3. 不做代码实现。
4. 保持方案简洁，优先复用现有流程。

输出：

- 更新后的 `plan.md`
- 本轮 planner 日志

### plan-reviewer

输入：

- `goal.md`
- 当前 `plan.md`
- 历史 plan review 和修订记录

职责：

1. 找出方案中的稳定性、完整性、可验证性、仓库约束风险。
2. 不重复提出已明确不采纳且理由充分的建议，除非发现新的证据。
3. 不直接修改方案。

输出：

- `reviews/plan-review-N.json`

### coder

输入：

- 用户确认后的 `plan.md`
- 最近一轮 `code-review-*.json`，如果存在
- 仓库上下文

职责：

1. 按方案实施最小必要代码变更。
2. 必要时同步更新文档 / Skill。
3. 执行相关 eslint 和 jest。
4. 更新 `plan.md` 的 code loop 执行记录。

输出：

- 代码变更
- 更新后的 `plan.md`
- 本轮 coder 日志

### code-reviewer

输入：

- `goal.md`
- 用户确认后的 `plan.md`
- 当前代码 diff
- 验证结果

职责：

1. 以代码审查视角输出缺陷、风险和缺失测试。
2. 只关注本次变更相关内容。
3. 不直接修改代码。

输出：

- `reviews/code-review-N.json`

## Skill 执行策略

### 通用执行模型

工作流以一个可复用 Skill 作为入口。Skill 被触发后，主 agent 承担 `orchestrator` 职责：

1. 创建 `.agent-workflows/review-loop/<task-id>/` 工作区。
2. 将用户需求写入 `goal.md`，初始化 `state.json`。
3. 读取 Skill 内的角色模板，按当前状态执行对应角色。
4. 将角色输出写入工作区文件。
5. 校验 review JSON 和状态推进条件。
6. 在 plan loop / code loop 结束时暂停，等待用户确认。

Skill 不依赖平台私有会话记忆作为唯一状态来源；所有可恢复状态必须落到工作区文件。

### Codex 适配

- Codex 触发 `review-loop` Skill 后，由主会话读取 Skill 指引并充当 `orchestrator`。
- 首次运行时先检查项目级 `.codex/agents/` 是否已存在 `planner`、`plan-reviewer`、`coder`、`code-reviewer` 四个 custom agent 定义，存在则直接复用。
- 如果四个角色定义不完整，主会话询问用户选择：创建本次任务临时角色，或持久化写入项目级 `.codex/agents/`。
- 选择临时角色时，从 `templates/roles/` 生成本次任务的运行期角色定义，放在 `.agent-workflows/review-loop/<task-id>/runtime/roles/`，仅本次任务使用。
- 选择持久化时，生成 Codex custom agent TOML 文件，写入 `.codex/agents/`，后续任务可直接复用。
- Codex 不会无提示自动启动 subagent；Skill 触发后需要主会话显式按四个角色发起 subagent 工作流。
- 如果无法创建真实 subagent，`prepare-agent-roles.js` 返回错误，工作流终止。
- 文件修改使用当前工作区，reviewer 默认只读，避免误改。

### Claude Code 适配

- Claude Code 触发 `review-loop` Skill 后，同样由主会话充当 `orchestrator`。
- 首次运行时先检查项目级 `.claude/agents/` 是否已存在 `planner`、`plan-reviewer`、`coder`、`code-reviewer` 四个角色定义，存在则直接复用。
- 如果四个角色定义不完整，主会话询问用户选择：创建本次任务临时角色，或持久化写入项目级 `.claude/agents/`。
- 选择临时角色时，从 `templates/roles/` 复制到 `.agent-workflows/review-loop/<task-id>/runtime/roles/`，仅本次任务使用。
- 选择持久化时，从 `templates/roles/` 复制到 `.claude/agents/`，后续任务可直接复用。
- 如果无法创建真实 subagent，`prepare-agent-roles.js` 返回错误，工作流终止。
- 同样以文件产物和 `state.json` 为准，不依赖 Claude 会话内部记忆。

## 稳定性策略

### 结构化输出校验

每次 reviewer 输出后必须调用 `scripts/validate-review-json.js` 校验 JSON：

1. JSON 能被解析。
2. `status`、`severity` 等枚举合法。
3. `status=approved` 时 `findings=[]`。
4. `status=changes_requested` 时至少存在一个非 `nit` finding。

校验失败时不计入轮次，要求 reviewer 重新输出。

### 幂等与恢复

每个阶段开始前读取 `state.json` 判断下一步，不根据最近聊天内容推断。中断后恢复流程：

1. 调用 `scripts/check-recoverability.js` 读取并检查工作区。
2. 调用 `scripts/validate-state.js` 校验状态对应的必需产物是否存在。
3. 若产物完整，从当前状态继续。
4. 若产物缺失，回退到上一个稳定状态重新执行该轮。

### 防重复建议

reviewer 输入必须包含历史 review 和采纳记录。对于已处理的 finding：

- 已采纳并解决：不得重复提出。
- 未采纳且理由充分：不得重复提出，除非能指出新证据。
- 部分采纳：只能针对未解决部分继续提出。

### 最大轮次终止

达到 `state.json.maxRounds` 但仍有 `changes_requested` 时，不自动失败，而是进入用户确认：

- 标明 `terminationReason=max_rounds_reached`。
- 标明实际轮次和配置值，例如 `round=5/maxRounds=5`。
- 汇总剩余 findings。
- 给出执行角色对剩余问题的处理建议。
- 由用户决定继续追加轮次、接受当前结果或退回修改。追加轮次时必须通过 `advance-state.js` 更新 `maxRounds`，不能手写修改 `state.json`。

## 最小可行实现

第一阶段直接实现为一个可复制的 Skill 包，不提供 npm / CLI 形态：

1. 创建 `.agents/skills/review-loop/`。
2. 在 `SKILL.md` 中声明触发条件、总流程、用户确认门禁和恢复规则。
3. 在 `references/` 中放置协议、状态机、角色职责和平台差异说明。
4. 在 `templates/` 中放置 `goal.md`、`plan.md` 和四个角色提示词模板。
5. 在 `schemas/` 中放置 `state.schema.json` 和 `review.schema.json`，用于约束结构化输出。
6. 在 `scripts/` 中放置确定性脚本，负责初始化、校验、状态推进、diff 快照等不应交给模型自由发挥的动作。
7. 跑通一次真实需求后，再根据执行痕迹精简 `SKILL.md`，把低频细节下沉到 references。

这些脚本跟随 Skill 一起发布，由触发 Skill 的主 agent 在关键节点调用。它们不是独立 CLI 产品，不要求用户安装 npm 包，也不作为跨项目命令暴露；但在 Skill 内部，它们承担原本 CLI 中负责确定性的部分。

## 实现产物

该方案最终实现出来的产物是一个完整的 `review-loop` Skill 包。

### Skill 包结构

推荐结构如下：

```text
.agents/skills/review-loop/
  SKILL.md
  references/
    protocol.md
    state-machine.md
    role-contracts.md
    codex.md
    claude-code.md
  templates/
    goal.md
    plan.md
    roles/
      planner.md
      plan-reviewer.md
      coder.md
      code-reviewer.md
  schemas/
    state.schema.json
    review.schema.json
  scripts/
    init-workspace.js
    prepare-agent-roles.js
    validate-state.js
    validate-review-json.js
    advance-state.js
    snapshot-diff.js
    check-recoverability.js
  evals/
    evals.json
```

各部分职责：

- `SKILL.md`：轻量入口，负责触发条件、总体步骤、必须暂停等待用户确认的时机。
- `references/protocol.md`：工作区结构、`plan.md` 契约、review JSON 契约。
- `references/state-machine.md`：状态枚举、状态推进条件、恢复规则。
- `references/role-contracts.md`：四个逻辑角色的输入、职责和输出格式。
- `references/codex.md`：Codex 环境下如何检查、准备并启动真实 subagent。
- `references/claude-code.md`：Claude Code 环境下如何检查、准备并启动真实 subagent。
- `templates/`：每次执行时复制或参考的目标文件模板。
- `schemas/`：结构化输出校验依据。
- `scripts/`：确定性脚本层，负责初始化、角色配置准备、校验、状态推进、diff 快照和恢复检查，不作为独立产品发布入口。
- `evals/`：Skill 自测用例，用于验证触发和执行质量。

### 确定性脚本层

Skill 内置脚本用于补足纯提示词工作流的稳定性。主 agent 可以写方案、写代码、判断是否采纳建议，但以下动作必须交给脚本完成：

| 脚本 | 触发时机 | 职责 |
| --- | --- | --- |
| `init-workspace.js` | Skill 首次触发 | 创建工作区、复制模板、写入初始 `goal.md` 和包含 `maxRounds` 的 `state.json` |
| `prepare-agent-roles.js` | 工作区初始化后 | 检查平台 subagent 能力和长效 agent 配置，按用户选择生成临时角色或持久化角色配置；不支持真实 subagent 时终止 |
| `validate-state.js` | 每次状态推进前 | 校验 `state.json` 字段、状态枚举、轮次、`maxRounds`、必需产物是否存在 |
| `validate-review-json.js` | reviewer 输出后 | 校验 review JSON schema、`status/findings/severity` 约束 |
| `advance-state.js` | loop 判断完成后 | 根据当前状态、review 结果、`maxRounds` 和用户确认推进状态机 |
| `snapshot-diff.js` | 每轮 code loop 后 | 生成 `diffs/code-diff-N.patch`，供 code-reviewer 审查 |
| `check-recoverability.js` | 中断恢复时 | 检查工作区是否完整，决定继续、重跑当前轮或停止 |

脚本输入输出建议统一使用文件路径和 JSON，避免依赖平台会话状态：

```bash
node .agents/skills/review-loop/scripts/validate-review-json.js \
  --schema .agents/skills/review-loop/schemas/review.schema.json \
  --review .agent-workflows/review-loop/<task-id>/reviews/plan-review-1.json
```

脚本失败时返回非 0 exit code，并输出可读错误。主 agent 遇到脚本失败时不得继续推进状态，应先修正对应产物或要求当前角色重新输出。

### 脚本与 agent 的边界

确定性脚本只做结构性和机械性工作：

- 创建目录和模板文件。
- 检查和生成角色配置文件。
- 读写 `state.json`。
- 校验 JSON schema。
- 判断状态机合法迁移。
- 生成代码 diff 快照。
- 检查工作区恢复条件。

确定性脚本不做智能决策：

- 不判断技术方案是否合理。
- 不决定 reviewer 建议是否采纳。
- 不修改业务代码。
- 不总结风险。
- 不替用户确认。

这样可以保证 Skill 仍然是完整发布单元，同时把“模型容易忘、容易跳步、容易解析错”的部分下沉到稳定脚本里。

### `SKILL.md` 内容边界

`SKILL.md` 应保持短而稳定，只承载高频控制信号：

- 什么时候必须使用该 Skill。
- 当前 agent 是 `orchestrator`，需要按状态机推进。
- 必须创建 `.agent-workflows/review-loop/<task-id>/`。
- 必须先完成 plan loop 并等待用户确认，再进入 code loop。
- reviewer 只能输出 review JSON，不直接修改主产物。
- 未指定时使用默认 `maxRounds=3`；用户指定时写入 `state.json.maxRounds`。
- 达到 `maxRounds` 或 reviewer approved 时结束对应 loop。
- 中断恢复时先读 `state.json`。
- 初始化、review JSON 校验、状态推进、diff 快照必须调用 Skill 内置脚本完成。

长模板、schema、平台差异、示例和细节流程放到 `references/`，由 `SKILL.md` 按需引导读取，避免每次触发都加载过多上下文。

## 调用方式

### 自然语言触发

用户通过自然语言触发 Skill：

```text
使用 review-loop 工作流实现这个需求：...
```

```text
请按 review-loop 先产出方案并自审，等我确认后再实现代码：...
```

```text
这个需求比较大，走 planner / reviewer / coder / code-reviewer 的 loop 流程。
```

```text
使用 review-loop 工作流实现这个需求，plan/code loop 最多各 5 轮：...
```

Skill 触发后，主 agent 执行：

1. 为本次任务生成 `task-id`。
2. 解析用户是否指定 `maxRounds`，未指定则使用默认值 `3`。
3. 调用 `scripts/init-workspace.js` 创建 `.agent-workflows/review-loop/<task-id>/`，并写入 `state.json.maxRounds`。
4. 调用 `scripts/prepare-agent-roles.js` 检查并准备 Codex / Claude Code 角色定义。
5. 调用 `scripts/validate-state.js` 校验初始工作区。
6. 读取 `references/protocol.md`、`references/state-machine.md` 和 `references/role-contracts.md`。
7. 进入 plan loop。

### Codex 调用

Codex 中调用时，Skill 的执行入口是用户请求本身，不需要额外命令。角色准备流程如下：

1. 检查 `.codex/agents/` 中是否已存在 `planner`、`plan-reviewer`、`coder`、`code-reviewer` 四个 custom agent 定义。
2. 如果四个角色都存在，直接复用项目级角色定义。
3. 如果角色缺失，询问用户选择：
   - **临时创建**：生成到 `.agent-workflows/review-loop/<task-id>/runtime/roles/`，仅本次任务使用。
   - **持久化写入项目**：生成到 `.codex/agents/`，作为当前项目的 custom agents。
4. 角色定义准备完成后，主会话必须显式发起真实 subagent 工作流，并分别启动四个角色。
5. 如果当前环境不支持 subagent，工作流终止并提示当前平台无法执行 review-loop。

- 每次角色执行前，从工作区文件重新构造输入。
- 每次 reviewer 输出后，调用 `validate-review-json.js` 校验结构。
- 每次 code loop 修改后，调用 `snapshot-diff.js` 生成 diff 快照。
- 每次状态变化时，调用 `advance-state.js` 更新 `state.json`。

### Claude Code 调用

Claude Code 中调用时，也通过用户请求触发 Skill。角色准备流程如下：

1. 检查 `.claude/agents/` 中是否已存在 `planner.md`、`plan-reviewer.md`、`coder.md`、`code-reviewer.md`。
2. 如果四个角色都存在，直接复用项目级角色定义。
3. 如果角色缺失，询问用户选择：
   - **临时创建**：复制到 `.agent-workflows/review-loop/<task-id>/runtime/roles/`，仅本次任务使用。
   - **持久化写入**：复制到 `.claude/agents/`，作为项目级 agent 配置长期复用。
4. 角色定义准备完成后，主会话必须发起真实 subagent 工作流，并分别启动四个角色。
5. 如果当前环境不支持动态 subagent，工作流终止并提示当前平台无法执行 review-loop。

- reviewer 输出、状态推进和 diff 快照同样必须通过 Skill 内置脚本完成。
- 任何情况下，状态、方案、review 和 diff 都以 `.agent-workflows/review-loop/<task-id>/` 为准。

### 用户确认

plan loop 结束后，主 agent 向用户输出：

- `plan.md` 路径。
- plan loop 终止原因。
- 每轮 review 摘要。
- 未采纳建议及原因。
- 是否进入 code loop 的确认问题。

用户明确确认后，主 agent 将 `state.json` 推进到 `code_drafting`。
该推进必须通过 `advance-state.js --event confirm-plan` 完成，不能手写修改 `state.json`。

code loop 结束后，主 agent 向用户输出：

- `plan.md` 路径。
- 当前代码 diff 摘要。
- code loop 终止原因。
- 验证命令和结果。
- 剩余风险。
- 是否接受最终结果的确认问题。

用户明确接受后，主 agent 通过 `advance-state.js --event confirm-final` 将状态推进到 `done`。

## 发布与复用

### Skill 发布形态

发布单位就是 `review-loop` Skill 目录：

```text
.agents/skills/review-loop/
  SKILL.md
  references/
    protocol.md
    state-machine.md
    role-contracts.md
    codex.md
    claude-code.md
  templates/
  schemas/
  scripts/
    init-workspace.js
    prepare-agent-roles.js
    validate-state.js
    validate-review-json.js
    advance-state.js
    snapshot-diff.js
    check-recoverability.js
  evals/
```

如果目标平台支持 `.skill` 打包格式，可以将该目录打包为：

```text
review-loop.skill
```

### 安装方式

复用方将 Skill 放到自己的 Skill 搜索路径中，例如：

```text
.agents/skills/review-loop/
```

安装后通过自然语言触发，不要求项目安装 npm 包或额外命令。

### Codex 复用

Codex 侧只需要识别到 `review-loop` Skill。为了提升触发率，`SKILL.md` frontmatter 的 `description` 应覆盖以下表达：

- review loop
- planner / reviewer / coder / code-reviewer
- 先方案后实现
- 多轮自审
- 需要用户确认后再编码
- 需要稳定可恢复的 agent 工作流

Codex 执行时优先读取 `references/codex.md`，再按需读取通用协议文件。

运行时优先检查项目级 `.codex/agents/` 是否已有四个 custom agent：

```text
.codex/agents/planner.toml
.codex/agents/plan-reviewer.toml
.codex/agents/coder.toml
.codex/agents/code-reviewer.toml
```

如果已存在，直接复用。若不存在或不完整，则让用户选择临时创建或持久化写入项目级 `.codex/agents/`。

临时创建时写入：

```text
.agent-workflows/review-loop/<task-id>/runtime/roles/planner.md
.agent-workflows/review-loop/<task-id>/runtime/roles/plan-reviewer.md
.agent-workflows/review-loop/<task-id>/runtime/roles/coder.md
.agent-workflows/review-loop/<task-id>/runtime/roles/code-reviewer.md
```

持久化写入时生成 Codex custom agent TOML，例如：

```toml
name = "planner"
description = "Plan reviewer-loop tasks before implementation."
developer_instructions = """
Read the review-loop workspace inputs, produce or revise plan.md, and do not edit code.
"""
```

持久化写入需要用户明确确认，避免静默修改项目级 agent 配置。临时创建不影响长期配置，适合作为默认推荐选项。

### Claude Code 复用

Claude Code 侧同样安装 Skill 目录。运行时优先检查项目级 `.claude/agents/` 是否已有四个角色：

```text
.claude/agents/planner.md
.claude/agents/plan-reviewer.md
.claude/agents/coder.md
.claude/agents/code-reviewer.md
```

如果已存在，直接复用。若不存在或不完整，则让用户选择临时创建或持久化写入。

临时创建时写入：

```text
.agent-workflows/review-loop/<task-id>/runtime/roles/planner.md
.agent-workflows/review-loop/<task-id>/runtime/roles/plan-reviewer.md
.agent-workflows/review-loop/<task-id>/runtime/roles/coder.md
.agent-workflows/review-loop/<task-id>/runtime/roles/code-reviewer.md
```

持久化写入时写入：

```text
.claude/agents/planner.md
.claude/agents/plan-reviewer.md
.claude/agents/coder.md
.claude/agents/code-reviewer.md
```

持久化写入需要用户明确确认，避免静默修改项目级 agent 配置。临时创建不影响项目配置，适合作为默认推荐选项。

### 版本与升级

发布后需要把协议版本写入 `SKILL.md` 和 `state.json`：

```yaml
---
name: review-loop
description: ...
protocolVersion: 1.0.0
---
```

```json
{
  "protocolVersion": "1.0.0"
}
```

兼容策略：

- patch 版本只修复模板和校验问题，不改变状态机。
- minor 版本允许新增字段，但不能破坏旧任务恢复。
- major 版本才允许调整状态机或 review schema。

Skill 恢复旧任务时，如果发现工作区中的 `protocolVersion` 与当前 Skill 不兼容，应停止继续推进，并提示用户使用旧版 Skill 完成任务或手动迁移工作区。

### Skill 自测

发布前建议提供 2-3 个 eval：

1. 普通代码需求：验证是否先进入 plan loop，且等待用户确认后才进入 code loop。
2. reviewer 提出修改建议：验证 planner / coder 是否逐条记录采纳和不采纳原因。
3. 中断恢复：验证再次触发 Skill 时是否先读取 `state.json`，从正确状态继续。

eval 输出重点检查：

- 是否创建了正确的工作区结构。
- `plan.md` 是否包含修订记录。
- review JSON 是否符合 schema。
- `state.json` 是否只通过脚本推进。
- 自定义 `maxRounds` 是否写入 `state.json` 并被状态机使用。
- code loop 后是否生成 diff 快照。
- 是否没有跳过用户确认门禁。

## 后续可扩展能力

- 支持把未采纳建议导出为风险清单。
- 支持把 code loop 的验证命令固化为任务级 checklist。
- 支持将最终 `plan.md`、diff、review 结果打包为 PR 描述。
