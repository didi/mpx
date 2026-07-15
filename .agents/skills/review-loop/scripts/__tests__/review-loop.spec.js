'use strict'

const childProcess = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const reviewManager = require('../review-manager')
const u = require('../review-loop-utils')

function evidence (round) {
  round = round || 1
  return {
    reviewedPaths: ['AGENTS.md', 'src/example.js'],
    tracedSymbols: [{ symbol: 'example', path: 'src/example.js', related: ['caller'] }],
    checks: [
      {
        command: 'context-isolation-preflight',
        result: 'passed: no parent planner/coder/orchestrator conversation visible'
      },
      { command: 'npm test -- example', result: 'passed' }
    ],
    counterexamples: [{ scenario: 'empty input', result: 'handled' }],
    diffScope: {
      cumulativeDiff: 'diffs/code-diff-' + round + '.patch',
      roundDiff: 'diffs/code-round-' + round + '.patch',
      unexpectedPaths: [],
      unexpectedDispositions: []
    },
    residualRisks: [],
    reviewerConfig: { model: 'gpt-5.6-sol', reasoningEffort: 'high', sandboxMode: 'read-only', source: 'role' }
  }
}

function review (status, round) {
  round = round || 1
  const value = {
    round: round,
    status: status || 'approved',
    summary: 'Review completed with repository evidence.',
    findings: [],
    evidence: evidence(round)
  }
  if (status === 'changes_requested') {
    value.findings.push({
      id: 'P1',
      severity: 'major',
      category: 'correctness',
      target: 'src/example.js',
      comment: 'The reviewed behavior is incomplete.',
      suggestion: 'Complete the behavior before advancing.'
    })
  }
  return value
}

function writeTask (repo, taskId, state) {
  const taskDir = path.join(repo, '.agent-workflows', 'review-loop', taskId)
  ;['reviews', 'diffs', 'logs', path.join('runtime', 'roles')].forEach(function (dir) {
    fs.mkdirSync(path.join(taskDir, dir), { recursive: true })
  })
  fs.writeFileSync(path.join(taskDir, 'goal.md'), '# Goal\n')
  fs.writeFileSync(path.join(taskDir, 'plan.md'), '# Plan\n')
  fs.writeFileSync(path.join(taskDir, 'state.json'), JSON.stringify(state))
  return taskDir
}

function writeReviewerInputs (repo) {
  const skillDir = path.join(repo, '.agents', 'skills', 'review-loop')
  fs.mkdirSync(path.join(skillDir, 'templates', 'roles'), { recursive: true })
  fs.mkdirSync(path.join(skillDir, 'schemas'), { recursive: true })
  ;['plan-reviewer.md', 'code-reviewer.md'].forEach(function (file) {
    fs.copyFileSync(
      path.resolve(__dirname, '..', '..', 'templates', 'roles', file),
      path.join(skillDir, 'templates', 'roles', file)
    )
  })
  fs.copyFileSync(
    path.resolve(__dirname, '..', '..', 'schemas', 'review.schema.json'),
    path.join(skillDir, 'schemas', 'review.schema.json')
  )
}

function fakeCodexEnv (repo, output, summaryBytes) {
  const binDir = path.join(repo, 'bin')
  const logFile = path.join(repo, 'codex-review-call.json')
  const bin = path.join(binDir, 'codex')
  fs.mkdirSync(binDir)
  fs.writeFileSync(bin, [
    '#!/usr/bin/env node',
    "'use strict'",
    "const fs = require('fs')",
    'fs.writeFileSync(process.env.FAKE_CODEX_LOG, JSON.stringify({',
    '  args: process.argv.slice(2),',
    "  input: fs.readFileSync(0, 'utf8')",
    '}))',
    'const output = JSON.parse(process.env.FAKE_CODEX_OUTPUT)',
    "if (process.env.FAKE_CODEX_SUMMARY_BYTES) output.summary = 'x'.repeat(Number(process.env.FAKE_CODEX_SUMMARY_BYTES))",
    'process.stdout.write(JSON.stringify(output))',
    ''
  ].join('\n'))
  fs.chmodSync(bin, 0o755)
  const env = Object.assign({}, process.env, {
    PATH: binDir + path.delimiter + process.env.PATH,
    FAKE_CODEX_LOG: logFile,
    FAKE_CODEX_OUTPUT: JSON.stringify(output)
  })
  if (summaryBytes) env.FAKE_CODEX_SUMMARY_BYTES = String(summaryBytes)
  return {
    env: env,
    logFile: logFile
  }
}

function fakeClaudeEnv (repo, output) {
  const binDir = path.join(repo, 'bin')
  const logFile = path.join(repo, 'claude-review-call.json')
  const bin = path.join(binDir, 'claude')
  fs.mkdirSync(binDir)
  fs.writeFileSync(bin, [
    '#!/usr/bin/env node',
    "'use strict'",
    "const fs = require('fs')",
    'fs.writeFileSync(process.env.FAKE_CLAUDE_LOG, JSON.stringify({',
    '  args: process.argv.slice(2),',
    "  input: fs.readFileSync(0, 'utf8')",
    '}))',
    'process.stdout.write(JSON.stringify({',
    "  type: 'result',",
    "  subtype: 'success',",
    '  structured_output: JSON.parse(process.env.FAKE_CLAUDE_OUTPUT)',
    '}))',
    ''
  ].join('\n'))
  fs.chmodSync(bin, 0o755)
  return {
    env: Object.assign({}, process.env, {
      PATH: binDir + path.delimiter + process.env.PATH,
      FAKE_CLAUDE_LOG: logFile,
      FAKE_CLAUDE_OUTPUT: JSON.stringify(output)
    }),
    logFile: logFile
  }
}

function writeCleanBaseline (repo, taskDir) {
  childProcess.execFileSync('git', ['init', '-q'], { cwd: repo })
  childProcess.execFileSync('git', ['config', 'user.email', 'review-loop@example.com'], { cwd: repo })
  childProcess.execFileSync('git', ['config', 'user.name', 'Review Loop'], { cwd: repo })
  fs.writeFileSync(path.join(repo, '.gitignore'), '.agent-workflows/\nbin/\n*-review-call.json\n')
  fs.writeFileSync(path.join(repo, 'tracked.txt'), 'initial\n')
  childProcess.execFileSync('git', ['add', '-A'], { cwd: repo })
  childProcess.execFileSync('git', ['commit', '-qm', 'initial'], { cwd: repo })
  const head = childProcess.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim()
  const baselineDir = path.join(taskDir, 'runtime', 'baseline')
  fs.mkdirSync(baselineDir)
  fs.writeFileSync(path.join(baselineDir, 'manifest.json'), JSON.stringify({
    version: 1,
    head: head,
    tree: childProcess.execFileSync('git', ['rev-parse', head + '^{tree}'], {
      cwd: repo,
      encoding: 'utf8'
    }).trim(),
    entries: []
  }))
}

function codeScope (taskDir, round, previousTree, currentTree) {
  const baseline = JSON.parse(fs.readFileSync(path.join(taskDir, 'runtime', 'baseline', 'manifest.json')))
  return {
    round: round,
    baselineHead: baseline.head,
    baselineTree: baseline.tree,
    previousTree: previousTree,
    currentTree: currentTree,
    cumulativePaths: [],
    roundPaths: [],
    claimedPaths: [],
    unexpectedPaths: []
  }
}

function writeCodeReviewRound (taskDir, round, value, scope) {
  ;['code-diff-', 'code-round-'].forEach(function (prefix) {
    fs.writeFileSync(path.join(taskDir, 'diffs', prefix + round + '.patch'), '')
  })
  fs.writeFileSync(path.join(taskDir, 'diffs', 'code-scope-' + round + '.json'), JSON.stringify(scope))
  fs.writeFileSync(path.join(taskDir, 'reviews', 'code-review-' + round + '.json'), JSON.stringify(value))
}

function writeMigratableCodeTask (repo) {
  const taskDir = writeTask(repo, 'test-task', {
    protocolVersion: '1.0.0',
    taskId: 'test-task',
    phase: 'code_drafting',
    planRound: 1,
    codeRound: 1,
    maxRounds: 3
  })
  writeCleanBaseline(repo, taskDir)
  const baseline = JSON.parse(fs.readFileSync(path.join(taskDir, 'runtime', 'baseline', 'manifest.json')))
  fs.writeFileSync(path.join(taskDir, 'reviews', 'plan-review-1.json'), JSON.stringify(review()))
  const scope = codeScope(taskDir, 1, baseline.tree, baseline.tree)
  writeCodeReviewRound(taskDir, 1, review(), scope)
  return { taskDir: taskDir, scope: scope }
}

function writeSnapshotRound (repo, taskDir, round, paths) {
  const stateFile = path.join(taskDir, 'state.json')
  const state = JSON.parse(fs.readFileSync(stateFile))
  state.protocolVersion = u.protocolVersion
  state.phase = 'code_drafting'
  state.codeRound = round - 1
  fs.writeFileSync(stateFile, JSON.stringify(state))
  fs.writeFileSync(path.join(taskDir, 'runtime', 'code-round-' + round + '-paths.json'), JSON.stringify({
    round: round,
    paths: paths
  }))
  const script = path.resolve(__dirname, '..', 'snapshot-diff.js')
  childProcess.execFileSync('node', [script, '--task-id', 'test-task', '--round', String(round)], {
    cwd: repo,
    encoding: 'utf8'
  })
  return JSON.parse(fs.readFileSync(path.join(taskDir, 'diffs', 'code-scope-' + round + '.json')))
}

function writeMigratableChangedCodeTask (repo) {
  const taskDir = writeTask(repo, 'test-task', {
    protocolVersion: u.protocolVersion,
    taskId: 'test-task',
    phase: 'code_drafting',
    planRound: 1,
    codeRound: 0,
    maxRounds: 3
  })
  writeCleanBaseline(repo, taskDir)
  fs.writeFileSync(path.join(taskDir, 'reviews', 'plan-review-1.json'), JSON.stringify(review()))
  fs.writeFileSync(path.join(repo, 'tracked.txt'), 'changed\n')
  const scope = writeSnapshotRound(repo, taskDir, 1, ['tracked.txt'])
  fs.writeFileSync(path.join(taskDir, 'reviews', 'code-review-1.json'), JSON.stringify(review()))
  const stateFile = path.join(taskDir, 'state.json')
  const state = JSON.parse(fs.readFileSync(stateFile))
  state.protocolVersion = '1.0.0'
  state.phase = 'code_drafting'
  state.codeRound = 1
  fs.writeFileSync(stateFile, JSON.stringify(state))
  return { taskDir: taskDir, scope: scope }
}

