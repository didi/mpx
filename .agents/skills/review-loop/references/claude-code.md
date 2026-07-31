# Claude Code Integration

Claude Code support uses real native subagents for `planner`, `plan-reviewer`,
`coder`, and `code-reviewer`. Do not run any role as single-agent roleplay and
do not start standalone `claude -p` reviewer processes.

## Role Discovery

Prepare all four roles with `scripts/prepare-agent-roles.js` either as temporary
task roles or project agents:

```text
.claude/agents/planner.md
.claude/agents/plan-reviewer.md
.claude/agents/coder.md
.claude/agents/code-reviewer.md
```

Temporary roles are valid only when the host can register them for the current
session. Project roles require explicit user confirmation and a `/agents`
reload or session restart.

## Starting Roles

Start planner and coder as new named native subagents when required by the
state machine. Start reviewers through Claude Code's native Agent/Task tool as
new tasks with no resumed session or inherited planner/coder conversation.
Restrict reviewer tools to read-only inspection when the host supports tool
allow/deny configuration.

For a reviewer round:

1. Run `review-manager.js --task-id <id> --kind plan|code --round N --prepare`.
2. Pass the returned prompt unchanged to the matching reviewer role.
3. Require the reviewer to run its context-isolation preflight before reading
   repository files and return exactly one JSON object with no repository writes.
4. Save the response to a temporary file outside the repository.
5. Run `review-manager.js ... --finalize --input <file> --agent-id <id>`.

Prepare binds input digests and the current Git tree. Finalize reconstructs the
request and rejects input, snapshot, or worktree drift before writing the
immutable reviewer-run and canonical review. The orchestrator normalizes
`reviewerConfig` to the host-native contract with source
`claude-native-subagent`; it does not trust reviewer self-reporting.
Finalize also rejects output that lacks the exact passed
`context-isolation-preflight` evidence. This self-check supplements, but does
not replace, starting a new native task without a resumed session.

## Failure

If Claude Code cannot create fresh native subagents, stop the workflow and
report that review-loop requires native planner, reviewer, and coder subagent
support.
