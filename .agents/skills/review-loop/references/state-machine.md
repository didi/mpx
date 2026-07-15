# Review Loop State Machine

The orchestrator must use `scripts/advance-state.js` for state transitions.

## States

| Phase | Meaning | Next phase |
| --- | --- | --- |
| `plan_drafting` | planner writes or revises `plan.md` | `plan_reviewing` |
| `plan_reviewing` | plan-reviewer reviews `plan.md` | `plan_drafting` or `awaiting_plan_confirm` |
| `awaiting_plan_confirm` | waiting for user plan confirmation | `code_drafting` or `plan_drafting` |
| `code_drafting` | coder implements confirmed plan | `code_reviewing` |
| `code_reviewing` | code-reviewer reviews diff | `code_drafting` or `awaiting_final_confirm` |
| `awaiting_final_confirm` | waiting for final user confirmation | `done` or `code_drafting` |
| `done` | workflow complete | none |

Migration validates these phase invariants before upgrading a legacy
workspace: plan-only phases have `codeRound = 0`; code phases have at least one
completed plan round; final-confirmation and done phases have at least one
completed code round. The latest plan review supporting
`awaiting_plan_confirm` or a later phase, and the latest code review supporting
`awaiting_final_confirm` or `done`, must be approved or have reached
`maxRounds`. A `changes_requested` review below that limit cannot support a
confirmation phase.

## Plan Loop

1. `plan_drafting`: run `planner`.
2. Advance with `--event planner-complete`.
3. `plan_reviewing`: on Codex or Claude Code run
   `run-reviewer.js --kind plan --round N`. It starts a fresh read-only CLI
   process and persists the validated result.
4. Advance with `--event plan-review-complete --review <path>`.

If review status is `approved`, advance to `awaiting_plan_confirm`.

If status is `changes_requested` and `planRound < maxRounds`, advance back to `plan_drafting`.

If status is `changes_requested` and `planRound >= maxRounds`, advance to `awaiting_plan_confirm` with `terminationReason=max_rounds_reached`.

## Plan Confirmation

Only after explicit user confirmation:

```bash
node .agents/skills/review-loop/scripts/advance-state.js \
  --task-id <task-id> \
  --event confirm-plan
```

This advances to `code_drafting`.

The transition compares only the current `plan.md` with the reviewed plan
digest. Reviewer templates, schemas, prior reviews, and other non-plan inputs
may change without blocking confirmation. If the plan changed, prefer a new
plan round. When the user's current message explicitly accepts the manual
change, use:

```bash
node .agents/skills/review-loop/scripts/advance-state.js \
  --task-id <task-id> \
  --event confirm-plan \
  --accept-changed-inputs true \
  --override-reason "<why the unreviewed plan change is accepted>"
```

The override is recorded in `state.json.confirmationOverrides`.

If the user rejects an approved plan, use `--event reject-plan` and return to
`plan_drafting`. At a `max_rounds_reached` gate, first obtain explicit user
confirmation for a higher limit and use `set-max-rounds`; `reject-plan` cannot
bypass the configured limit.

## Code Loop

1. `code_drafting`: run `coder`.
2. Run relevant validations.
3. Run `snapshot-diff.js` for exactly `state.codeRound + 1`. Rerunning the
   current unreviewed round is allowed in `code_drafting`; it is also allowed in
   `code_reviewing` only to recover artifacts before an immutable reviewer-run
   or canonical review is persisted.
4. Advance with `--event coder-complete`. The transition rejects missing or
   mismatched current-round snapshot artifacts. It reconstructs the current
   Git tree, path partitions, cumulative patch, and round patch, so any code
   change after snapshotting requires rerunning `snapshot-diff.js`.
5. `code_reviewing`: on Codex or Claude Code run
   `run-reviewer.js --kind code --round N`. It starts a fresh read-only native
   review process and persists the validated result.
6. Advance with `--event code-review-complete --review <path>`.

If review status is `approved`, advance to `awaiting_final_confirm`.

If status is `changes_requested` and `codeRound < maxRounds`, advance back to `code_drafting`.

If status is `changes_requested` and `codeRound >= maxRounds`, advance to `awaiting_final_confirm` with `terminationReason=max_rounds_reached`.

## Final Confirmation

Only after explicit user confirmation:

```bash
node .agents/skills/review-loop/scripts/advance-state.js \
  --task-id <task-id> \
  --event confirm-final
```

This advances to `done`.

The transition compares only the current Git tree with the reviewed snapshot
tree. Later edits to ignored task-workspace patches, scope metadata, reviews,
or coder logs do not block final confirmation by themselves. Any non-ignored
repository change remains Git tree drift; prefer a new code round, or use the
explicit override when the user accepts it:

```bash
node .agents/skills/review-loop/scripts/advance-state.js \
  --task-id <task-id> \
  --event confirm-final \
  --accept-changed-inputs true \
  --override-reason "<why the unreviewed code change is accepted>"
```

The override records the reviewed/current trees and changed paths.

If the user rejects approved final output, use `--event reject-final` and
return to `code_drafting`. At a `max_rounds_reached` gate, first obtain explicit
user confirmation for a higher limit and use `set-max-rounds`; `reject-final`
cannot bypass the configured limit.

## Increasing maxRounds

Only increase `maxRounds` after the workflow has stopped with
`terminationReason=max_rounds_reached` and the user explicitly asks in the
current message to continue with a concrete higher limit. Do not reuse an
earlier general instruction such as "continue" as confirmation. Use:

```bash
node .agents/skills/review-loop/scripts/advance-state.js \
  --task-id <task-id> \
  --event set-max-rounds \
  --max-rounds <new-value> \
  --user-confirmed true
```

The command is rejected before the limit is reached, without the confirmation
flag, or when the new value is not greater than the current limit. A successful
command clears the confirmation gate and resumes the corresponding plan or
code drafting phase.

Do not edit `state.json` manually.
