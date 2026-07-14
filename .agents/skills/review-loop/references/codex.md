# Codex Integration

Codex support uses real planner/coder subagents and standalone ephemeral
`codex exec review` processes with JSON Schema output. Do not run planner or
coder as single-agent roleplay.

## Role Discovery

Check project custom agents first:

```text
.codex/agents/planner.toml
.codex/agents/coder.toml
```

If both exist, reuse them. Reviewer instructions remain under
`templates/roles/` and are read by `run-reviewer.js`; do not create reviewer
agent TOMLs.

If any are missing or stale, ask the user for permission to create or refresh
the project custom agents under `.codex/agents/`, then run
`scripts/prepare-agent-roles.js --mode project`. Codex discovers custom agents
only from its personal or project agent directories, so task-workspace
temporary roles are not supported.

## Persistent Agent Format

Codex custom agents are TOML files. Each file must define:

```toml
name = "planner"
description = "Planner for review-loop workflows."
developer_instructions = """
Read the review-loop workspace inputs and produce or revise plan.md.
Do not implement code.
"""
```

## Starting Roles

Codex does not spawn subagents without an explicit request. After roles are
prepared, the orchestrator must explicitly start planner and coder as the state
machine requires. Reviewers are started only through `scripts/run-reviewer.js`.

For each role, include:

- role name
- task id
- workspace path
- input files
- required output path
- instruction to return a concise summary to the orchestrator

After `planner-complete` or `coder-complete`, run the state-derived reviewer:

```bash
node .agents/skills/review-loop/scripts/run-reviewer.js \
  --task-id <task-id> \
  --kind plan|code \
  --round N
```

The script launches a new CLI process rather than resuming or forking the parent
conversation. It passes only fixed instructions plus state-derived repository
paths, records a SHA-256 digest for every initial input, explicitly selects a
read-only sandbox, validates the returned strict JSON, and writes both the
immutable run record and canonical review artifact. Code review runs also bind
the validated snapshot tree and fail if the worktree or patches drift.
Do not invoke `persist-review-json.js` directly for Codex reviews.

This isolates conversation history, not repository visibility. The reviewer can
read any file visible inside the repository's read-only sandbox.

`run-reviewer.js` pins `model = "gpt-5.6"`, uses
`--ephemeral --output-schema schemas/review.schema.json`,
`model_reasoning_effort = "high"`, and `sandbox_mode = "read-only"` on the
command line. Each review records those settings and
`source = "codex-exec-review-command"` in `evidence.reviewerConfig`. The runner
derives and overwrites this configuration from the actual command; reviewer
self-reporting is not trusted as audit evidence.

In `auto` mode, `prepare-agent-roles.js` compares the planner and coder project
roles with their current templates. A mismatch returns `stale_roles`; refresh
project roles explicitly before spawning planner or coder.

## Failure

If Codex cannot create real planner/coder subagents in the current session,
stop the workflow and tell the user:

```text
review-loop requires real planner/coder subagent support. Current Codex session cannot create subagents, so the workflow cannot continue.
```
