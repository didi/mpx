---
name: review-loop
description: Use this skill whenever the user asks for a review loop, self-review workflow, planner/reviewer/coder/code-reviewer collaboration, plan-before-code process, multi-round agent review, or a stable subagent workflow that must produce a plan, wait for user confirmation, implement code, review the diff, and preserve revision records. This skill requires real subagent support and must not fall back to single-agent roleplay.
protocolVersion: 2.0.0
---

# Review Loop

Use this skill to run a two-phase workflow:

1. Plan loop: `planner` writes or revises `plan.md`; `plan-reviewer` reviews it.
2. Code loop: after user confirmation, `coder` implements the confirmed plan; `code-reviewer` reviews the resulting diff.

The workflow requires real planner and coder subagents. If the current
environment cannot create them, stop and tell the user that `review-loop`
cannot run in this session. Codex and Claude Code reviewers run as standalone
CLI processes instead of custom subagents.

## Required Setup

Before doing task work:

1. Read `references/protocol.md`, `references/state-machine.md`, and `references/role-contracts.md`.
2. Read `references/codex.md` or `references/claude-code.md` when that platform applies.
3. Create a task id.
4. Run `scripts/init-workspace.js` to create `.agent-workflows/review-loop/<task-id>/`.
5. Run `scripts/prepare-agent-roles.js` to prepare the platform's real subagent roles.
6. Run `scripts/validate-state.js` before advancing.

Default `maxRounds` is `3`. If the user specifies a maximum loop count, pass it to `init-workspace.js`.

## Hard Rules

- Do not implement code until the plan loop has ended and the user explicitly confirms the plan.
- Do not let reviewer roles modify repository files. Reviewers return one strict
  JSON object; the orchestrator persists and validates it with
  `scripts/persist-review-json.js`.
- Start every reviewer in a fresh context that does not inherit planner/coder conversation history.
- On Codex or Claude Code, enter the reviewing phase, then run
  `scripts/run-reviewer.js`. It starts a new read-only CLI process with
  state-derived paths, binds every initial input to a SHA-256 digest, writes an
  immutable `runtime/reviewer-runs/*` artifact, validates the strict JSON
  result, and persists the canonical review. Code reviews also bind the
  validated Git snapshot tree. Reviewing-phase advancement fails when any
  bound input, snapshot, or run artifact changes. Confirmation gates check only
  `plan.md` or the Git tree, so later task-workspace patch, scope, review, and
  log edits do not block normal work by themselves. Do not invoke
  `scripts/persist-review-json.js` directly on either platform.
- Use `scripts/validate-review-json.js` for later read-only revalidation.
- Use `scripts/snapshot-diff.js` after every code loop implementation round.
- `coder-complete` reconstructs the current Git tree, path partitions, and
  patches; rerun `snapshot-diff.js` if any code changes after snapshotting.
- Once the current code reviewer-run artifact exists, do not replace its bound
  snapshot even when canonical review persistence has not completed.
- Use `scripts/advance-state.js` for every state transition; never hand-edit `state.json`.
- Stop a loop when the reviewer returns `approved` or when the loop reaches `state.json.maxRounds`.
- When a loop stops because `maxRounds` is reached, summarize remaining findings and ask the user whether to continue, accept, or revise.
- If reviewed plan/code changes while waiting at a confirmation gate, prefer a
  new review round. Override only after the user's current message explicitly
  accepts the changed content; pass `--accept-changed-inputs true` with a
  non-empty `--override-reason`. The transition records the accepted drift in
  `state.json.confirmationOverrides`.
- Increase `maxRounds` only from that `max_rounds_reached` confirmation gate;
  rejecting at that gate cannot resume drafting until the limit is increased,
  after a current user message explicitly supplies a higher limit. Pass
  `--user-confirmed true`; never reuse an earlier general instruction to bypass
  the configured limit.
- Preserve every round's revision record in `plan.md`.

## Workflow Roles

The four required roles are:

- `planner`
- `plan-reviewer`
- `coder`
- `code-reviewer`

Use the templates under `templates/roles/` as role definitions. On Codex and
Claude Code, only `planner` and `coder` are custom subagents;
`plan-reviewer` and `code-reviewer` templates are consumed by
`run-reviewer.js`. Do not create reviewer agent definitions.

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