function writeMigratableCurrentCodeTask (repo) {
  const fixture = writeMigratableCodeTask(repo)
  fs.writeFileSync(path.join(repo, 'tracked.txt'), 'round two\n')
  const scope = writeSnapshotRound(repo, fixture.taskDir, 2, [])
  const stateFile = path.join(fixture.taskDir, 'state.json')
  const state = JSON.parse(fs.readFileSync(stateFile))
  state.protocolVersion = '1.0.0'
  state.phase = 'code_reviewing'
  state.codeRound = 1
  fs.writeFileSync(stateFile, JSON.stringify(state))
  return { taskDir: fixture.taskDir, scope: scope }
}

describe.skip('legacy CLI review runner isolation', function () {
  test('distinguishes recoverable and stale reviewer runs when canonical persistence is missing', function () {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-recover-run-'))
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: u.protocolVersion,
      taskId: 'test-task',
      phase: 'plan_reviewing',
      planRound: 0,
      codeRound: 0,
      platform: 'codex'
    })
    writeReviewerInputs(repo)
    const fake = fakeCodexEnv(repo, review())
    const run = path.resolve(__dirname, '..', 'review-manager.js')
    childProcess.execFileSync('node', [
      run, '--task-id', 'test-task', '--kind', 'plan', '--round', '1'
    ], { cwd: repo, env: fake.env, encoding: 'utf8' })
    fs.rmSync(path.join(taskDir, 'reviews', 'plan-review-1.json'))

    const recover = path.resolve(__dirname, '..', 'check-recoverability.js')
    expect(JSON.parse(childProcess.execFileSync('node', [
      recover, '--task-id', 'test-task'
    ], { cwd: repo, encoding: 'utf8' }))).toEqual(expect.objectContaining({
      ok: false,
      action: 'rerun_current_round'
    }))

    fs.appendFileSync(path.join(taskDir, 'plan.md'), '\nChanged after the reviewer completed.\n')
    expect(JSON.parse(childProcess.execFileSync('node', [
      recover, '--task-id', 'test-task'
    ], { cwd: repo, encoding: 'utf8' }))).toEqual(expect.objectContaining({
      ok: false,
      action: 'restart_task',
      reason: expect.stringMatching(/request must exactly match/)
    }))
    fs.rmSync(repo, { recursive: true, force: true })
  })

  test('accepts reviewer output larger than the spawnSync default buffer', function () {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-spawn-buffer-'))
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: u.protocolVersion,
      taskId: 'test-task',
      phase: 'plan_reviewing',
      planRound: 0,
      codeRound: 0,
      platform: 'codex'
    })
    writeReviewerInputs(repo)
    const summaryBytes = 1024 * 1024 + 1
    const fake = fakeCodexEnv(repo, review(), summaryBytes)
    const run = path.resolve(__dirname, '..', 'review-manager.js')

    childProcess.execFileSync('node', [
      run, '--task-id', 'test-task', '--kind', 'plan', '--round', '1'
    ], { cwd: repo, env: fake.env, encoding: 'utf8' })

    expect(JSON.parse(
      fs.readFileSync(path.join(taskDir, 'reviews', 'plan-review-1.json'), 'utf8')
    ).summary).toHaveLength(summaryBytes)
    fs.rmSync(repo, { recursive: true, force: true })
  })

  test('runs a fresh read-only codex review with paths-only input', function () {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-spawn-plan-'))
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: u.protocolVersion,
      taskId: 'test-task',
      phase: 'plan_drafting',
      planRound: 0,
      codeRound: 0,
      maxRounds: 3,
      planStatus: 'drafting',
      codeStatus: 'pending',
      awaitingUserConfirmation: false,
      lastReviewFile: '',
      terminationReason: '',
      platform: 'codex'
    })
    writeReviewerInputs(repo)
    const advance = path.resolve(__dirname, '..', 'advance-state.js')
    childProcess.execFileSync('node', [
      advance, '--task-id', 'test-task', '--event', 'planner-complete'
    ], { cwd: repo, encoding: 'utf8' })

    const fake = fakeCodexEnv(repo, review())
    const run = path.resolve(__dirname, '..', 'review-manager.js')
    const output = JSON.parse(childProcess.execFileSync('node', [
      run, '--task-id', 'test-task', '--kind', 'plan', '--round', '1'
    ], { cwd: repo, env: fake.env, encoding: 'utf8' }))
    expect(output.runner).toBe('codex exec review')
    expect(output.status).toBe('approved')

    const call = JSON.parse(fs.readFileSync(fake.logFile, 'utf8'))
    expect(call.args).toEqual([
      '--sandbox', 'read-only',
      '--model', 'gpt-5.6-sol',
      '--config', 'model_reasoning_effort="high"',
      'exec', 'review',
      '--ephemeral',
      '--output-schema', '.agents/skills/review-loop/schemas/review.schema.json',
      '-'
    ])
    expect(call.input).toContain('.agents/skills/review-loop/templates/roles/plan-reviewer.md')
    expect(call.input).toContain('.agent-workflows/review-loop/test-task/plan.md')
    expect(call.input).not.toContain('# Plan')

    const runFile = path.join(taskDir, 'runtime', 'reviewer-runs', 'plan-review-1.json')
    const artifact = JSON.parse(fs.readFileSync(runFile, 'utf8'))
    expect(artifact.request).toEqual(expect.objectContaining({
      platform: 'codex',
      role: 'plan-reviewer',
      runner: 'codex exec review',
      initialMessagePolicy: 'paths-only'
    }))
    expect(artifact.request.inputs).toEqual([
      '.agents/skills/review-loop/templates/roles/plan-reviewer.md',
      '.agents/skills/review-loop/schemas/review.schema.json',
      '.agent-workflows/review-loop/test-task/goal.md',
      '.agent-workflows/review-loop/test-task/plan.md'
    ])
    expect(artifact.request.inputDigests).toHaveLength(artifact.request.inputs.length)
    expect(artifact.request.inputDigests.every(function (item) {
      return item.sha256.length === 64
    })).toBe(true)
    expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'reviews', 'plan-review-1.json'))).evidence.reviewerConfig).toEqual(
      reviewManager.reviewerConfig('codex', 'plan')
    )

    const planFile = path.join(taskDir, 'plan.md')
    const plan = fs.readFileSync(planFile, 'utf8')
    fs.appendFileSync(planFile, '\nChanged after review.\n')
    expect(function () {
      childProcess.execFileSync('node', [
        advance, '--task-id', 'test-task', '--event', 'plan-review-complete',
        '--review', path.join(taskDir, 'reviews', 'plan-review-1.json')
      ], { cwd: repo, encoding: 'utf8' })
    }).toThrow(/request must exactly match the state-derived reviewer invocation/)
    fs.writeFileSync(planFile, plan)

    artifact.review.evidence.reviewerConfig.model = 'incorrect-model'
    fs.writeFileSync(runFile, JSON.stringify(artifact, null, 2) + '\n')
    expect(function () {
      childProcess.execFileSync('node', [
        advance, '--task-id', 'test-task', '--event', 'plan-review-complete',
        '--review', path.join(taskDir, 'reviews', 'plan-review-1.json')
      ], { cwd: repo, encoding: 'utf8' })
    }).toThrow(/state-derived reviewer configuration/)
    artifact.review.evidence.reviewerConfig = reviewManager.reviewerConfig('codex', 'plan')
    artifact.request.command[1] = '--yolo'
    fs.writeFileSync(runFile, JSON.stringify(artifact, null, 2) + '\n')
    expect(function () {
      childProcess.execFileSync('node', [
        advance, '--task-id', 'test-task', '--event', 'plan-review-complete',
        '--review', path.join(taskDir, 'reviews', 'plan-review-1.json')
      ], { cwd: repo, encoding: 'utf8' })
    }).toThrow(/must exactly match the state-derived reviewer invocation/)
    artifact.request.command[1] = '--sandbox'
    fs.writeFileSync(runFile, JSON.stringify(artifact, null, 2) + '\n')
    childProcess.execFileSync('node', [
      advance, '--task-id', 'test-task', '--event', 'plan-review-complete',
      '--review', path.join(taskDir, 'reviews', 'plan-review-1.json')
    ], { cwd: repo, encoding: 'utf8' })
    const confirmedState = JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json')))
    const runContent = fs.readFileSync(runFile)
    fs.rmSync(runFile)
    const recover = path.resolve(__dirname, '..', 'check-recoverability.js')
    expect(JSON.parse(childProcess.execFileSync('node', [
      recover, '--task-id', 'test-task'
    ], { cwd: repo, encoding: 'utf8' }))).toEqual(expect.objectContaining({
      ok: false,
      action: 'restart_task',
      phase: 'awaiting_plan_confirm'
    }))
    const validateState = path.resolve(__dirname, '..', 'validate-state.js')
    expect(function () {
      childProcess.execFileSync('node', [validateState, '--task-id', 'test-task'], {
        cwd: repo,
        encoding: 'utf8'
      })
    }).toThrow(/Reviewer run artifact does not exist/)
    fs.writeFileSync(runFile, runContent)
    fs.appendFileSync(
      path.join(repo, '.agents', 'skills', 'review-loop', 'templates', 'roles', 'plan-reviewer.md'),
      '\nUpdated after review.\n'
    )
    const originalCwd = process.cwd()
    process.chdir(repo)
    try {
      expect(reviewManager.confirmationDrift(confirmedState, 'test-task', 'plan', 1).changed).toBe(false)
    } finally {
      process.chdir(originalCwd)
    }
    fs.appendFileSync(planFile, '\nChanged before confirmation.\n')
    expect(function () {
      childProcess.execFileSync('node', [
        advance, '--task-id', 'test-task', '--event', 'confirm-plan'
      ], { cwd: repo, encoding: 'utf8' })
    }).toThrow(/Reviewed plan content changed before confirmation/)
    expect(function () {
      childProcess.execFileSync('node', [
        advance, '--task-id', 'test-task', '--event', 'confirm-plan',
        '--accept-changed-inputs', 'true'
      ], { cwd: repo, encoding: 'utf8' })
    }).toThrow(/require a non-empty --override-reason/)
    childProcess.execFileSync('node', [
      advance, '--task-id', 'test-task', '--event', 'confirm-plan',
      '--accept-changed-inputs', 'true', '--override-reason', 'User accepts the manual plan correction.'
    ], { cwd: repo, encoding: 'utf8' })
    const overridden = JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json')))
    expect(overridden.phase).toBe('code_drafting')
    expect(overridden.confirmationOverrides).toEqual([expect.objectContaining({
      kind: 'plan',
      round: 1,
      reason: 'User accepts the manual plan correction.',
      changedPaths: ['.agent-workflows/review-loop/test-task/plan.md']
    })])
    fs.rmSync(repo, { recursive: true, force: true })
  })

  test('runs Claude plan review in a fresh structured print session', function () {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-claude-plan-'))
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: u.protocolVersion,
      taskId: 'test-task',
      phase: 'plan_reviewing',
      planRound: 0,
      codeRound: 0,
      platform: 'claude-code'
    })
    writeReviewerInputs(repo)
    const fake = fakeClaudeEnv(repo, review())
    const run = path.resolve(__dirname, '..', 'review-manager.js')
    const output = JSON.parse(childProcess.execFileSync('node', [
      run, '--task-id', 'test-task', '--kind', 'plan', '--round', '1'
    ], { cwd: repo, env: fake.env, encoding: 'utf8' }))
    expect(output.runner).toBe('claude -p')
    expect(output.status).toBe('approved')

    const call = JSON.parse(fs.readFileSync(fake.logFile, 'utf8'))
    expect(call.args).toEqual(expect.arrayContaining([
      '-p',
      '--no-session-persistence',
      '--model', 'opus',
      '--effort', 'high',
      '--permission-mode', 'plan',
      '--disallowedTools', 'Edit,Write,NotebookEdit',
      '--output-format', 'json'
    ]))
    expect(call.args[call.args.length - 1]).toContain('.agents/skills/review-loop/templates/roles/plan-reviewer.md')
    expect(call.args[call.args.length - 1]).toContain('.agent-workflows/review-loop/test-task/plan.md')
    expect(call.args[call.args.length - 1]).not.toContain('# Plan')
    expect(call.input).toBe('')

    const artifact = JSON.parse(fs.readFileSync(path.join(
      taskDir, 'runtime', 'reviewer-runs', 'plan-review-1.json'
    ), 'utf8'))
    expect(artifact.request).toEqual(expect.objectContaining({
      platform: 'claude-code',
      runner: 'claude -p',
      initialMessagePolicy: 'paths-only'
    }))
    expect(artifact.review.evidence.reviewerConfig).toEqual(reviewManager.reviewerConfig('claude-code', 'plan'))
    fs.rmSync(repo, { recursive: true, force: true })
  })

  test('runs Claude code review through the native code-review skill', function () {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-claude-code-'))
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: u.protocolVersion,
      taskId: 'test-task',
      phase: 'code_drafting',
      planRound: 1,
      codeRound: 0,
      platform: 'claude-code'
    })
    writeReviewerInputs(repo)
    writeCleanBaseline(repo, taskDir)
    fs.writeFileSync(path.join(repo, 'tracked.txt'), 'reviewed change\n')
    const scope = writeSnapshotRound(repo, taskDir, 1, ['tracked.txt'])
    const stateFile = path.join(taskDir, 'state.json')
    const state = JSON.parse(fs.readFileSync(stateFile))
    state.phase = 'code_reviewing'
    fs.writeFileSync(stateFile, JSON.stringify(state))
    fs.writeFileSync(path.join(taskDir, 'logs', 'coder-1.md'), '# Validation\n')

    const fake = fakeClaudeEnv(repo, review())
    const run = path.resolve(__dirname, '..', 'review-manager.js')
    const output = JSON.parse(childProcess.execFileSync('node', [
      run, '--task-id', 'test-task', '--kind', 'code', '--round', '1'
    ], { cwd: repo, env: fake.env, encoding: 'utf8' }))
    expect(output.runner).toBe('claude /code-review')

    const call = JSON.parse(fs.readFileSync(fake.logFile, 'utf8'))
    expect(call.args).not.toContain('--fix')
    expect(call.args[call.args.length - 1]).toBe(
      '/code-review high .agent-workflows/review-loop/test-task/diffs/code-diff-1.patch'
    )
    const systemPrompt = call.args[call.args.indexOf('--append-system-prompt') + 1]
    expect(systemPrompt).toContain('.agents/skills/review-loop/templates/roles/code-reviewer.md')
    expect(systemPrompt).toContain('.agent-workflows/review-loop/test-task/diffs/code-scope-1.json')
    expect(systemPrompt).not.toContain('# Validation')
    const artifact = JSON.parse(fs.readFileSync(path.join(
      taskDir, 'runtime', 'reviewer-runs', 'code-review-1.json'
    ), 'utf8'))
    expect(artifact.request.snapshotTree).toBe(scope.currentTree)
    expect(artifact.review.evidence.reviewerConfig).toEqual(reviewManager.reviewerConfig('claude-code', 'code'))
    const advance = path.resolve(__dirname, '..', 'advance-state.js')
    childProcess.execFileSync('node', [
      advance, '--task-id', 'test-task', '--event', 'code-review-complete',
      '--review', path.join(taskDir, 'reviews', 'code-review-1.json')
    ], { cwd: repo, encoding: 'utf8' })
    const confirmedState = JSON.parse(fs.readFileSync(stateFile))
    const runFile = path.join(taskDir, 'runtime', 'reviewer-runs', 'code-review-1.json')
    const runContent = fs.readFileSync(runFile)
    fs.rmSync(runFile)
    const recover = path.resolve(__dirname, '..', 'check-recoverability.js')
    expect(JSON.parse(childProcess.execFileSync('node', [
      recover, '--task-id', 'test-task'
    ], { cwd: repo, encoding: 'utf8' }))).toEqual(expect.objectContaining({
      ok: false,
      action: 'restart_task',
      phase: 'awaiting_final_confirm'
    }))
    fs.writeFileSync(runFile, runContent)
    fs.appendFileSync(path.join(taskDir, 'logs', 'coder-1.md'), '\nUpdated after review.\n')
    fs.appendFileSync(path.join(taskDir, 'diffs', 'code-diff-1.patch'), '\nUpdated after review.\n')
    const originalCwd = process.cwd()
    process.chdir(repo)
    try {
      expect(reviewManager.confirmationDrift(confirmedState, 'test-task', 'code', 1).changed).toBe(false)
    } finally {
      process.chdir(originalCwd)
    }
    fs.writeFileSync(path.join(repo, 'tracked.txt'), 'changed before confirmation\n')
    expect(function () {
      childProcess.execFileSync('node', [
        advance, '--task-id', 'test-task', '--event', 'confirm-final'
      ], { cwd: repo, encoding: 'utf8' })
    }).toThrow(/Reviewed code content changed before confirmation/)
    childProcess.execFileSync('node', [
      advance, '--task-id', 'test-task', '--event', 'confirm-final',
      '--accept-changed-inputs', 'true', '--override-reason', 'User accepts the manual code correction.'
    ], { cwd: repo, encoding: 'utf8' })
    const overridden = JSON.parse(fs.readFileSync(stateFile))
    expect(overridden.phase).toBe('done')
    expect(overridden.confirmationOverrides).toEqual([expect.objectContaining({
      kind: 'code',
      round: 1,
      reason: 'User accepts the manual code correction.',
      changedPaths: ['tracked.txt']
    })])
    fs.rmSync(repo, { recursive: true, force: true })
  })

  test('blocks manual persistence for CLI-managed reviews', function () {
    ;['codex', 'claude-code'].forEach(function (platform) {
      const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-spawn-persist-'))
      writeTask(repo, 'test-task', {
        protocolVersion: u.protocolVersion,
        taskId: 'test-task',
        phase: 'plan_reviewing',
        planRound: 0,
        codeRound: 0,
        platform: platform
      })
      const persist = path.resolve(__dirname, '..', 'persist-review-json.js')
      const args = [persist, '--task-id', 'test-task', '--kind', 'plan', '--round', '1']
      expect(function () {
        childProcess.execFileSync('node', args, {
          cwd: repo,
          input: JSON.stringify(review()),
          encoding: 'utf8'
        })
      }).toThrow(/must be finalized and persisted by review-manager.js/)
      fs.rmSync(repo, { recursive: true, force: true })
    })
  })

  test('state validation accepts a pending run and rejects an orphaned Codex review', function () {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-spawn-state-'))
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: u.protocolVersion,
      taskId: 'test-task',
      phase: 'plan_reviewing',
      planRound: 0,
      codeRound: 0,
      maxRounds: 3,
      awaitingUserConfirmation: false,
      platform: 'codex'
    })
    writeCleanBaseline(repo, taskDir)
    const validate = path.resolve(__dirname, '..', 'validate-state.js')
    expect(JSON.parse(childProcess.execFileSync('node', [validate, '--task-id', 'test-task'], {
      cwd: repo,
      encoding: 'utf8'
    })).ok).toBe(true)

    fs.writeFileSync(path.join(taskDir, 'reviews', 'plan-review-1.json'), JSON.stringify(review(), null, 2) + '\n')
    expect(function () {
      childProcess.execFileSync('node', [validate, '--task-id', 'test-task'], {
        cwd: repo,
        encoding: 'utf8'
      })
    }).toThrow(/Reviewer run artifact does not exist/)
    fs.rmSync(repo, { recursive: true, force: true })
  })

  test('derives code-review inputs from the current round', function () {
    expect(reviewManager.inputs('test-task', 'code', 2)).toEqual(expect.arrayContaining([
      '.agent-workflows/review-loop/test-task/diffs/code-diff-2.patch',
      '.agent-workflows/review-loop/test-task/diffs/code-round-2.patch',
      '.agent-workflows/review-loop/test-task/diffs/code-scope-2.json',
      '.agent-workflows/review-loop/test-task/logs/coder-2.md',
      '.agent-workflows/review-loop/test-task/reviews/code-review-1.json'
    ]))
  })
})

