# Role Contracts

All roles are real subagents. The main agent orchestrates, prepares inputs, runs scripts, and asks the user for confirmation.

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
5. Output structured JSON only.

Output:

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
5. Output structured JSON only.

Output:

- `reviews/code-review-N.json`

## Shared Reviewer JSON Requirements

Reviewer JSON must follow `schemas/review.schema.json` and pass `scripts/validate-review-json.js`.

Use concise findings. Each finding must be actionable and must include a stable `id`.
