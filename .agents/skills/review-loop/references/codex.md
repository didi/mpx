# Codex Integration

Codex support requires real subagents. Do not run this workflow as single-agent roleplay.

## Role Discovery

Check project custom agents first:

```text
.codex/agents/planner.toml
.codex/agents/plan-reviewer.toml
.codex/agents/coder.toml
.codex/agents/code-reviewer.toml
```

If all four exist, reuse them.

If any are missing, ask the user to choose:

- temporary roles under `.agent-workflows/review-loop/<task-id>/runtime/roles/`
- persistent project custom agents under `.codex/agents/`

Use `scripts/prepare-agent-roles.js` for either path.

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

Codex does not spawn subagents without an explicit request. After roles are prepared, the orchestrator must explicitly start the four role subagents as the state machine requires.

For each role, include:

- role name
- task id
- workspace path
- input files
- required output path
- instruction to return a concise summary to the orchestrator

## Failure

If Codex cannot create real subagents in the current session, stop the workflow and tell the user:

```text
review-loop requires real subagent support. Current Codex session cannot create subagents, so the workflow cannot continue.
```
