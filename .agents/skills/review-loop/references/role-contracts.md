# Role Contracts

Planner and coder are real subagents. Plan-reviewer and code-reviewer are role
contracts executed by fresh standalone reviewer CLI processes. The main agent
orchestrates, prepares inputs, runs scripts, and asks the user for confirmation.

## planner

Inputs:

- `goal.md`
- current `plan.md`
- latest `reviews/plan-review-N.json`, if any
- relevant repository instructions already available to the role

Responsibilities:

1. Produce or revise a practical technical plan.
2. Respond to reviewer findings one by one.
3. Record accepted, rejected, and partially accepted findings in `Plan Loop 修订记录`.
4. Avoid implementation work.
5. Prefer existing project flows and minimal changes.

Outputs:

- updated `plan.md`
- `logs/planner-N.md`

## plan-reviewer

Inputs:

- `goal.md`
- current `plan.md`
- previous plan reviews and revision records

Responsibilities:

1. Review the plan for correctness, completeness, stability, verifiability, and repository constraint risks.
2. Focus on boundary and exceptional cases, performance cost, elegance and simplicity, and reuse of existing project flows with consistent local style.
3. Do not repeat resolved findings.
4. Do not edit `plan.md`.
5. Return one strict JSON object to the orchestrator; do not write repository
   files. The orchestrator owns persistence and validation.
6. Start in a fresh context. Read `goal.md` and repository constraints first,
   then the plan; independently inspect every claimed impact path, full related
   functions, direct callers/consumers, adjacent implementations, and tests.
   Read earlier reviews and revision records last, only for deduplication.
7. On Codex and Claude Code, this role is launched by `run-reviewer.js` through
   a fresh, read-only CLI process with paths-only initial task input.
8. Construct at least one counterexample that could falsify a behavior
   assumption, and record review paths, symbol traces, checks, counterexamples,
   residual risks, and reviewer configuration in `evidence`.

Output returned to the orchestrator:

- `reviews/plan-review-N.json`

## coder

Inputs:

- user-confirmed `plan.md`
- latest `reviews/code-review-N.json`, if any
- current repository context

Responsibilities:

1. Implement the confirmed plan with the smallest practical code change.
2. Update `Code Loop 执行记录`.
3. Explain any deviation from the plan.
4. Run relevant validation commands and record results.
5. Update docs or related skills when the change affects user-facing behavior.

Outputs:

- source changes
- updated `plan.md`
- `logs/coder-N.md`

## code-reviewer

Inputs:

- `goal.md`
- user-confirmed `plan.md`
- current `diffs/code-diff-N.patch`
- validation results

Responsibilities:

1. Review code like an owner.
2. Prioritize bugs, behavior regressions, missing tests, repository rule violations, and plan mismatch.
3. Focus on boundary and exceptional cases, performance cost, elegance and simplicity, and reuse of existing project flows with consistent local style.
4. Do not edit source files.
5. Return one strict JSON object to the orchestrator; do not write repository
   files. The orchestrator owns persistence and validation.
6. Start in a fresh context. Read `goal.md`, repository constraints, cumulative
   diff, round delta, and scope metadata before the confirmed plan, coder log,
   or validation claims. Inspect full changed functions, direct
   callers/consumers, adjacent implementations, and relevant tests.
7. On Codex and Claude Code, this role is launched by `run-reviewer.js` through
   a fresh, read-only native review process with paths-only initial task input.
8. Check target behavior, plan mismatch, unexpected paths, whether tests cover
   the failure mode, and whether reported validation is credible. Construct at
   least one falsifying counterexample; for UI/platform work distinguish an
   intermediate value assertion from user-visible behavior.
9. Record all required `evidence`. Give every unexpected path an explicit
   disposition; do not approve while any disposition is `blocking`.

Output returned to the orchestrator:

- `reviews/code-review-N.json`

## Shared Reviewer JSON Requirements

Reviewer JSON must follow `schemas/review.schema.json`. `run-reviewer.js`
persists it only for the state-derived next round during the matching reviewing
phase. Persisted review artifacts are immutable;
new files use exclusive creation and only byte-identical retries against an
existing regular non-symlink file are accepted. The task workspace and
`reviews/` path components must also be canonical non-symlink directories. The
orchestrator advances state only with the current task's canonical regular
persisted review. Persistence, advancement, validation, and migration share
this path safety contract. Reviewer-run records bind every initial input to a
SHA-256 digest; code reviews additionally bind the validated snapshot tree.
Persisted reviews must also pass
`scripts/validate-review-json.js`.

Use concise findings. Each finding must be actionable and must include a stable `id`.
Approval is allowed without findings, but never without complete evidence.
The reviewer command must enforce a read-only sandbox before delegation. On
Codex and Claude Code the runner derives and overwrites `reviewerConfig` from
that command; reviewer self-reporting is not trusted. A role default or an
unverified claim is insufficient because host runtime settings may override it.
