# Claude Code Integration

Claude Code support uses real planner/coder subagents and standalone reviewer
CLI processes. Do not run planner or coder as single-agent roleplay.

## Role Discovery

Check project agents first:

```text
.claude/agents/planner.md
.claude/agents/coder.md
```

If both exist, reuse them. Reviewer instructions remain under
`templates/roles/` and are consumed by `run-reviewer.js`; do not create Claude
Code reviewer agents.

If either planner/coder role is missing, ask the user to choose:

- temporary roles under `.agent-workflows/review-loop/<task-id>/runtime/roles/`
- persistent project agents under `.claude/agents/`

Use `scripts/prepare-agent-roles.js` for either path. `auto` mode compares only
the planner and coder project roles with their generated definitions.

## Agent Format

Claude Code custom agents are Markdown files with YAML frontmatter:

```yaml
---
name: planner
description: Planner for review-loop workflows.
---
```

Planner and coder inherit the parent model, effort, tools, and permission mode.

## Temporary Roles

Temporary planner/coder roles are copied from `templates/roles/` to:

```text
.agent-workflows/review-loop/<task-id>/runtime/roles/
```

They are valid only for the current task. Claude Code automatically discovers
named agents only from its configured agent locations. Use temporary
definitions only when the host can register them for the current session.
Otherwise choose project roles.

## Persistent Roles

Persistent planner/coder roles are copied to:

```text
.claude/agents/
```

This requires explicit user confirmation because it modifies project-level
agent configuration. Reload manually created agent files with `/agents` or
restart the session before invoking them.

## Starting Roles

Start planner and coder as new named subagent invocations when required by the
state machine. Reviewers are started only through:

```bash
node .agents/skills/review-loop/scripts/run-reviewer.js \
  --task-id <task-id> \
  --kind plan|code \
  --round N
```

For plan review, the script starts a new `claude -p` process with a paths-only
review prompt. For code review, it starts a new `claude -p` process whose user
message invokes `/code-review high` against the cumulative round patch. The
native skill may use its own internal reviewer agents; the workflow does not
create or resume an outer reviewer subagent.

Both commands pin `model = opus`, `effort = high`,
`permission-mode = plan`, deny direct edit tools, omit `--fix`, and set
`--no-session-persistence`. They request `--output-format json` with
`--json-schema`; the runner extracts `structured_output`, validates it, writes
the immutable reviewer-run artifact, and persists the canonical review. Every
initial input is bound to a SHA-256 digest. Code reviews additionally bind and
revalidate the snapshot tree and patches before launch, after completion, and
during later state validation.

The runner derives `model = opus`, `reasoningEffort = high`, read-only mode, and
the plan/code-specific source from the command and overwrites
`evidence.reviewerConfig`; reviewer self-reporting is not trusted.

The fresh CLI process does not inherit the planner/coder conversation. It still
loads repository-visible Claude Code configuration and can inspect files in the
working tree. This is conversation isolation, not repository-read isolation.

Do not invoke `persist-review-json.js` directly for Claude Code reviews.

## Failure

If Claude Code cannot create real planner/coder subagents in the current
session, stop the workflow and tell the user:

```text
review-loop requires real planner/coder subagent support. Current Claude Code session cannot create subagents, so the workflow cannot continue.
```