describe('native subagent reviewer isolation', function () {
  function prepareAndFinalize (repo, taskDir, platform, kind, output, agentId) {
    const run = path.resolve(__dirname, '..', 'review-manager.js')
    const baseArgs = [run, '--task-id', 'test-task', '--kind', kind, '--round', '1']
    const prepared = JSON.parse(childProcess.execFileSync('node', baseArgs.concat('--prepare'), {
      cwd: repo,
      encoding: 'utf8'
    }))
    const resultFile = path.join(os.tmpdir(), 'review-loop-native-result-' + process.pid + '-' + Date.now() + '.json')
    fs.writeFileSync(resultFile, JSON.stringify(output))
    const finalized = JSON.parse(childProcess.execFileSync('node', baseArgs.concat([
      '--finalize', '--input', resultFile, '--agent-id', agentId
    ]), { cwd: repo, encoding: 'utf8' }))
    fs.rmSync(resultFile)
    return { prepared: prepared, finalized: finalized }
  }

  ;['codex', 'claude-code'].forEach(function (platform) {
    test('prepares and finalizes a fresh native ' + platform + ' reviewer', function () {
      const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-native-' + platform + '-'))
      const taskDir = writeTask(repo, 'test-task', {
        protocolVersion: u.protocolVersion,
        taskId: 'test-task',
        phase: 'plan_reviewing',
        planRound: 0,
        codeRound: 0,
        platform: platform
      })
      writeReviewerInputs(repo)
      writeCleanBaseline(repo, taskDir)
      const completed = prepareAndFinalize(repo, taskDir, platform, 'plan', review(), platform + '-agent-1')
      expect(completed.prepared).toEqual(expect.objectContaining({
        runner: 'native-subagent',
        role: 'plan-reviewer',
        requestDigest: expect.stringMatching(/^[a-f0-9]{64}$/)
      }))
      expect(completed.prepared.prompt).toContain('.agent-workflows/review-loop/test-task/plan.md')
      expect(completed.prepared.prompt).not.toContain('# Plan')
      expect(completed.finalized).toEqual(expect.objectContaining({
        runner: 'native-subagent',
        status: 'approved'
      }))
      const artifact = JSON.parse(fs.readFileSync(path.join(
        taskDir, 'runtime', 'reviewer-runs', 'plan-review-1.json'
      ), 'utf8'))
      expect(artifact.request).toEqual(expect.objectContaining({
        runner: 'native-subagent',
        contextInheritance: 'none',
        writePolicy: 'read-only-with-tree-drift-guard'
      }))
      expect(artifact.execution).toEqual(expect.objectContaining({
        agentId: platform + '-agent-1',
        contextInheritance: 'none'
      }))
      expect(artifact.review.evidence.reviewerConfig).toEqual(reviewManager.reviewerConfig(platform))
      fs.rmSync(repo, { recursive: true, force: true })
    })
  })

  test('rejects input or worktree drift between prepare and finalize', function () {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-native-drift-'))
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: u.protocolVersion,
      taskId: 'test-task',
      phase: 'plan_reviewing',
      planRound: 0,
      codeRound: 0,
      platform: 'codex'
    })
    writeReviewerInputs(repo)
    writeCleanBaseline(repo, taskDir)
    const run = path.resolve(__dirname, '..', 'review-manager.js')
    const args = [run, '--task-id', 'test-task', '--kind', 'plan', '--round', '1']
    childProcess.execFileSync('node', args.concat('--prepare'), { cwd: repo, encoding: 'utf8' })
    fs.writeFileSync(path.join(repo, 'tracked.txt'), 'reviewer mutation\n')
    const resultFile = path.join(os.tmpdir(), 'review-loop-native-drift-' + process.pid + '.json')
    fs.writeFileSync(resultFile, JSON.stringify(review()))
    expect(function () {
      childProcess.execFileSync('node', args.concat([
        '--finalize', '--input', resultFile, '--agent-id', 'codex-agent-1'
      ]), { cwd: repo, encoding: 'utf8' })
    }).toThrow(/inputs or workspace tree changed after prepare/)
    fs.rmSync(resultFile)
    fs.rmSync(repo, { recursive: true, force: true })
  })

  test('rejects reviewer output without passed context-isolation evidence', function () {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-native-context-'))
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: u.protocolVersion,
      taskId: 'test-task',
      phase: 'plan_reviewing',
      planRound: 0,
      codeRound: 0,
      platform: 'codex'
    })
    writeReviewerInputs(repo)
    writeCleanBaseline(repo, taskDir)
    const run = path.resolve(__dirname, '..', 'review-manager.js')
    const args = [run, '--task-id', 'test-task', '--kind', 'plan', '--round', '1']
    childProcess.execFileSync('node', args.concat('--prepare'), { cwd: repo, encoding: 'utf8' })
    const output = review()
    output.evidence.checks.shift()
    const resultFile = path.join(os.tmpdir(), 'review-loop-native-context-' + process.pid + '.json')
    fs.writeFileSync(resultFile, JSON.stringify(output))
    expect(function () {
      childProcess.execFileSync('node', args.concat([
        '--finalize', '--input', resultFile, '--agent-id', 'codex-agent-1'
      ]), { cwd: repo, encoding: 'utf8' })
    }).toThrow(/passed context-isolation-preflight evidence/)
    fs.rmSync(resultFile)
    fs.rmSync(repo, { recursive: true, force: true })
  })

  test('blocks direct persistence for host-native reviews', function () {
    ;['codex', 'claude-code'].forEach(function (platform) {
      const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-native-persist-'))
      writeTask(repo, 'test-task', {
        protocolVersion: u.protocolVersion,
        taskId: 'test-task',
        phase: 'plan_reviewing',
        planRound: 0,
        codeRound: 0,
        platform: platform
      })
      const script = path.resolve(__dirname, '..', 'persist-review-json.js')
      expect(function () {
        childProcess.execFileSync('node', [
          script, '--task-id', 'test-task', '--kind', 'plan', '--round', '1'
        ], { cwd: repo, input: JSON.stringify(review()), encoding: 'utf8' })
      }).toThrow(/must be finalized and persisted by review-manager.js/)
      fs.rmSync(repo, { recursive: true, force: true })
    })
  })
})

