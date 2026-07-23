# Codex Integration

Codex support uses real native subagents for `planner`, `plan-reviewer`,
`coder`, and `code-reviewer`. Do not run any role as single-agent roleplay and
do not start a nested `codex exec` process.

## Role Discovery

Prepare these project agents with `scripts/prepare-agent-roles.js --mode project`:

```text
.codex/agents/planner.toml
.codex/agents/plan-reviewer.toml
.codex/agents/coder.toml
.codex/agents/code-reviewer.toml
```

In `auto` mode the preparation script verifies all four definitions. Ask before
creating or refreshing project agent files.

## Starting Roles

Start planner and coder as named native subagents when required by the state
machine. Start every reviewer with `spawn_agent` and `fork_turns: "none"` so it
does not inherit planner, coder, or orchestrator conclusions.

For a reviewer round:

1. Run `review-manager.js --task-id <id> --kind plan|code --round N --prepare`.
2. Pass the returned prompt unchanged to the matching reviewer role.
3. Require the reviewer to run its context-isolation preflight before reading
   repository files and return exactly one JSON object with no repository writes.
4. Save the response to a temporary file outside the repository.
5. Run `review-manager.js ... --finalize --input <file> --agent-id <id>`.

Prepare binds the input digests and current Git tree. Finalize reconstructs the
request and rejects any input, snapshot, or worktree drift before writing the
immutable reviewer-run and canonical review.
Finalize also rejects output that lacks the exact passed
`context-isolation-preflight` evidence. This self-check supplements, but does
not replace, `fork_turns: "none"`.

Codex native subagents do not currently expose a per-agent sandbox override.
The reviewer role is therefore a no-write contract backed by Git-tree drift
validation, not a separately enforced OS sandbox. `reviewerConfig` records
`model = host-selected`, `reasoningEffort = host-selected`,
`sandboxMode = read-only`, and `source = codex-native-subagent`; these describe
the host-native review contract and do not claim a pinned CLI model.

## Failure

If Codex cannot create fresh native subagents, stop the workflow and report
that review-loop requires native planner, reviewer, and coder subagent support.
