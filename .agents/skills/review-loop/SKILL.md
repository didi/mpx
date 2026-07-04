---
name: review-loop
description: Use this skill whenever the user asks for a review loop, self-review workflow, planner/reviewer/coder/code-reviewer collaboration, plan-before-code process, multi-round agent review, or a stable subagent workflow that must produce a plan, wait for user confirmation, implement code, review the diff, and preserve revision records. This skill requires real subagent support and must not fall back to single-agent roleplay.
protocolVersion: 1.0.0
---

# Review Loop

Use this skill to run a two-phase workflow:

1. Plan loop: `planner` writes or revises `plan.md`; `plan-reviewer` reviews it.
2. Code loop: after user confirmation, `coder` implements the confirmed plan; `code-reviewer` reviews the resulting diff.

The workflow requires real subagents. If the current environment cannot create real subagents, stop and tell the user that `review-loop` cannot run in this session.

## Required Setup

Before doing task work:

1. Read `references/protocol.md`, `references/state-machine.md`, and `references/role-contracts.md`.
2. Read `references/codex.md` or `references/claude-code.md` when that platform applies.
3. Create a task id.
4. Run `scripts/init-workspace.js` to create `.agent-workflows/review-loop/<task-id>/`.
5. Run `scripts/prepare-agent-roles.js` to prepare real subagent roles.
6. Run `scripts/validate-state.js` before advancing.

Default `maxRounds` is `3`. If the user specifies a maximum loop count, pass it to `init-workspace.js`.

## Hard Rules

- Do not implement code until the plan loop has ended and the user explicitly confirms the plan.
- Do not let reviewer roles modify `plan.md` or source files; reviewers write JSON review files only.
- Use `scripts/validate-review-json.js` after every reviewer output.
- Use `scripts/snapshot-diff.js` after every code loop implementation round.
- Use `scripts/advance-state.js` for every state transition; never hand-edit `state.json`.
- Stop a loop when the reviewer returns `approved` or when the loop reaches `state.json.maxRounds`.
- When a loop stops because `maxRounds` is reached, summarize remaining findings and ask the user whether to continue, accept, or revise.
- Preserve every round's revision record in `plan.md`.

## Subagent Roles

The four required roles are:

- `planner`
- `plan-reviewer`
- `coder`
- `code-reviewer`

Use the templates under `templates/roles/` to prepare role definitions. If project-level roles already exist, reuse them. If not, ask whether to create temporary roles under the task workspace or persist roles to the project agent config.

## User Confirmation Gates

After the plan loop ends, show the user:

- `plan.md` path
- plan loop termination reason
- review summary by round
- unaccepted findings and reasons

Ask whether to enter the code loop. Only after explicit confirmation, run `advance-state.js --event confirm-plan`.

After the code loop ends, show the user:

- `plan.md` path
- diff summary
- code loop termination reason
- validation commands and results
- remaining risks

Ask whether to accept the final result. Only after explicit confirmation, run `advance-state.js --event confirm-final`.