describe('review evidence validation', function () {
  test('accepts an evidenced approval', function () {
    expect(u.validateReviewObject(review())).toEqual([])
  })

  test('rejects an approval without evidence', function () {
    const value = review()
    delete value.evidence
    expect(u.validateReviewObject(value)).toContain('evidence must be an object')
  })

  test('requires dispositions for unexpected paths', function () {
    const value = review()
    value.evidence.diffScope.unexpectedPaths.push('src/unexpected.js')
    expect(u.validateReviewObject(value)).toContain('unexpected path requires disposition: src/unexpected.js')
  })

  test('rejects hidden unexpected paths from scope metadata', function () {
    const value = review()
    expect(u.validateReviewScope(value, { round: 1, unexpectedPaths: ['src/unexpected.js'] }, 1)).toContain(
      'evidence.diffScope.unexpectedPaths must match scope metadata'
    )
  })

  test('binds review and scope artifacts to the expected round', function () {
    const value = review()
    expect(u.validateReviewScope(value, { round: 2, unexpectedPaths: [] }, 2)).toEqual(expect.arrayContaining([
      'review round must equal expected round 2',
      'evidence.diffScope.cumulativeDiff must reference expected round 2',
      'evidence.diffScope.roundDiff must reference expected round 2'
    ]))
  })

  test('does not approve a blocking unexpected path', function () {
    const value = review()
    value.evidence.diffScope.unexpectedPaths.push('src/unexpected.js')
    value.evidence.diffScope.unexpectedDispositions.push({
      path: 'src/unexpected.js',
      disposition: 'blocking',
      reason: 'The path is outside the confirmed task.'
    })
    expect(u.validateReviewObject(value)).toContain('approved review must not have blocking unexpected path dispositions')
  })

  test('requires a confirmed read-only reviewer sandbox', function () {
    const value = review()
    value.evidence.reviewerConfig.sandboxMode = 'workspace-write'
    expect(u.validateReviewObject(value)).toContain('evidence.reviewerConfig.sandboxMode must be read-only')
  })

  test('does not enter code reviewing before the snapshot is complete', function () {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-coder-complete-'))
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: u.protocolVersion,
      taskId: 'test-task',
      phase: 'code_drafting',
      planRound: 1,
      codeRound: 0,
      maxRounds: 3
    })
    const script = path.resolve(__dirname, '..', 'advance-state.js')
    const args = [script, '--task-id', 'test-task', '--event', 'coder-complete']
    expect(function () {
      childProcess.execFileSync('node', args, { cwd: repo, encoding: 'utf8' })
    }).toThrow(/requires snapshot-diff artifacts for round 1/)
    expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json'))).phase).toBe('code_drafting')

    writeCleanBaseline(repo, taskDir)
    fs.writeFileSync(path.join(repo, 'tracked.txt'), 'changed\n')
    writeSnapshotRound(repo, taskDir, 1, ['tracked.txt'])
    const diffFile = path.join(taskDir, 'diffs', 'code-diff-1.patch')
    const diff = fs.readFileSync(diffFile)
    fs.appendFileSync(diffFile, '\ntampered\n')
    expect(function () {
      childProcess.execFileSync('node', args, { cwd: repo, encoding: 'utf8' })
    }).toThrow(/code-diff-1\.patch must exactly match the reconstructed Git diff/)
    fs.writeFileSync(diffFile, diff)
    fs.writeFileSync(path.join(repo, 'tracked.txt'), 'changed after snapshot\n')
    expect(function () {
      childProcess.execFileSync('node', args, { cwd: repo, encoding: 'utf8' })
    }).toThrow(/Code snapshot is stale for round 1/)
    fs.writeFileSync(path.join(repo, 'tracked.txt'), 'changed\n')
    childProcess.execFileSync('node', args, { cwd: repo, encoding: 'utf8' })
    expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json'))).phase).toBe('code_reviewing')
    fs.rmSync(repo, { recursive: true, force: true })
  })

  test('validator cross-checks unexpected paths from code scope metadata', function () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-validator-'))
    const reviewsDir = path.join(dir, 'reviews')
    const diffsDir = path.join(dir, 'diffs')
    fs.mkdirSync(reviewsDir)
    fs.mkdirSync(diffsDir)
    const reviewFile = path.join(reviewsDir, 'code-review-1.json')
    fs.writeFileSync(reviewFile, JSON.stringify(review()))
    fs.writeFileSync(path.join(diffsDir, 'code-scope-1.json'), JSON.stringify({
      round: 1,
      unexpectedPaths: ['src/unexpected.js']
    }))
    const validator = path.resolve(__dirname, '..', 'validate-review-json.js')
    expect(function () {
      childProcess.execFileSync('node', [validator, '--review', reviewFile], { encoding: 'utf8' })
    }).toThrow(/evidence\.diffScope\.unexpectedPaths must match scope metadata/)
    fs.rmSync(dir, { recursive: true, force: true })
  })

  test('state advancement rejects a stale review from the previous round', function () {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-advance-'))
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: u.protocolVersion,
      taskId: 'test-task',
      phase: 'code_reviewing',
      planRound: 1,
      codeRound: 1,
      maxRounds: 3,
      planStatus: 'approved',
      codeStatus: 'reviewing',
      awaitingUserConfirmation: false,
      lastReviewFile: '',
      terminationReason: ''
    })
    fs.writeFileSync(path.join(taskDir, 'diffs', 'code-scope-2.json'), JSON.stringify({
      round: 2,
      unexpectedPaths: []
    }))
    const reviewFile = path.join(taskDir, 'reviews', 'code-review-2.json')
    fs.writeFileSync(reviewFile, JSON.stringify(review()))
    const script = path.resolve(__dirname, '..', 'advance-state.js')
    expect(function () {
      childProcess.execFileSync('node', [
        script, '--task-id', 'test-task', '--event', 'code-review-complete', '--review', reviewFile
      ], { cwd: repo, encoding: 'utf8' })
    }).toThrow(/review round must equal expected round 2/)
    expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json'))).codeRound).toBe(1)
    fs.rmSync(repo, { recursive: true, force: true })
  })

  test('state advancement rejects a review artifact from another task', function () {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-cross-task-'))
    const state = {
      protocolVersion: u.protocolVersion,
      phase: 'code_reviewing',
      planRound: 1,
      codeRound: 0,
      maxRounds: 3
    }
    const taskDir = writeTask(repo, 'current-task', Object.assign({ taskId: 'current-task' }, state))
    const otherTaskDir = writeTask(repo, 'other-task', Object.assign({ taskId: 'other-task' }, state))
    fs.writeFileSync(path.join(taskDir, 'diffs', 'code-scope-1.json'), JSON.stringify({
      round: 1,
      unexpectedPaths: []
    }))
    const reviewFile = path.join(otherTaskDir, 'reviews', 'code-review-1.json')
    fs.writeFileSync(reviewFile, JSON.stringify(review()))
    const script = path.resolve(__dirname, '..', 'advance-state.js')
    expect(function () {
      childProcess.execFileSync('node', [
        script, '--task-id', 'current-task', '--event', 'code-review-complete', '--review', reviewFile
      ], { cwd: repo, encoding: 'utf8' })
    }).toThrow(/canonical current-task artifact/)
    expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json'))).codeRound).toBe(0)
    fs.rmSync(repo, { recursive: true, force: true })
  })

  test('does not increase maxRounds before the configured limit is reached', function () {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-max-rounds-early-'))
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: u.protocolVersion,
      taskId: 'test-task',
      phase: 'code_drafting',
      planRound: 1,
      codeRound: 2,
      maxRounds: 3,
      planStatus: 'approved',
      codeStatus: 'changes_requested',
      awaitingUserConfirmation: false,
      lastReviewFile: 'reviews/code-review-2.json',
      terminationReason: ''
    })
    fs.writeFileSync(path.join(taskDir, 'reviews', 'code-review-2.json'), JSON.stringify(review('changes_requested', 2)))
    const script = path.resolve(__dirname, '..', 'advance-state.js')
    expect(function () {
      childProcess.execFileSync('node', [
        script, '--task-id', 'test-task', '--event', 'set-max-rounds',
        '--max-rounds', '4', '--user-confirmed', 'true'
      ], { cwd: repo, encoding: 'utf8' })
    }).toThrow(/requires a max_rounds_reached confirmation phase/)
    expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json'))).maxRounds).toBe(3)
    fs.rmSync(repo, { recursive: true, force: true })
  })

  test('requires explicit confirmation and resumes code drafting after increasing maxRounds', function () {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-max-rounds-code-'))
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: u.protocolVersion,
      taskId: 'test-task',
      phase: 'awaiting_final_confirm',
      planRound: 1,
      codeRound: 3,
      maxRounds: 3,
      planStatus: 'approved',
      codeStatus: 'max_rounds_reached',
      awaitingUserConfirmation: true,
      lastReviewFile: 'reviews/code-review-3.json',
      terminationReason: 'max_rounds_reached'
    })
    fs.writeFileSync(path.join(taskDir, 'reviews', 'code-review-3.json'), JSON.stringify(review('changes_requested', 3)))
    const script = path.resolve(__dirname, '..', 'advance-state.js')
    expect(function () {
      childProcess.execFileSync('node', [
        script, '--task-id', 'test-task', '--event', 'set-max-rounds', '--max-rounds', '4'
      ], { cwd: repo, encoding: 'utf8' })
    }).toThrow(/requires --user-confirmed true/)
    expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json'))).maxRounds).toBe(3)
    expect(function () {
      childProcess.execFileSync('node', [
        script, '--task-id', 'test-task', '--event', 'set-max-rounds',
        '--max-rounds', '3', '--user-confirmed', 'true'
      ], { cwd: repo, encoding: 'utf8' })
    }).toThrow(/must be greater than the current maxRounds/)

    childProcess.execFileSync('node', [
      script, '--task-id', 'test-task', '--event', 'set-max-rounds',
      '--max-rounds', '4', '--user-confirmed', 'true'
    ], { cwd: repo, encoding: 'utf8' })
    expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json')))).toEqual(expect.objectContaining({
      phase: 'code_drafting',
      codeStatus: 'changes_requested',
      maxRounds: 4,
      awaitingUserConfirmation: false,
      terminationReason: ''
    }))
    fs.rmSync(repo, { recursive: true, force: true })
  })

  test('resumes plan drafting after increasing maxRounds at the plan limit', function () {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-max-rounds-plan-'))
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: u.protocolVersion,
      taskId: 'test-task',
      phase: 'awaiting_plan_confirm',
      planRound: 3,
      codeRound: 0,
      maxRounds: 3,
      planStatus: 'max_rounds_reached',
      codeStatus: 'pending',
      awaitingUserConfirmation: true,
      lastReviewFile: 'reviews/plan-review-3.json',
      terminationReason: 'max_rounds_reached'
    })
    fs.writeFileSync(path.join(taskDir, 'reviews', 'plan-review-3.json'), JSON.stringify(review('changes_requested', 3)))
    const script = path.resolve(__dirname, '..', 'advance-state.js')
    childProcess.execFileSync('node', [
      script, '--task-id', 'test-task', '--event', 'set-max-rounds',
      '--max-rounds', '4', '--user-confirmed', 'true'
    ], { cwd: repo, encoding: 'utf8' })
    expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json')))).toEqual(expect.objectContaining({
      phase: 'plan_drafting',
      planStatus: 'changes_requested',
      maxRounds: 4,
      awaitingUserConfirmation: false,
      terminationReason: ''
    }))
    fs.rmSync(repo, { recursive: true, force: true })
  })

  test('does not bypass maxRounds through rejection events', function () {
    ;[
      {
        phase: 'awaiting_plan_confirm',
        event: 'reject-plan',
        planRound: 3,
        codeRound: 0,
        planStatus: 'max_rounds_reached',
        codeStatus: 'pending'
      },
      {
        phase: 'awaiting_final_confirm',
        event: 'reject-final',
        planRound: 1,
        codeRound: 3,
        planStatus: 'approved',
        codeStatus: 'max_rounds_reached'
      }
    ].forEach(function (testCase) {
      const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-max-rounds-reject-'))
      const taskDir = writeTask(repo, 'test-task', Object.assign({
        protocolVersion: u.protocolVersion,
        taskId: 'test-task',
        maxRounds: 3,
        awaitingUserConfirmation: true,
        terminationReason: 'max_rounds_reached'
      }, testCase))
      const script = path.resolve(__dirname, '..', 'advance-state.js')
      expect(function () {
        childProcess.execFileSync('node', [
          script, '--task-id', 'test-task', '--event', testCase.event
        ], { cwd: repo, encoding: 'utf8' })
      }).toThrow(/requires an explicit maxRounds increase/)
      expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json'))).phase).toBe(testCase.phase)
      fs.rmSync(repo, { recursive: true, force: true })
    })
  })

  test('rejects a current-task review symlink to another task artifact', function () {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-cross-task-symlink-'))
    const state = {
      protocolVersion: u.protocolVersion,
      phase: 'code_reviewing',
      planRound: 1,
      codeRound: 0,
      maxRounds: 3
    }
    const taskDir = writeTask(repo, 'current-task', Object.assign({ taskId: 'current-task' }, state))
    const otherTaskDir = writeTask(repo, 'other-task', Object.assign({ taskId: 'other-task' }, state))
    fs.writeFileSync(path.join(taskDir, 'diffs', 'code-scope-1.json'), JSON.stringify({
      round: 1,
      unexpectedPaths: []
    }))
    const otherReviewFile = path.join(otherTaskDir, 'reviews', 'code-review-1.json')
    const reviewFile = path.join(taskDir, 'reviews', 'code-review-1.json')
    const content = JSON.stringify(review(), null, 2) + '\n'
    fs.writeFileSync(otherReviewFile, content)
    fs.symlinkSync(otherReviewFile, reviewFile)
    const persist = path.resolve(__dirname, '..', 'persist-review-json.js')
    expect(function () {
      childProcess.execFileSync('node', [
        persist, '--task-id', 'current-task', '--kind', 'code', '--round', '1'
      ], { cwd: repo, input: JSON.stringify(review()), encoding: 'utf8' })
    }).toThrow(/regular non-symlink file/)
    const advance = path.resolve(__dirname, '..', 'advance-state.js')
    expect(function () {
      childProcess.execFileSync('node', [
        advance, '--task-id', 'current-task', '--event', 'code-review-complete', '--review', reviewFile
      ], { cwd: repo, encoding: 'utf8' })
    }).toThrow(/regular non-symlink file/)
    expect(fs.readFileSync(otherReviewFile, 'utf8')).toBe(content)
    expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json'))).codeRound).toBe(0)
    fs.rmSync(repo, { recursive: true, force: true })
  })

  test('rejects a current-task reviews directory symlink to another task', function () {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-cross-task-reviews-symlink-'))
    const state = {
      protocolVersion: u.protocolVersion,
      phase: 'code_reviewing',
      planRound: 1,
      codeRound: 0,
      maxRounds: 3
    }
    const taskDir = writeTask(repo, 'current-task', Object.assign({ taskId: 'current-task' }, state))
    const otherTaskDir = writeTask(repo, 'other-task', Object.assign({ taskId: 'other-task' }, state))
    fs.writeFileSync(path.join(taskDir, 'diffs', 'code-scope-1.json'), JSON.stringify({
      round: 1,
      unexpectedPaths: []
    }))
    const otherReviewFile = path.join(otherTaskDir, 'reviews', 'code-review-1.json')
    fs.writeFileSync(otherReviewFile, JSON.stringify(review(), null, 2) + '\n')
    fs.rmSync(path.join(taskDir, 'reviews'), { recursive: true })
    fs.symlinkSync(path.join(otherTaskDir, 'reviews'), path.join(taskDir, 'reviews'))
    const reviewFile = path.join(taskDir, 'reviews', 'code-review-1.json')
    const persist = path.resolve(__dirname, '..', 'persist-review-json.js')
    expect(function () {
      childProcess.execFileSync('node', [
        persist, '--task-id', 'current-task', '--kind', 'code', '--round', '1'
      ], { cwd: repo, input: JSON.stringify(review()), encoding: 'utf8' })
    }).toThrow(/Reviews directory must be a canonical non-symlink directory/)
    const advance = path.resolve(__dirname, '..', 'advance-state.js')
    expect(function () {
      childProcess.execFileSync('node', [
        advance, '--task-id', 'current-task', '--event', 'code-review-complete', '--review', reviewFile
      ], { cwd: repo, encoding: 'utf8' })
    }).toThrow(/Reviews directory must be a canonical non-symlink directory/)
    const validate = path.resolve(__dirname, '..', 'validate-review-json.js')
    expect(function () {
      childProcess.execFileSync('node', [validate, '--review', reviewFile], { cwd: repo, encoding: 'utf8' })
    }).toThrow(/Reviews directory must be a canonical non-symlink directory/)

    fs.writeFileSync(path.join(taskDir, 'state.json'), JSON.stringify({
      protocolVersion: '1.0.0',
      taskId: 'current-task',
      phase: 'awaiting_plan_confirm',
      planRound: 1,
      codeRound: 0,
      maxRounds: 3
    }))
    fs.writeFileSync(path.join(otherTaskDir, 'reviews', 'plan-review-1.json'), JSON.stringify(review()))
    writeCleanBaseline(repo, taskDir)
    const migrate = path.resolve(__dirname, '..', 'migrate-workspace.js')
    expect(function () {
      childProcess.execFileSync('node', [migrate, '--task-id', 'current-task'], { cwd: repo, encoding: 'utf8' })
    }).toThrow(/Reviews directory must be a canonical non-symlink directory/)
    expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json'))).protocolVersion).toBe('1.0.0')
    fs.rmSync(repo, { recursive: true, force: true })
  })

  test('rejects additional properties at every schema object level', function () {
    const mutations = [
      function (value) { value.extra = true },
      function (value) { value.evidence.extra = true },
      function (value) { value.evidence.tracedSymbols[0].extra = true },
      function (value) { value.evidence.checks[0].extra = true },
      function (value) { value.evidence.counterexamples[0].extra = true },
      function (value) { value.evidence.diffScope.extra = true },
      function (value) {
        value.evidence.diffScope.unexpectedPaths.push('src/unexpected.js')
        value.evidence.diffScope.unexpectedDispositions.push({
          path: 'src/unexpected.js', disposition: 'included', reason: 'in scope', extra: true
        })
      },
      function (value) { value.evidence.reviewerConfig.extra = true },
      function (value) {
        value.status = 'changes_requested'
        value.findings.push({
          id: 'P1',
          severity: 'major',
          category: 'bug',
          target: 'src/example.js',
          comment: 'Broken.',
          suggestion: 'Fix it.',
          extra: true
        })
      }
    ]
    mutations.forEach(function (mutate) {
      const value = review()
      mutate(value)
      expect(u.validateReviewObject(value).some(function (error) {
        return error.includes('must not contain additional property extra')
      })).toBe(true)
    })
  })
})

