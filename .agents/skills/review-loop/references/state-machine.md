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

## Plan Loop

1. `plan_drafting`: run `planner`.
2. Advance with `--event planner-complete`.
3. `plan_reviewing`: run `plan-reviewer`.
4. Validate review JSON.
5. Advance with `--event plan-review-complete --review <path>`.

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

If the user rejects the plan, use `--event reject-plan` and return to `plan_drafting`.

## Code Loop

1. `code_drafting`: run `coder`.
2. Run relevant validations.
3. Run `snapshot-diff.js`.
4. Advance with `--event coder-complete`.
5. `code_reviewing`: run `code-reviewer`.
6. Validate review JSON.
7. Advance with `--event code-review-complete --review <path>`.

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

If the user rejects final output, use `--event reject-final` and return to `code_drafting`.

## Increasing maxRounds

If the user asks to continue after hitting `maxRounds`, use:

```bash
node .agents/skills/review-loop/scripts/advance-state.js \
  --task-id <task-id> \
  --event set-max-rounds \
  --max-rounds <new-value>
```

Do not edit `state.json` manually.
