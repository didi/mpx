# Review Loop Protocol

## Workspace

Each run uses an isolated workspace:

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
```

Files:

- `goal.md`: original user request and constraints.
- `state.json`: machine-readable workflow state.
- `plan.md`: technical plan plus loop revision log.
- `reviews/*.json`: structured reviewer output.
- `diffs/*.patch`: code diff snapshots for each code loop round.
- `logs/*.md`: natural-language role logs.
- `runtime/roles/`: temporary role definitions when project-level roles are absent.

## State Contract

`state.json` is owned by the scripts. Do not edit it manually.

```json
{
  "protocolVersion": "1.0.0",
  "taskId": "support-rn-xxx",
  "phase": "plan_drafting",
  "planRound": 0,
  "codeRound": 0,
  "maxRounds": 3,
  "planStatus": "drafting",
  "codeStatus": "pending",
  "awaitingUserConfirmation": false,
  "lastReviewFile": "",
  "terminationReason": "",
  "roleMode": "",
  "platform": ""
}
```

`maxRounds` defaults to `3`. It may be customized per task. `validate-state.js` enforces a positive integer, with the recommended range `1-10`.

## Plan Contract

`plan.md` is the main handoff artifact. It must retain history instead of replacing past rounds.

Required sections:

```markdown
# 需求目标

# 背景与约束

# 技术方案

# 影响范围

# 验证方案

# 风险与回滚

# Plan Loop 修订记录

# Code Loop 执行记录
```

`planner` may update the technical plan and `Plan Loop 修订记录`. `coder` may update `Code Loop 执行记录` and may correct the plan when implementation reveals a mismatch, but must explain the reason.

Reviewers must not edit `plan.md`.

## Review JSON Contract

Reviewer output must be JSON:

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

Rules:

- `status` is `approved` or `changes_requested`.
- `severity` is `critical`, `major`, `minor`, or `nit`.
- `approved` requires an empty `findings` array.
- `changes_requested` requires at least one finding whose severity is not `nit`.
- `nit` never blocks loop termination.

Run `scripts/validate-review-json.js` after every reviewer output.

## Round Records

Each planner/coder response to review findings must record:

- finding id
- accepted / rejected / partially accepted
- reason
- plan or code change summary

Rejected findings must not be silently dropped.