describe('review persistence and protocol migration', function () {
  let repo

  beforeEach(function () {
    repo = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-contract-'))
  })

  afterEach(function () {
    fs.rmSync(repo, { recursive: true, force: true })
  })

  test('orchestrator persists validated JSON returned by a read-only reviewer', function () {
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: u.protocolVersion,
      taskId: 'test-task',
      phase: 'code_reviewing',
      planRound: 1,
      codeRound: 0
    })
    fs.writeFileSync(path.join(taskDir, 'diffs', 'code-scope-1.json'), JSON.stringify({
      round: 1,
      unexpectedPaths: []
    }))
    const script = path.resolve(__dirname, '..', 'persist-review-json.js')
    const output = JSON.parse(childProcess.execFileSync('node', [
      script, '--task-id', 'test-task', '--kind', 'code', '--round', '1'
    ], { cwd: repo, input: JSON.stringify(review()), encoding: 'utf8' }))
    expect(output.status).toBe('approved')
    expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'reviews', 'code-review-1.json')))).toEqual(review())
  })

  test('allows only identical retries for the current review artifact', function () {
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: u.protocolVersion,
      taskId: 'test-task',
      phase: 'code_reviewing',
      planRound: 1,
      codeRound: 0
    })
    fs.writeFileSync(path.join(taskDir, 'diffs', 'code-scope-1.json'), JSON.stringify({
      round: 1,
      unexpectedPaths: []
    }))
    const script = path.resolve(__dirname, '..', 'persist-review-json.js')
    const args = [script, '--task-id', 'test-task', '--kind', 'code', '--round', '1']
    const reviewFile = path.join(taskDir, 'reviews', 'code-review-1.json')
    const first = childProcess.execFileSync('node', args, {
      cwd: repo,
      input: JSON.stringify(review()),
      encoding: 'utf8'
    })
    const persisted = fs.readFileSync(reviewFile, 'utf8')
    expect(childProcess.execFileSync('node', args, {
      cwd: repo,
      input: JSON.stringify(review()),
      encoding: 'utf8'
    })).toBe(first)
    const changed = review()
    changed.summary = 'Different review content.'
    expect(function () {
      childProcess.execFileSync('node', args, {
        cwd: repo,
        input: JSON.stringify(changed),
        encoding: 'utf8'
      })
    }).toThrow(/already exists with different content/)
    expect(fs.readFileSync(reviewFile, 'utf8')).toBe(persisted)
  })

  test('does not overwrite a completed review round', function () {
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: u.protocolVersion,
      taskId: 'test-task',
      phase: 'code_drafting',
      planRound: 1,
      codeRound: 1
    })
    const reviewFile = path.join(taskDir, 'reviews', 'code-review-1.json')
    fs.writeFileSync(reviewFile, JSON.stringify(review(), null, 2) + '\n')
    const persisted = fs.readFileSync(reviewFile, 'utf8')
    const changed = review()
    changed.summary = 'Replacement review content.'
    const script = path.resolve(__dirname, '..', 'persist-review-json.js')
    expect(function () {
      childProcess.execFileSync('node', [
        script, '--task-id', 'test-task', '--kind', 'code', '--round', '1'
      ], { cwd: repo, input: JSON.stringify(changed), encoding: 'utf8' })
    }).toThrow(/requires phase code_reviewing/)
    expect(fs.readFileSync(reviewFile, 'utf8')).toBe(persisted)
  })

  test('does not persist invalid reviewer output', function () {
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: u.protocolVersion,
      taskId: 'test-task',
      phase: 'plan_reviewing',
      planRound: 0,
      codeRound: 0
    })
    const script = path.resolve(__dirname, '..', 'persist-review-json.js')
    expect(function () {
      childProcess.execFileSync('node', [
        script, '--task-id', 'test-task', '--kind', 'plan', '--round', '1'
      ], { cwd: repo, input: '```json\n{}\n```', encoding: 'utf8' })
    }).toThrow(/one strict JSON object/)
    expect(fs.existsSync(path.join(taskDir, 'reviews', 'plan-review-1.json'))).toBe(false)
  })

  test('does not force-reinitialize a workspace with immutable review history', function () {
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: u.protocolVersion,
      taskId: 'test-task',
      phase: 'plan_drafting',
      planRound: 0,
      codeRound: 0
    })
    writeCleanBaseline(repo, taskDir)
    fs.writeFileSync(path.join(taskDir, 'reviews', 'plan-review-1.json'), JSON.stringify(review()))
    fs.mkdirSync(path.join(taskDir, 'runtime', 'reviewer-runs'))
    fs.writeFileSync(path.join(taskDir, 'runtime', 'reviewer-runs', 'plan-review-1.json'), '{}')
    const state = fs.readFileSync(path.join(taskDir, 'state.json'))
    const script = path.resolve(__dirname, '..', 'init-workspace.js')

    expect(function () {
      childProcess.execFileSync('node', [script, '--task-id', 'test-task', '--force'], {
        cwd: repo,
        encoding: 'utf8'
      })
    }).toThrow(/immutable review history.*new task id/)
    expect(fs.readFileSync(path.join(taskDir, 'state.json'))).toEqual(state)
  })

  test('migrates safe legacy state while preserving legacy reviews as read-only', function () {
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: '1.0.0',
      taskId: 'test-task',
      phase: 'plan_drafting',
      planRound: 1,
      codeRound: 0,
      maxRounds: 3
    })
    fs.writeFileSync(path.join(taskDir, 'reviews', 'plan-review-1.json'), JSON.stringify({
      round: 1,
      status: 'approved',
      summary: 'Legacy approval.',
      findings: []
    }))
    writeCleanBaseline(repo, taskDir)
    const script = path.resolve(__dirname, '..', 'migrate-workspace.js')
    const output = JSON.parse(childProcess.execFileSync('node', [script, '--task-id', 'test-task'], {
      cwd: repo,
      encoding: 'utf8'
    }))
    expect(output.protocolVersion).toBe(u.protocolVersion)
    expect(output.legacyReadOnlyArtifacts).toEqual(['reviews/plan-review-1.json'])
    expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json'))).protocolVersion).toBe(u.protocolVersion)
  })

  test('keeps legacy state unchanged when its clean baseline tree does not match HEAD', function () {
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: '1.0.0',
      taskId: 'test-task',
      phase: 'plan_drafting',
      planRound: 0,
      codeRound: 0,
      maxRounds: 3
    })
    writeCleanBaseline(repo, taskDir)
    const baselineFile = path.join(taskDir, 'runtime', 'baseline', 'manifest.json')
    const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'))
    baseline.tree = childProcess.execFileSync('git', ['mktree'], {
      cwd: repo,
      input: '',
      encoding: 'utf8'
    }).trim()
    fs.writeFileSync(baselineFile, JSON.stringify(baseline))
    const script = path.resolve(__dirname, '..', 'migrate-workspace.js')
    expect(function () {
      childProcess.execFileSync('node', [script, '--task-id', 'test-task'], { cwd: repo, encoding: 'utf8' })
    }).toThrow(/baseline tree does not match baseline HEAD tree/)
    expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json'))).protocolVersion).toBe('1.0.0')
    expect(fs.existsSync(path.join(taskDir, 'runtime', 'protocol-migration.json'))).toBe(false)
  })

  test('keeps legacy state unchanged when its clean baseline Git objects are unavailable', function () {
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: '1.0.0',
      taskId: 'test-task',
      phase: 'plan_drafting',
      planRound: 0,
      codeRound: 0,
      maxRounds: 3
    })
    writeCleanBaseline(repo, taskDir)
    const baselineFile = path.join(taskDir, 'runtime', 'baseline', 'manifest.json')
    const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'))
    baseline.head = '0000000000000000000000000000000000000000'
    baseline.tree = baseline.head
    fs.writeFileSync(baselineFile, JSON.stringify(baseline))
    const script = path.resolve(__dirname, '..', 'migrate-workspace.js')
    expect(function () {
      childProcess.execFileSync('node', [script, '--task-id', 'test-task'], { cwd: repo, encoding: 'utf8' })
    }).toThrow(/baseline is not reconstructable/)
    expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json'))).protocolVersion).toBe('1.0.0')
    expect(fs.existsSync(path.join(taskDir, 'runtime', 'protocol-migration.json'))).toBe(false)
  })

  ;[
    {
      name: 'missing currentTree',
      mutate: function (scope) { delete scope.currentTree },
      error: /currentTree must be a non-empty string/
    },
    {
      name: 'non-tree currentTree',
      mutate: function (scope) { scope.currentTree = scope.baselineHead },
      error: /currentTree must reference an existing tree object/
    },
    {
      name: 'mismatched tree chain',
      mutate: function (scope) {
        scope.previousTree = childProcess.execFileSync('git', ['mktree'], {
          cwd: repo,
          input: '',
          encoding: 'utf8'
        }).trim()
      },
      error: /previousTree must match the previous scope tree/
    }
  ].forEach(function (testCase) {
    test('blocks legacy migration with ' + testCase.name, function () {
      const fixture = writeMigratableCodeTask(repo)
      testCase.mutate(fixture.scope)
      fs.writeFileSync(path.join(fixture.taskDir, 'diffs', 'code-scope-1.json'), JSON.stringify(fixture.scope))
      const script = path.resolve(__dirname, '..', 'migrate-workspace.js')
      expect(function () {
        childProcess.execFileSync('node', [script, '--task-id', 'test-task'], { cwd: repo, encoding: 'utf8' })
      }).toThrow(testCase.error)
      expect(JSON.parse(fs.readFileSync(path.join(fixture.taskDir, 'state.json'))).protocolVersion).toBe('1.0.0')
      expect(fs.existsSync(path.join(fixture.taskDir, 'runtime', 'protocol-migration.json'))).toBe(false)
    })
  })

  test('migrated code drafting workspace can snapshot its next round', function () {
    const fixture = writeMigratableCodeTask(repo)
    const migrate = path.resolve(__dirname, '..', 'migrate-workspace.js')
    childProcess.execFileSync('node', [migrate, '--task-id', 'test-task'], { cwd: repo, encoding: 'utf8' })
    fs.writeFileSync(path.join(repo, 'tracked.txt'), 'round two\n')
    fs.writeFileSync(path.join(fixture.taskDir, 'runtime', 'code-round-2-paths.json'), JSON.stringify({
      round: 2,
      paths: ['tracked.txt']
    }))
    const snapshotScript = path.resolve(__dirname, '..', 'snapshot-diff.js')
    childProcess.execFileSync('node', [snapshotScript, '--task-id', 'test-task', '--round', '2'], {
      cwd: repo,
      encoding: 'utf8'
    })
    const scope = JSON.parse(fs.readFileSync(path.join(fixture.taskDir, 'diffs', 'code-scope-2.json')))
    expect(scope.previousTree).toBe(fixture.scope.currentTree)
    expect(scope.roundPaths).toEqual(['tracked.txt'])
    expect(JSON.parse(fs.readFileSync(path.join(fixture.taskDir, 'state.json'))).protocolVersion).toBe(u.protocolVersion)
  })

  ;[
    {
      name: 'empty current unexpected path',
      mutate: function (scope) { scope.unexpectedPaths = [''] }
    },
    {
      name: 'escaping current cumulative path',
      mutate: function (scope) { scope.cumulativePaths = ['../outside.js'] }
    },
    {
      name: 'absolute current claimed path',
      mutate: function (scope) { scope.claimedPaths = ['/tmp/outside.js'] }
    }
  ].forEach(function (testCase) {
    test('blocks legacy migration with ' + testCase.name, function () {
      const fixture = writeMigratableCurrentCodeTask(repo)
      testCase.mutate(fixture.scope)
      fs.writeFileSync(path.join(fixture.taskDir, 'diffs', 'code-scope-2.json'), JSON.stringify(fixture.scope))
      const script = path.resolve(__dirname, '..', 'migrate-workspace.js')
      expect(function () {
        childProcess.execFileSync('node', [script, '--task-id', 'test-task'], { cwd: repo, encoding: 'utf8' })
      }).toThrow(/must be an array of non-empty repo-relative paths/)
      expect(JSON.parse(fs.readFileSync(path.join(fixture.taskDir, 'state.json'))).protocolVersion).toBe('1.0.0')
      expect(fs.existsSync(path.join(fixture.taskDir, 'runtime', 'protocol-migration.json'))).toBe(false)
    })
  })

  test('migrates a current code scope whose paths can produce valid evidence', function () {
    const fixture = writeMigratableCurrentCodeTask(repo)
    const script = path.resolve(__dirname, '..', 'migrate-workspace.js')
    childProcess.execFileSync('node', [script, '--task-id', 'test-task'], { cwd: repo, encoding: 'utf8' })
    const value = review('approved', 2)
    value.evidence.diffScope.unexpectedPaths.push('tracked.txt')
    value.evidence.diffScope.unexpectedDispositions.push({
      path: 'tracked.txt',
      disposition: 'included',
      reason: 'The path is part of the reviewed round.'
    })
    expect(u.validateReviewObject(value)).toEqual([])
    expect(u.validateReviewScope(value, fixture.scope, 2)).toEqual([])
    expect(JSON.parse(fs.readFileSync(path.join(fixture.taskDir, 'state.json'))).protocolVersion).toBe(u.protocolVersion)
  })

  ;[
    {
      name: 'hidden changed paths',
      fixture: writeMigratableChangedCodeTask,
      mutate: function (fixture) {
        fixture.scope.cumulativePaths = []
        fixture.scope.roundPaths = []
        fixture.scope.claimedPaths = []
      },
      error: /cumulativePaths must exactly match the reconstructed Git paths/
    },
    {
      name: 'fabricated changed paths',
      fixture: writeMigratableCodeTask,
      mutate: function (fixture) {
        fixture.scope.cumulativePaths = ['fabricated.js']
        fixture.scope.roundPaths = ['fabricated.js']
        fixture.scope.unexpectedPaths = ['fabricated.js']
      },
      error: /cumulativePaths must exactly match the reconstructed Git paths/
    },
    {
      name: 'overlapping claimed and unexpected paths',
      fixture: writeMigratableChangedCodeTask,
      mutate: function (fixture) { fixture.scope.unexpectedPaths = ['tracked.txt'] },
      error: /must be an ordered, unique, disjoint partition of roundPaths/
    },
    {
      name: 'duplicate claimed paths',
      fixture: writeMigratableChangedCodeTask,
      mutate: function (fixture) { fixture.scope.claimedPaths = ['tracked.txt', 'tracked.txt'] },
      error: /must use unique canonical Git paths in stored order/
    }
  ].forEach(function (testCase) {
    test('blocks legacy migration with ' + testCase.name, function () {
      const fixture = testCase.fixture(repo)
      testCase.mutate(fixture)
      fs.writeFileSync(path.join(fixture.taskDir, 'diffs', 'code-scope-1.json'), JSON.stringify(fixture.scope))
      const script = path.resolve(__dirname, '..', 'migrate-workspace.js')
      expect(function () {
        childProcess.execFileSync('node', [script, '--task-id', 'test-task'], { cwd: repo, encoding: 'utf8' })
      }).toThrow(testCase.error)
      expect(JSON.parse(fs.readFileSync(path.join(fixture.taskDir, 'state.json'))).protocolVersion).toBe('1.0.0')
      expect(fs.existsSync(path.join(fixture.taskDir, 'runtime', 'protocol-migration.json'))).toBe(false)
    })
  })

  ;['code-diff-1.patch', 'code-round-1.patch'].forEach(function (patchFile) {
    test('blocks legacy migration with stale empty ' + patchFile, function () {
      const fixture = writeMigratableChangedCodeTask(repo)
      fs.writeFileSync(path.join(fixture.taskDir, 'diffs', patchFile), '')
      const script = path.resolve(__dirname, '..', 'migrate-workspace.js')
      expect(function () {
        childProcess.execFileSync('node', [script, '--task-id', 'test-task'], { cwd: repo, encoding: 'utf8' })
      }).toThrow(/must byte-exactly match its reconstructed Git diff/)
      expect(JSON.parse(fs.readFileSync(path.join(fixture.taskDir, 'state.json'))).protocolVersion).toBe('1.0.0')
      expect(fs.existsSync(path.join(fixture.taskDir, 'runtime', 'protocol-migration.json'))).toBe(false)
    })
  })

  test('migrates code scope with reconstructed paths, partition, and patches', function () {
    const fixture = writeMigratableChangedCodeTask(repo)
    const script = path.resolve(__dirname, '..', 'migrate-workspace.js')
    childProcess.execFileSync('node', [script, '--task-id', 'test-task'], { cwd: repo, encoding: 'utf8' })
    expect(fixture.scope).toEqual(expect.objectContaining({
      cumulativePaths: ['tracked.txt'],
      roundPaths: ['tracked.txt'],
      claimedPaths: ['tracked.txt'],
      unexpectedPaths: []
    }))
    expect(JSON.parse(fs.readFileSync(path.join(fixture.taskDir, 'state.json'))).protocolVersion).toBe(u.protocolVersion)
    expect(fs.existsSync(path.join(fixture.taskDir, 'runtime', 'protocol-migration.json'))).toBe(true)
  })

  test('blocks legacy plan approval from migrating into plan confirmation', function () {
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: '1.0.0',
      taskId: 'test-task',
      phase: 'awaiting_plan_confirm',
      planRound: 1,
      codeRound: 0,
      maxRounds: 3
    })
    fs.writeFileSync(path.join(taskDir, 'reviews', 'plan-review-1.json'), JSON.stringify({
      round: 1,
      status: 'approved',
      summary: 'Legacy approval.',
      findings: []
    }))
    writeCleanBaseline(repo, taskDir)
    const script = path.resolve(__dirname, '..', 'migrate-workspace.js')
    expect(function () {
      childProcess.execFileSync('node', [script, '--task-id', 'test-task'], { cwd: repo, encoding: 'utf8' })
    }).toThrow(/evidence must be an object/)
    expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json'))).protocolVersion).toBe('1.0.0')
    expect(fs.existsSync(path.join(taskDir, 'runtime', 'protocol-migration.json'))).toBe(false)
  })

  test('blocks changes-requested plan review below maxRounds from plan confirmation', function () {
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: '1.0.0',
      taskId: 'test-task',
      phase: 'awaiting_plan_confirm',
      planRound: 1,
      codeRound: 0,
      maxRounds: 3
    })
    fs.writeFileSync(path.join(taskDir, 'reviews', 'plan-review-1.json'), JSON.stringify(review('changes_requested')))
    writeCleanBaseline(repo, taskDir)
    const script = path.resolve(__dirname, '..', 'migrate-workspace.js')
    expect(function () {
      childProcess.execFileSync('node', [script, '--task-id', 'test-task'], { cwd: repo, encoding: 'utf8' })
    }).toThrow(/latest plan review must be approved or reach maxRounds/)
    expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json'))).protocolVersion).toBe('1.0.0')
    expect(fs.existsSync(path.join(taskDir, 'runtime', 'protocol-migration.json'))).toBe(false)
  })

  test('allows changes-requested plan review at maxRounds to reach plan confirmation', function () {
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: '1.0.0',
      taskId: 'test-task',
      phase: 'awaiting_plan_confirm',
      planRound: 1,
      codeRound: 0,
      maxRounds: 1
    })
    fs.writeFileSync(path.join(taskDir, 'reviews', 'plan-review-1.json'), JSON.stringify(review('changes_requested')))
    writeCleanBaseline(repo, taskDir)
    const script = path.resolve(__dirname, '..', 'migrate-workspace.js')
    const output = JSON.parse(childProcess.execFileSync('node', [script, '--task-id', 'test-task'], {
      cwd: repo,
      encoding: 'utf8'
    }))
    expect(output.protocolVersion).toBe(u.protocolVersion)
    expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json'))).protocolVersion).toBe(u.protocolVersion)
  })

  ;['awaiting_final_confirm', 'done'].forEach(function (phase) {
    test('blocks changes-requested code review below maxRounds from ' + phase, function () {
      const taskDir = writeTask(repo, 'test-task', {
        protocolVersion: '1.0.0',
        taskId: 'test-task',
        phase: phase,
        planRound: 1,
        codeRound: 1,
        maxRounds: 3
      })
      fs.writeFileSync(path.join(taskDir, 'reviews', 'plan-review-1.json'), JSON.stringify(review()))
      writeCleanBaseline(repo, taskDir)
      const baseline = JSON.parse(fs.readFileSync(path.join(taskDir, 'runtime', 'baseline', 'manifest.json')))
      writeCodeReviewRound(taskDir, 1, review('changes_requested'), codeScope(
        taskDir, 1, baseline.tree, baseline.tree
      ))
      const script = path.resolve(__dirname, '..', 'migrate-workspace.js')
      expect(function () {
        childProcess.execFileSync('node', [script, '--task-id', 'test-task'], { cwd: repo, encoding: 'utf8' })
      }).toThrow(/latest code review must be approved or reach maxRounds/)
      expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json'))).protocolVersion).toBe('1.0.0')
      expect(fs.existsSync(path.join(taskDir, 'runtime', 'protocol-migration.json'))).toBe(false)
    })
  })

  test('allows changes-requested code review at maxRounds to reach final confirmation', function () {
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: '1.0.0',
      taskId: 'test-task',
      phase: 'awaiting_final_confirm',
      planRound: 1,
      codeRound: 1,
      maxRounds: 1
    })
    fs.writeFileSync(path.join(taskDir, 'reviews', 'plan-review-1.json'), JSON.stringify(review()))
    writeCleanBaseline(repo, taskDir)
    const baseline = JSON.parse(fs.readFileSync(path.join(taskDir, 'runtime', 'baseline', 'manifest.json')))
    writeCodeReviewRound(taskDir, 1, review('changes_requested'), codeScope(
      taskDir, 1, baseline.tree, baseline.tree
    ))
    const script = path.resolve(__dirname, '..', 'migrate-workspace.js')
    const output = JSON.parse(childProcess.execFileSync('node', [script, '--task-id', 'test-task'], {
      cwd: repo,
      encoding: 'utf8'
    }))
    expect(output.protocolVersion).toBe(u.protocolVersion)
    expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json'))).protocolVersion).toBe(u.protocolVersion)
  })

  ;[
    {
      phase: 'awaiting_plan_confirm',
      codeRound: 0,
      prepare: function (taskDir) {
        fs.writeFileSync(path.join(taskDir, 'reviews', 'plan-review-1.json'), JSON.stringify(review()))
      }
    },
    {
      phase: 'awaiting_final_confirm',
      codeRound: 1,
      prepare: function (taskDir) {
        fs.writeFileSync(path.join(taskDir, 'reviews', 'plan-review-1.json'), JSON.stringify(review()))
        const baseline = JSON.parse(fs.readFileSync(path.join(taskDir, 'runtime', 'baseline', 'manifest.json')))
        writeCodeReviewRound(taskDir, 1, review(), codeScope(taskDir, 1, baseline.tree, baseline.tree))
      }
    }
  ].forEach(function (testCase) {
    test('keeps managed legacy ' + testCase.phase + ' workspace read-only', function () {
      const taskDir = writeTask(repo, 'test-task', {
        protocolVersion: '1.0.0',
        taskId: 'test-task',
        phase: testCase.phase,
        planRound: 1,
        codeRound: testCase.codeRound,
        maxRounds: 3,
        platform: 'codex'
      })
      writeCleanBaseline(repo, taskDir)
      testCase.prepare(taskDir)
      const script = path.resolve(__dirname, '..', 'migrate-workspace.js')

      expect(function () {
        childProcess.execFileSync('node', [script, '--task-id', 'test-task'], {
          cwd: repo,
          encoding: 'utf8'
        })
      }).toThrow(/cannot migrate a managed confirmation phase without its immutable reviewer run/)
      expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json'))).protocolVersion).toBe('1.0.0')
      expect(fs.existsSync(path.join(taskDir, 'runtime', 'protocol-migration.json'))).toBe(false)
    })
  })

  test('legacy review validation is explicitly read-only', function () {
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: '1.0.0',
      taskId: 'test-task',
      phase: 'plan_reviewing',
      planRound: 0,
      codeRound: 0
    })
    const reviewFile = path.join(taskDir, 'reviews', 'plan-review-1.json')
    fs.writeFileSync(reviewFile, JSON.stringify({
      round: 1,
      status: 'approved',
      summary: 'Legacy approval.',
      findings: []
    }))
    const script = path.resolve(__dirname, '..', 'validate-review-json.js')
    const output = JSON.parse(childProcess.execFileSync('node', [
      script, '--review', reviewFile, '--legacy-read-only'
    ], { cwd: repo, encoding: 'utf8' }))
    expect(output).toEqual(expect.objectContaining({ contract: 'legacy-read-only', resumable: false }))
  })

  test('blocks unsafe legacy code-review recovery without rewriting state', function () {
    const state = {
      protocolVersion: '1.0.0',
      taskId: 'test-task',
      phase: 'code_reviewing',
      planRound: 1,
      codeRound: 2
    }
    writeTask(repo, 'test-task', state)
    const script = path.resolve(__dirname, '..', 'migrate-workspace.js')
    expect(function () {
      childProcess.execFileSync('node', [script, '--task-id', 'test-task'], { cwd: repo, encoding: 'utf8' })
    }).toThrow(/cannot be safely migrated/)
    expect(JSON.parse(fs.readFileSync(path.join(
      repo, '.agent-workflows', 'review-loop', 'test-task', 'state.json'
    ))).protocolVersion).toBe('1.0.0')
  })
})

