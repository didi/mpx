# Review Loop Protocol

Current protocol version: `2.0.0`.

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
    reviewer-runs/
```

`init-workspace.js --force` may replace initial files only before immutable
review history exists. If `reviews/` or `runtime/reviewer-runs/` is non-empty,
start a new task id instead of reusing the workspace.

Files:

- `goal.md`: original user request and constraints.
- `state.json`: machine-readable workflow state.
- `plan.md`: technical plan plus loop revision log.
- `reviews/*.json`: structured reviewer output.
- `diffs/*.patch`: code diff snapshots for each code loop round.
- `diffs/code-diff-N.patch`: cumulative task diff from the captured baseline.
- `diffs/code-round-N.patch`: changes introduced in code round N.
- `diffs/code-scope-N.json`: cumulative/round paths plus claimed and unexpected paths.
- `logs/*.md`: natural-language role logs.
- `runtime/roles/`: temporary role definitions for hosts that can register them;
  Codex project roles use `.codex/agents/`.
- `runtime/reviewer-runs/`: immutable review execution records. Each record
  binds one platform-native subagent, role, and round to paths-only initial
  input, every input digest, the Git tree, execution evidence, and the validated
  reviewer result.

## Reviewer Run Contract

After entering `plan_reviewing` or `code_reviewing`, run:

```bash
node .agents/skills/review-loop/scripts/review-manager.js \
  --task-id <task-id> \
  --kind plan|code \
  --round N \
  --prepare
```

Prepare freezes a paths-only request and returns the exact prompt for a fresh
host-native reviewer subagent. The orchestrator starts that role with no
inherited planner/coder conversation, stores its one strict JSON response in a
temporary file outside the repository, then runs:

```bash
node .agents/skills/review-loop/scripts/review-manager.js \
  --task-id <task-id> --kind plan|code --round N \
  --finalize --input <temporary-json> --agent-id <native-agent-id>
```

Finalize reconstructs the request and Git tree before writing exactly one
`runtime/reviewer-runs/{kind}-review-N.json` and the canonical review artifact.
Retries reuse a completed immutable run record instead of resuming a session.
Manual review persistence is rejected on both platforms.

If a reviewer-run exists but canonical review persistence is missing,
`check-recoverability.js` first revalidates the run against its bound inputs.
An unchanged valid run may be retried to complete persistence; stale or invalid
run evidence requires restarting the task. A code snapshot cannot be replaced
after its reviewer-run exists.

Prepare and finalize recompute every input digest and the worktree. Code reviews
also reconstruct the baseline/current trees, path
partitions, and both patches. State advancement revalidates the same request;
changed plans, reviewer instructions, prior reviews, coder logs, scope files,
patches, or code trees invalidate the completed run instead of reusing its
result against different content.

After a review is completed, confirmation gates use a narrower check suited to
normal interactive work. `confirm-plan` compares only `plan.md` with its
reviewed digest; `confirm-final` compares only the current Git tree with the
reviewed snapshot tree. Later task-workspace review-history, patch, scope, or
log edits do not retroactively invalidate the completed review. Non-ignored
repository changes remain Git tree drift. Changed plan/code is blocked by
default, but a current explicit user decision may pass
`--accept-changed-inputs true --override-reason <reason>`. The transition stores
the round, reviewed/current digest or tree, changed paths, reason, and timestamp
under `state.json.confirmationOverrides`. The immutable reviewer-run artifact
itself must still match the digest captured during review completion and cannot
be overridden.

During either confirmation phase, `check-recoverability.js` and
`validate-state.js` revalidate that immutable run, its stored digest, and the
canonical review artifact. Plan or Git-tree drift remains a user confirmation
decision; missing or altered reviewer evidence requires restarting the task.

This enforces conversation isolation through a fresh native subagent and guards
the no-write contract with Git-tree drift checks. It does not isolate repository
reads: the reviewer can inspect files visible to the host session.

## State Contract

`state.json` is owned by the scripts. Do not edit it manually.

```json
{
  "protocolVersion": "2.0.0",
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

`maxRounds` defaults to `3` and may be customized when initializing a task.
After initialization, it may be increased only from a
`max_rounds_reached` confirmation gate with explicit current user confirmation;
rejecting at that gate cannot resume drafting without the increase. See
`state-machine.md`. `validate-state.js` enforces an integer from `1` to `10`.

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
  "evidence": {
    "reviewedPaths": ["AGENTS.md", "src/example.js"],
    "tracedSymbols": [{"symbol": "example", "path": "src/example.js", "related": ["caller"]}],
    "checks": [{"command": "npm test -- example", "result": "passed"}],
    "counterexamples": [{"scenario": "empty input", "result": "handled"}],
    "diffScope": {
      "cumulativeDiff": "diffs/code-diff-1.patch",
      "roundDiff": "diffs/code-round-1.patch",
      "unexpectedPaths": [],
      "unexpectedDispositions": []
    },
    "residualRisks": [],
    "reviewerConfig": {"model": "host-selected", "reasoningEffort": "host-selected", "sandboxMode": "read-only", "source": "platform-native-subagent"}
  },
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
- `evidence` is required for both statuses. Evidence must name reviewed paths,
  traced symbols and related callers/consumers, checks, counterexamples, diff
  scope, residual risks, and the reviewer configuration.
- On Codex and Claude Code, finalize overwrites `evidence.reviewerConfig` with
  the host-native reviewer contract. Reviewer self-reporting is not trusted.
- Every unexpected path requires an `included`, `excluded`, or `blocking`
  disposition with a reason. An approval cannot contain a blocking disposition.

The orchestrator must start a fresh native reviewer with a no-write contract.
A reviewer returns exactly one JSON object and does not write repository files.
Prepare/finalize bind the Git tree and reject drift, normalize the host-native
configuration, validate, and persist that response. Persistence validates the expected
round, code scope, input digests, snapshot tree, and diff artifact references
before writing `reviews/*-review-N.json`, and is allowed only in the matching
reviewing phase for the next round derived from
`state.json`. An
existing review artifact is immutable unless the persisted content is
byte-identical, in which case the command is an idempotent retry.
New review artifacts are created exclusively. The task workspace and its
`reviews/` directory must both be the expected canonical non-symlink
directories, and existing artifacts must be regular non-symlink files. A
symlink is rejected whether it replaces the artifact or either checked parent
directory, even when it points to valid or byte-identical JSON. Persistence,
validation, migration, and state advancement use the same artifact-path safety
check. State advancement accepts only that current task's canonical regular
`reviews/{kind}-review-N.json` for the expected kind and round.

Use `scripts/validate-review-json.js` to revalidate an already persisted current
review. `--legacy-read-only` validates only the inspectable legacy shape and
reports `resumable: false`; it never upgrades a legacy review to current
evidence.

## Legacy Workspaces

Protocol `1.0.0` workspaces are read-only by default. Run
`scripts/check-recoverability.js` to inspect their state. Resume is allowed only
after `scripts/migrate-workspace.js` verifies all resume-critical baseline,
round, scope, and current evidence review artifacts. Any phase at or after
`awaiting_plan_confirm` requires the latest completed plan review to pass the
current evidence contract and be `approved`, unless its round reached
`maxRounds`. `awaiting_final_confirm` and `done` apply the equivalent gate to
the latest completed code review. Phase counters must also describe a reachable
state; in particular, confirmation phases require their corresponding
completed round, and plan phases cannot contain completed code rounds. A legacy
approval cannot satisfy the current evidence gate.
Codex and Claude Code workspaces already waiting at `awaiting_plan_confirm` or
`awaiting_final_confirm` cannot be migrated because protocol 1 has no immutable
reviewer-run artifact or digest for the pending confirmation. Migration leaves
these workspaces read-only; start a new task instead.
For a clean version 1 baseline, `head` must resolve to a commit and its tree;
any declared baseline tree must exist as a tree object and equal `head^{tree}`.
Dirty version 1 baselines remain non-reconstructable. A failed baseline check
leaves both the legacy state and protocol migration record unchanged.
Every completed code round, plus the current unreviewed round in
`code_reviewing`, must have full scope metadata: the four tree/head fields must
be non-empty strings and all path fields must be string arrays. Each scope's
`baselineHead` and `baselineTree` must match the reconstructed baseline; round
1 starts from that baseline tree, later `previousTree` values must equal the
preceding scope's `currentTree`, and every `currentTree` must exist as a Git
tree object. Every path-array entry must be non-empty after trimming and remain
repo-relative under platform-independent Git path semantics. POSIX absolute,
Windows rooted/drive absolute, drive-relative, UNC, and device paths are
rejected. Backslashes are treated as separators, then POSIX-normalized to the
slash representation used by Git; `.`, `..`, and `../` escapes are rejected.
Migration recomputes `cumulativePaths` from baseline-to-current trees and
`roundPaths` from previous-to-current trees; stored arrays must match those
sorted Git paths exactly. `claimedPaths` is the stored coder declaration and
`unexpectedPaths` is its complement over `roundPaths`: both arrays must be
unique, preserve `roundPaths` order, have no overlap, and together cover every
round path. `code-diff-N.patch` and `code-round-N.patch` must byte-exactly match
the Git diffs reconstructed from the same validated tree pairs. Any shape,
object, path, partition, patch, or chain failure leaves protocol 1 state
unchanged.
Successful migration records legacy historical reviews in
`runtime/protocol-migration.json` and upgrades `state.json` through that
controlled command. If reconstruction is unsafe, migration fails without
changing state; start a new task or reconstruct missing current-protocol
artifacts without presenting legacy approvals as evidence reviews.

## Round Records

Each planner/coder response to review findings must record:

- finding id
- accepted / rejected / partially accepted
- reason
- plan or code change summary

Rejected findings must not be silently dropped.
