# 评审循环状态机

编排者必须使用 `scripts/advance-state.js` 完成状态转换。

## 状态

| 阶段 | 含义 | 下一阶段 |
| --- | --- | --- |
| `plan_drafting` | planner 编写或修订 `plan.md` | `plan_reviewing` |
| `plan_reviewing` | plan-reviewer 评审 `plan.md` | `plan_drafting` 或 `awaiting_plan_confirm` |
| `awaiting_plan_confirm` | 等待用户确认方案 | `code_drafting` 或 `plan_drafting` |
| `code_drafting` | coder 实施已确认方案 | `code_reviewing` |
| `code_reviewing` | code-reviewer 评审差异 | `code_drafting` 或 `awaiting_final_confirm` |
| `awaiting_final_confirm` | 等待用户最终确认 | `done` 或 `code_drafting` |
| `done` | 工作流完成 | 无 |

升级旧工作区前，迁移会校验这些阶段不变量：仅方案阶段的 `codeRound = 0`；代码阶段至少已完成一轮方案评审；最终确认和完成阶段至少已完成一轮代码评审。支撑 `awaiting_plan_confirm` 或更晚阶段的最新方案评审，以及支撑 `awaiting_final_confirm` 或 `done` 的最新代码评审，必须是 `approved`，或者已达到 `maxRounds`。低于该上限的 `changes_requested` 评审不能支撑确认阶段。

## 方案循环

1. `plan_drafting`：运行 `planner`，用中文编写方案或修订记录；第 2 轮及后续轮次可以复用原 planner 实例。
2. 使用 `--event planner-complete` 推进。
3. `plan_reviewing`：运行 `review-manager.js --kind plan --round N --prepare`，使用返回的提示词为当前轮次新建全新、独立且不继承父级会话上下文的原生 `plan-reviewer` 子 Agent，不得恢复或复用任何历史 reviewer；再运行 `--finalize --input <file> --agent-id <id>` 校验 Agent ID 并持久化其中文评审结果。
4. 使用 `--event plan-review-complete --review <path>` 推进。

如果评审状态为 `approved`，推进到 `awaiting_plan_confirm`。

如果状态为 `changes_requested` 且 `planRound < maxRounds`，返回 `plan_drafting`。

如果状态为 `changes_requested` 且 `planRound >= maxRounds`，推进到 `awaiting_plan_confirm`，并设置 `terminationReason=max_rounds_reached`。

## 方案确认

先用中文向用户展示技术方案、按轮次整理的评审结论、修订记录、未接受问题及终止原因，并用中文提问。只有用户明确确认后，才执行：

```bash
node .agents/skills/review-loop/scripts/advance-state.js \
  --task-id <task-id> \
  --event confirm-plan
```

该操作会推进到 `code_drafting`。

转换只比较当前 `plan.md` 和已评审方案的摘要。Reviewer 模板、schema、之前的评审及其他非方案输入发生变化，不会阻塞确认。如果方案已变化，优先开启新一轮方案评审。只有用户当前消息明确接受手动变化时，才使用：

```bash
node .agents/skills/review-loop/scripts/advance-state.js \
  --task-id <task-id> \
  --event confirm-plan \
  --accept-changed-inputs true \
  --override-reason "<接受未经评审方案变化的中文理由>"
```

覆盖记录会写入 `state.json.confirmationOverrides`。

如果用户拒绝已通过的方案，使用 `--event reject-plan` 返回 `plan_drafting`。在 `max_rounds_reached` 节点，必须先获得用户对更高上限的明确确认并使用 `set-max-rounds`；`reject-plan` 不能绕过已配置上限。

## 代码循环

1. `code_drafting`：运行 `coder`；第 2 轮及后续轮次可以复用原 coder 实例。
2. 运行相关验证。
3. 使用 `--event coder-complete` 推进。转换会校验初始基线与当前工作树可以安全重建，但不生成轮次范围或相邻轮次增量。
4. `code_reviewing`：运行 `review-manager.js --kind code --round N --prepare`。Prepare 会写入 `diffs/code-diff-N.patch`，将其加入 reviewer 输入并绑定内容摘要。使用返回的提示词为当前轮次新建全新、独立且不继承父级会话上下文的原生 `code-reviewer` 子 Agent，不得恢复或复用任何历史 reviewer。Reviewer 评审该 patch，但不查找或记录中间轮次变化；再运行 `--finalize --input <file> --agent-id <id>` 校验 Agent ID、输入、树摘要及评审 patch 并持久化其中文评审结果。
5. 使用 `--event code-review-complete --review <path>` 推进。

如果评审状态为 `approved`，推进到 `awaiting_final_confirm`。

如果状态为 `changes_requested` 且 `codeRound < maxRounds`，返回 `code_drafting`。

如果状态为 `changes_requested` 且 `codeRound >= maxRounds`，推进到 `awaiting_final_confirm`，并设置 `terminationReason=max_rounds_reached`。

## 最终确认

先用中文向用户展示差异摘要、按轮次整理的代码评审结论、执行与修订记录、验证结果、剩余风险及终止原因，并用中文提问。只有用户明确确认后，才执行：

```bash
node .agents/skills/review-loop/scripts/advance-state.js \
  --task-id <task-id> \
  --event confirm-final
```

该操作会推进到 `done`。

转换比较当前 Git 树与已评审树，并校验 `diffs/code-diff-N.patch` 与绑定树完全一致。之后对被忽略的任务工作区评审或 coder 日志所做的编辑，本身不会阻塞最终确认；评审 patch 缺失或被修改时必须恢复原内容或重新开始评审。任何未忽略的仓库变化仍属于 Git 树漂移；优先开启新一轮代码评审，或者在用户接受变化时使用显式覆盖：

```bash
node .agents/skills/review-loop/scripts/advance-state.js \
  --task-id <task-id> \
  --event confirm-final \
  --accept-changed-inputs true \
  --override-reason "<接受未经评审代码变化的中文理由>"
```

覆盖记录会保存已评审/当前树以及变更路径。

如果用户拒绝已通过的最终结果，使用 `--event reject-final` 返回 `code_drafting`。在 `max_rounds_reached` 节点，必须先获得用户对更高上限的明确确认并使用 `set-max-rounds`；`reject-final` 不能绕过已配置上限。

## 增加 maxRounds

只有工作流因 `terminationReason=max_rounds_reached` 停止，且用户在当前消息中明确要求继续并给出具体的更高上限后，才可增加 `maxRounds`。不得把更早的“继续”等笼统指令复用为确认。执行：

```bash
node .agents/skills/review-loop/scripts/advance-state.js \
  --task-id <task-id> \
  --event set-max-rounds \
  --max-rounds <new-value> \
  --user-confirmed true
```

在达到上限前、缺少确认标记时，或新值不大于当前上限时，命令都会被拒绝。命令成功后会清除确认节点，并恢复对应的方案或代码起草阶段。

不得手动编辑 `state.json`。