describe('role preparation', function () {
  let repo

  beforeEach(function () {
    repo = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-roles-'))
    const taskDir = path.join(repo, '.agent-workflows', 'review-loop', 'test-task')
    fs.mkdirSync(path.join(taskDir, 'runtime', 'roles'), { recursive: true })
    fs.writeFileSync(path.join(taskDir, 'state.json'), JSON.stringify({
      protocolVersion: u.protocolVersion,
      taskId: 'test-task',
      phase: 'plan_drafting',
      roleMode: '',
      platform: ''
    }))
  })

  afterEach(function () {
    fs.rmSync(repo, { recursive: true, force: true })
  })

  function prepare (platform, args) {
    const script = path.resolve(__dirname, '..', 'prepare-agent-roles.js')
    return JSON.parse(childProcess.execFileSync('node', [script, '--task-id', 'test-task', '--platform', platform].concat(args), {
      cwd: repo,
      encoding: 'utf8'
    }))
  }

  test('writes all Codex review-loop subagents', function () {
    expect(function () { prepare('codex', ['--mode', 'temporary']) }).toThrow(/does not discover temporary roles/)

    const prepared = prepare('codex', ['--mode', 'project'])
    const projectRoles = prepared.roleDir
    expect(fs.readdirSync(projectRoles).sort()).toEqual([
      'code-reviewer.toml', 'coder.toml', 'plan-reviewer.toml', 'planner.toml'
    ])
    expect(fs.readFileSync(path.join(projectRoles, 'planner.toml'), 'utf8')).toContain('name = "planner"')
    expect(fs.readFileSync(path.join(projectRoles, 'coder.toml'), 'utf8')).toContain('name = "coder"')

    expect(prepare('codex', ['--mode', 'auto']).status).toBe('ready')

    fs.appendFileSync(path.join(projectRoles, 'coder.toml'), '\n# stale\n')
    const stale = prepare('codex', ['--mode', 'auto'])
    expect(stale.status).toBe('stale_roles')
    expect(stale.staleRoles).toEqual(['coder.toml'])
    expect(stale.choices).toEqual(['project'])
  })

  test('writes all Claude Code review-loop subagents', function () {
    const temporary = prepare('claude-code', ['--mode', 'temporary'])
    const runtimeRoles = temporary.roleDir
    expect(fs.readdirSync(runtimeRoles).sort()).toEqual([
      'code-reviewer.md', 'coder.md', 'plan-reviewer.md', 'planner.md'
    ])

    const planner = fs.readFileSync(path.join(runtimeRoles, 'planner.md'), 'utf8')
    expect(planner).toContain('name: planner')
    expect(planner).not.toContain('permissionMode: plan')

    const projectRoles = path.join(repo, '.claude', 'agents')
    fs.mkdirSync(projectRoles, { recursive: true })
    fs.readdirSync(runtimeRoles).forEach(function (file) {
      fs.copyFileSync(path.join(runtimeRoles, file), path.join(projectRoles, file))
    })
    expect(prepare('claude-code', ['--mode', 'auto']).status).toBe('ready')

    fs.appendFileSync(path.join(projectRoles, 'coder.md'), '\n# stale\n')
    const stale = prepare('claude-code', ['--mode', 'auto'])
    expect(stale.status).toBe('stale_roles')
    expect(stale.staleRoles).toEqual(['coder.md'])
    expect(stale.choices).toEqual(['temporary', 'project'])

    const refreshed = prepare('claude-code', ['--mode', 'project'])
    expect(fs.realpathSync(refreshed.roleDir)).toBe(fs.realpathSync(projectRoles))
    expect(fs.readFileSync(path.join(projectRoles, 'coder.md'), 'utf8')).toBe(
      fs.readFileSync(path.join(runtimeRoles, 'coder.md'), 'utf8')
    )
    expect(prepare('claude-code', ['--mode', 'auto']).status).toBe('ready')
  })
})
