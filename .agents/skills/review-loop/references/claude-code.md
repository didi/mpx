# Claude Code Integration

Claude Code support requires real subagents. Do not run this workflow as single-agent roleplay.

## Role Discovery

Check project agents first:

```text
.claude/agents/planner.md
.claude/agents/plan-reviewer.md
.claude/agents/coder.md
.claude/agents/code-reviewer.md
```

If all four exist, reuse them.

If any are missing, ask the user to choose:

- temporary roles under `.agent-workflows/review-loop/<task-id>/runtime/roles/`
- persistent project agents under `.claude/agents/`

Use `scripts/prepare-agent-roles.js` for either path.

## Temporary Roles

Temporary roles are copied from `templates/roles/` to:

```text
.agent-workflows/review-loop/<task-id>/runtime/roles/
```

They are valid only for the current task.

## Persistent Roles

Persistent roles are copied from `templates/roles/` to:

```text
.claude/agents/
```

This requires explicit user confirmation because it modifies project-level agent configuration.

## Failure

If Claude Code cannot create real subagents in the current session, stop the workflow and tell the user:

```text
review-loop requires real subagent support. Current Claude Code session cannot create subagents, so the workflow cannot continue.
```
