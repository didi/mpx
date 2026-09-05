'use strict'

const childProcess = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const snapshot = require('../git-snapshot')
const reviewManager = require('../review-manager')
const reviewDocument = require('../review-markdown')
const u = require('../review-loop-utils')

function evidence () {
  return {
    reviewedPaths: ['AGENTS.md', 'src/example.js'],
    residualRisks: []
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

function reviewMarkdown (value) {
  return reviewDocument.render(value || review())
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
  ;['plan-reviewer.md', 'code-reviewer.md'].forEach(function (file) {
    fs.copyFileSync(
      path.resolve(__dirname, '..', '..', 'templates', 'roles', file),
      path.join(skillDir, 'templates', 'roles', file)
    )
  })
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
  fs.writeFileSync(path.join(taskDir, 'reviews', 'code-review-' + round + '.md'), reviewMarkdown(value))
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
  fs.writeFileSync(path.join(taskDir, 'reviews', 'plan-review-1.md'), reviewMarkdown(review()))
  const scope = codeScope(taskDir, 1, baseline.tree, baseline.tree)
  writeCodeReviewRound(taskDir, 1, review(), scope)
  return { taskDir: taskDir, scope: scope }
}

function writeLegacySnapshotRound (repo, taskDir, round) {
  const originalCwd = process.cwd()
  process.chdir(repo)
  try {
    const trees = snapshot.reviewTrees('test-task')
    const previousTree = round === 1
      ? trees.baselineTree
      : JSON.parse(fs.readFileSync(path.join(taskDir, 'diffs', 'code-scope-' + (round - 1) + '.json'))).currentTree
    const roundPaths = snapshot.diffPaths('test-task', previousTree, trees.currentTree)
    const scope = {
      round: round,
      baselineHead: JSON.parse(fs.readFileSync(path.join(taskDir, 'runtime', 'baseline', 'manifest.json'))).head,
      baselineTree: trees.baselineTree,
      previousTree: previousTree,
      currentTree: trees.currentTree,
      cumulativePaths: trees.changedPaths,
      roundPaths: roundPaths,
      claimedPaths: roundPaths,
      unexpectedPaths: []
    }
    fs.writeFileSync(path.join(taskDir, 'diffs', 'code-diff-' + round + '.patch'),
      snapshot.diffTrees('test-task', trees.baselineTree, trees.currentTree))
    fs.writeFileSync(path.join(taskDir, 'diffs', 'code-round-' + round + '.patch'),
      snapshot.diffTrees('test-task', previousTree, trees.currentTree))
    fs.writeFileSync(path.join(taskDir, 'diffs', 'code-scope-' + round + '.json'), JSON.stringify(scope))
    return scope
  } finally {
    process.chdir(originalCwd)
  }
}

function writeCumulativeSnapshotRound (repo, taskDir, round) {
  const originalCwd = process.cwd()
  process.chdir(repo)
  try {
    const trees = snapshot.reviewTrees('test-task')
    const baseline = JSON.parse(fs.readFileSync(path.join(taskDir, 'runtime', 'baseline', 'manifest.json')))
    const scope = {
      round: round,
      baselineHead: baseline.head,
      baselineTree: trees.baselineTree,
      currentTree: trees.currentTree,
      cumulativePaths: trees.changedPaths
    }
    fs.writeFileSync(path.join(taskDir, 'diffs', 'code-diff-' + round + '.patch'),
      snapshot.diffTrees('test-task', trees.baselineTree, trees.currentTree))
    fs.writeFileSync(path.join(taskDir, 'diffs', 'code-scope-' + round + '.json'), JSON.stringify(scope))
    return scope
  } finally {
    process.chdir(originalCwd)
  }
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
  fs.writeFileSync(path.join(taskDir, 'reviews', 'plan-review-1.md'), reviewMarkdown(review()))
  fs.writeFileSync(path.join(repo, 'tracked.txt'), 'changed\n')
  const scope = writeCumulativeSnapshotRound(repo, taskDir, 1)
  fs.writeFileSync(path.join(taskDir, 'reviews', 'code-review-1.md'), reviewMarkdown(review()))
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
  const scope = writeCumulativeSnapshotRound(repo, fixture.taskDir, 2)
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
    const scope = writeLegacySnapshotRound(repo, taskDir, 1)
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
    expect(systemPrompt).toContain('.agent-workflows/review-loop/test-task/diffs/code-diff-1.patch')
    expect(systemPrompt).not.toContain('code-scope-1.json')
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
      const persist = path.resolve(__dirname, '..', 'persist-review-markdown.js')
      const args = [persist, '--task-id', 'test-task', '--kind', 'plan', '--round', '1']
      expect(function () {
        childProcess.execFileSync('node', args, {
          cwd: repo,
          input: reviewMarkdown(review()),
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
      '.agent-workflows/review-loop/test-task/runtime/baseline/manifest.json',
      '.agent-workflows/review-loop/test-task/diffs/code-diff-2.patch',
      '.agent-workflows/review-loop/test-task/logs/coder-2.md',
      '.agent-workflows/review-loop/test-task/reviews/code-review-1.md'
    ]))
    expect(reviewManager.inputs('test-task', 'code', 2).some(function (item) {
      return item.includes('code-scope-') || item.includes('code-round-')
    })).toBe(false)
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
    fs.writeFileSync(resultFile, reviewMarkdown(output))
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
      expect(completed.prepared.prompt).toContain('每一轮都要创建新实例')
      expect(completed.prepared.prompt).toContain('不得恢复或复用任何之前创建的 reviewer')
      expect(completed.prepared.prompt).toContain('不得继承父级会话')
      expect(completed.prepared.prompt).toContain('所有自然语言评审内容必须使用中文')
      expect(completed.prepared.prompt).not.toContain('# Plan')
      expect(completed.finalized).toEqual(expect.objectContaining({
        runner: 'native-subagent',
        status: 'approved',
        review: expect.stringMatching(/plan-review-1\.md$/)
      }))
      expect(reviewDocument.parse(fs.readFileSync(completed.finalized.review, 'utf8'))).toEqual(expect.objectContaining({
        round: 1,
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
      expect(artifact.execution.reviewerConfig).toEqual(reviewManager.reviewerConfig(platform))
      expect(artifact.reviewDocument).toBe(fs.readFileSync(completed.finalized.review, 'utf8'))
      fs.rmSync(repo, { recursive: true, force: true })
    })
  })

  test('binds the baseline-to-worktree patch as a code reviewer input', function () {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-native-code-'))
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: u.protocolVersion,
      taskId: 'test-task',
      phase: 'code_reviewing',
      planRound: 1,
      codeRound: 0,
      platform: 'codex'
    })
    writeReviewerInputs(repo)
    writeCleanBaseline(repo, taskDir)
    fs.writeFileSync(path.join(taskDir, 'logs', 'coder-1.md'), '# 验证结果\n\n已通过。\n')
    fs.writeFileSync(path.join(repo, 'tracked.txt'), 'reviewed change\n')
    fs.rmSync(path.join(taskDir, 'diffs'), { recursive: true })

    const completed = prepareAndFinalize(repo, taskDir, 'codex', 'code', review(), 'code-agent-1')
    const request = JSON.parse(fs.readFileSync(path.join(
      taskDir, 'runtime', 'reviewer-runs', 'code-review-1.request.json'
    ), 'utf8'))
    expect(request.inputs).toEqual(expect.arrayContaining([
      '.agent-workflows/review-loop/test-task/runtime/baseline/manifest.json',
      '.agent-workflows/review-loop/test-task/diffs/code-diff-1.patch',
      '.agent-workflows/review-loop/test-task/logs/coder-1.md'
    ]))
    const diffInput = request.inputDigests.find(function (item) {
      return item.path === '.agent-workflows/review-loop/test-task/diffs/code-diff-1.patch'
    })
    expect(diffInput.sha256).toMatch(/^[a-f0-9]{64}$/)
    expect(request.baselineTree).toMatch(/^[a-f0-9]{40}$/)
    expect(request.snapshotTree).toMatch(/^[a-f0-9]{40}$/)
    expect(request.snapshotTree).not.toBe(request.baselineTree)
    expect(completed.prepared.prompt).toContain('.agent-workflows/review-loop/test-task/diffs/code-diff-1.patch')
    const originalCwd = process.cwd()
    process.chdir(repo)
    let generatedDiff
    try {
      generatedDiff = snapshot.diffTrees('test-task', request.baselineTree, request.snapshotTree)
    } finally {
      process.chdir(originalCwd)
    }
    expect(generatedDiff).toContain('reviewed change')
    expect(completed.prepared.diff.endsWith(path.join('diffs', 'code-diff-1.patch'))).toBe(true)
    expect(fs.readFileSync(completed.prepared.diff, 'utf8')).toBe(generatedDiff)
    fs.appendFileSync(completed.prepared.diff, '\ntampered\n')
    process.chdir(repo)
    try {
      expect(function () {
        reviewManager.requireValid('test-task', 'code', 1, 'codex')
      }).toThrow(/request must exactly match|Code review diff must exactly match/)
    } finally {
      process.chdir(originalCwd)
    }
    fs.rmSync(repo, { recursive: true, force: true })
  })

  test('rejects a reviewer agent reused from any previous round', function () {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-native-reused-agent-'))
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
    fs.writeFileSync(path.join(taskDir, 'runtime', 'reviewer-runs', 'code-review-1.json'), JSON.stringify({
      execution: { agentId: 'reused-reviewer' }
    }))
    const resultFile = path.join(os.tmpdir(), 'review-loop-native-reused-agent-' + process.pid + '.json')
    fs.writeFileSync(resultFile, reviewMarkdown(review()))
    expect(function () {
      childProcess.execFileSync('node', args.concat([
        '--finalize', '--input', resultFile, '--agent-id', 'reused-reviewer'
      ]), { cwd: repo, encoding: 'utf8' })
    }).toThrow(/--agent-id 不得与历史 reviewer-run 重复/)
    fs.rmSync(resultFile)
    fs.rmSync(repo, { recursive: true, force: true })
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
    fs.writeFileSync(resultFile, reviewMarkdown(review()))
    expect(function () {
      childProcess.execFileSync('node', args.concat([
        '--finalize', '--input', resultFile, '--agent-id', 'codex-agent-1'
      ]), { cwd: repo, encoding: 'utf8' })
    }).toThrow(/inputs or workspace tree changed after prepare/)
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
      const script = path.resolve(__dirname, '..', 'persist-review-markdown.js')
      expect(function () {
        childProcess.execFileSync('node', [
          script, '--task-id', 'test-task', '--kind', 'plan', '--round', '1'
        ], { cwd: repo, input: reviewMarkdown(review()), encoding: 'utf8' })
      }).toThrow(/must be finalized and persisted by review-manager.js/)
      fs.rmSync(repo, { recursive: true, force: true })
    })
  })
})

describe('review evidence validation', function () {
  test('round-trips the structured Markdown review format', function () {
    expect(reviewDocument.parse(reviewMarkdown(review()))).toEqual(review())
  })

  test('omits process evidence sections from reviewer output', function () {
    const markdown = reviewMarkdown(review())
    ;['符号追踪', '验证记录', '反例检查', '差异范围'].forEach(function (heading) {
      expect(markdown).not.toContain('## ' + heading)
    })
  })

  test('round-trips residual risks as list items', function () {
    const value = review()
    value.evidence.residualRisks.push('真实设备行为仍需验证。')
    expect(reviewDocument.parse(reviewMarkdown(value))).toEqual(value)
  })

  test('rejects a bare JSON reviewer response', function () {
    expect(function () { reviewDocument.parse(JSON.stringify(review())) }).toThrow(/不符合固定格式/)
  })

  test('allows JSON code blocks inside a valid Markdown review section', function () {
    const value = review()
    value.summary = '示例：\n\n```json\n{"ok":true}\n```'
    expect(reviewDocument.parse(reviewMarkdown(value))).toEqual(value)
  })

  test('accepts an evidenced approval', function () {
    expect(u.validateReviewObject(review())).toEqual([])
  })

  test('rejects an approval without evidence', function () {
    const value = review()
    delete value.evidence
    expect(u.validateReviewObject(value)).toContain('evidence must be an object')
  })

  test('rejects removed process evidence fields', function () {
    const value = review()
    value.evidence.diffScope = {}
    expect(u.validateReviewObject(value)).toContain('evidence must not contain additional property diffScope')
  })

  test('keeps reviewer runtime configuration out of the Markdown document', function () {
    expect(reviewMarkdown(review())).not.toContain('reviewerConfig')
    expect(reviewMarkdown(review())).not.toContain('```json')
  })

  test('enters code reviewing after validating baseline and current worktree without diff artifacts', function () {
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
    }).toThrow(/manifest\.json/)
    expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json'))).phase).toBe('code_drafting')

    writeCleanBaseline(repo, taskDir)
    fs.writeFileSync(path.join(repo, 'tracked.txt'), 'changed\n')
    fs.rmSync(path.join(taskDir, 'diffs'), { recursive: true })
    childProcess.execFileSync('node', args, { cwd: repo, encoding: 'utf8' })
    expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json'))).phase).toBe('code_reviewing')
    expect(fs.existsSync(path.join(taskDir, 'diffs'))).toBe(false)
    fs.rmSync(repo, { recursive: true, force: true })
  })

  test('validator checks the compact review without scope metadata', function () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-validator-'))
    const reviewsDir = path.join(dir, 'reviews')
    fs.mkdirSync(reviewsDir)
    const reviewFile = path.join(reviewsDir, 'code-review-1.md')
    fs.writeFileSync(reviewFile, reviewMarkdown(review()))
    const validator = path.resolve(__dirname, '..', 'validate-review-markdown.js')
    expect(JSON.parse(childProcess.execFileSync('node', [validator, '--review', reviewFile], {
      encoding: 'utf8'
    })).ok).toBe(true)
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
    const reviewFile = path.join(taskDir, 'reviews', 'code-review-2.md')
    fs.writeFileSync(reviewFile, reviewMarkdown(review()))
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
    const reviewFile = path.join(otherTaskDir, 'reviews', 'code-review-1.md')
    fs.writeFileSync(reviewFile, reviewMarkdown(review()))
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
      lastReviewFile: 'reviews/code-review-2.md',
      terminationReason: ''
    })
    fs.writeFileSync(path.join(taskDir, 'reviews', 'code-review-2.md'), reviewMarkdown(review('changes_requested', 2)))
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
      lastReviewFile: 'reviews/code-review-3.md',
      terminationReason: 'max_rounds_reached'
    })
    fs.writeFileSync(path.join(taskDir, 'reviews', 'code-review-3.md'), reviewMarkdown(review('changes_requested', 3)))
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
      lastReviewFile: 'reviews/plan-review-3.md',
      terminationReason: 'max_rounds_reached'
    })
    fs.writeFileSync(path.join(taskDir, 'reviews', 'plan-review-3.md'), reviewMarkdown(review('changes_requested', 3)))
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
    const otherReviewFile = path.join(otherTaskDir, 'reviews', 'code-review-1.md')
    const reviewFile = path.join(taskDir, 'reviews', 'code-review-1.md')
    const content = reviewMarkdown(review())
    fs.writeFileSync(otherReviewFile, content)
    fs.symlinkSync(otherReviewFile, reviewFile)
    const persist = path.resolve(__dirname, '..', 'persist-review-markdown.js')
    expect(function () {
      childProcess.execFileSync('node', [
        persist, '--task-id', 'current-task', '--kind', 'code', '--round', '1'
      ], { cwd: repo, input: reviewMarkdown(review()), encoding: 'utf8' })
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
    const otherReviewFile = path.join(otherTaskDir, 'reviews', 'code-review-1.md')
    fs.writeFileSync(otherReviewFile, reviewMarkdown(review()))
    fs.rmSync(path.join(taskDir, 'reviews'), { recursive: true })
    fs.symlinkSync(path.join(otherTaskDir, 'reviews'), path.join(taskDir, 'reviews'))
    const reviewFile = path.join(taskDir, 'reviews', 'code-review-1.md')
    const persist = path.resolve(__dirname, '..', 'persist-review-markdown.js')
    expect(function () {
      childProcess.execFileSync('node', [
        persist, '--task-id', 'current-task', '--kind', 'code', '--round', '1'
      ], { cwd: repo, input: reviewMarkdown(review()), encoding: 'utf8' })
    }).toThrow(/Reviews directory must be a canonical non-symlink directory/)
    const advance = path.resolve(__dirname, '..', 'advance-state.js')
    expect(function () {
      childProcess.execFileSync('node', [
        advance, '--task-id', 'current-task', '--event', 'code-review-complete', '--review', reviewFile
      ], { cwd: repo, encoding: 'utf8' })
    }).toThrow(/Reviews directory must be a canonical non-symlink directory/)
    const validate = path.resolve(__dirname, '..', 'validate-review-markdown.js')
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
    fs.writeFileSync(path.join(otherTaskDir, 'reviews', 'plan-review-1.md'), reviewMarkdown(review()))
    writeCleanBaseline(repo, taskDir)
    const migrate = path.resolve(__dirname, '..', 'migrate-workspace.js')
    expect(function () {
      childProcess.execFileSync('node', [migrate, '--task-id', 'current-task'], { cwd: repo, encoding: 'utf8' })
    }).toThrow(/Reviews directory must be a canonical non-symlink directory/)
    expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json'))).protocolVersion).toBe('1.0.0')
    fs.rmSync(repo, { recursive: true, force: true })
  })

  test('rejects additional properties in parsed review data', function () {
    const mutations = [
      function (value) { value.extra = true },
      function (value) { value.evidence.extra = true },
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

  test('orchestrator persists validated Markdown returned by a read-only reviewer', function () {
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
    const script = path.resolve(__dirname, '..', 'persist-review-markdown.js')
    const output = JSON.parse(childProcess.execFileSync('node', [
      script, '--task-id', 'test-task', '--kind', 'code', '--round', '1'
    ], { cwd: repo, input: reviewMarkdown(review()), encoding: 'utf8' }))
    expect(output.status).toBe('approved')
    expect(reviewDocument.parse(fs.readFileSync(path.join(taskDir, 'reviews', 'code-review-1.md'), 'utf8'))).toEqual(review())
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
    const script = path.resolve(__dirname, '..', 'persist-review-markdown.js')
    const args = [script, '--task-id', 'test-task', '--kind', 'code', '--round', '1']
    const reviewFile = path.join(taskDir, 'reviews', 'code-review-1.md')
    const first = childProcess.execFileSync('node', args, {
      cwd: repo,
      input: reviewMarkdown(review()),
      encoding: 'utf8'
    })
    const persisted = fs.readFileSync(reviewFile, 'utf8')
    expect(childProcess.execFileSync('node', args, {
      cwd: repo,
      input: reviewMarkdown(review()),
      encoding: 'utf8'
    })).toBe(first)
    const changed = review()
    changed.summary = 'Different review content.'
    expect(function () {
      childProcess.execFileSync('node', args, {
        cwd: repo,
        input: reviewMarkdown(changed),
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
    const reviewFile = path.join(taskDir, 'reviews', 'code-review-1.md')
    fs.writeFileSync(reviewFile, reviewMarkdown(review()))
    const persisted = fs.readFileSync(reviewFile, 'utf8')
    const changed = review()
    changed.summary = 'Replacement review content.'
    const script = path.resolve(__dirname, '..', 'persist-review-markdown.js')
    expect(function () {
      childProcess.execFileSync('node', [
        script, '--task-id', 'test-task', '--kind', 'code', '--round', '1'
      ], { cwd: repo, input: reviewMarkdown(changed), encoding: 'utf8' })
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
    const script = path.resolve(__dirname, '..', 'persist-review-markdown.js')
    expect(function () {
      childProcess.execFileSync('node', [
        script, '--task-id', 'test-task', '--kind', 'plan', '--round', '1'
      ], { cwd: repo, input: '```json\n{}\n```', encoding: 'utf8' })
    }).toThrow(/pure Markdown document/)
    expect(fs.existsSync(path.join(taskDir, 'reviews', 'plan-review-1.md'))).toBe(false)
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
    fs.writeFileSync(path.join(taskDir, 'reviews', 'plan-review-1.md'), reviewMarkdown(review()))
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

  test('rejects legacy JSON review artifacts without rewriting state', function () {
    const taskDir = writeTask(repo, 'test-task', {
      protocolVersion: '1.0.0',
      taskId: 'test-task',
      phase: 'plan_drafting',
      planRound: 1,
      codeRound: 0,
      maxRounds: 3
    })
    fs.writeFileSync(path.join(taskDir, 'reviews', 'plan-review-1.json'), JSON.stringify(review()))
    writeCleanBaseline(repo, taskDir)
    const script = path.resolve(__dirname, '..', 'migrate-workspace.js')
    expect(function () {
      childProcess.execFileSync('node', [script, '--task-id', 'test-task'], { cwd: repo, encoding: 'utf8' })
    }).toThrow(/JSON review artifacts are unsupported/)
    expect(JSON.parse(fs.readFileSync(path.join(taskDir, 'state.json'))).protocolVersion).toBe('1.0.0')
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

  test('migrated code drafting workspace can reconstruct its next-round diff without scope metadata', function () {
    const fixture = writeMigratableCodeTask(repo)
    const migrate = path.resolve(__dirname, '..', 'migrate-workspace.js')
    childProcess.execFileSync('node', [migrate, '--task-id', 'test-task'], { cwd: repo, encoding: 'utf8' })
    fs.writeFileSync(path.join(repo, 'tracked.txt'), 'round two\n')
    const advance = path.resolve(__dirname, '..', 'advance-state.js')
    childProcess.execFileSync('node', [advance, '--task-id', 'test-task', '--event', 'coder-complete'], {
      cwd: repo,
      encoding: 'utf8'
    })
    const originalCwd = process.cwd()
    process.chdir(repo)
    let diff
    try {
      const trees = snapshot.reviewTrees('test-task')
      diff = snapshot.diffTrees('test-task', trees.baselineTree, trees.currentTree)
      fs.writeFileSync(path.join(fixture.taskDir, 'diffs', 'code-diff-2.patch'), diff)
    } finally {
      process.chdir(originalCwd)
    }
    expect(diff).toContain('round two')
    expect(fs.existsSync(path.join(fixture.taskDir, 'diffs', 'code-scope-2.json'))).toBe(false)
    expect(JSON.parse(fs.readFileSync(path.join(fixture.taskDir, 'state.json'))).protocolVersion).toBe(u.protocolVersion)
  })

  ;[
    {
      name: 'removed current unexpected paths',
      mutate: function (scope) { scope.unexpectedPaths = ['tracked.txt'] },
      error: /must not contain unexpectedPaths/
    },
    {
      name: 'escaping current cumulative path',
      mutate: function (scope) { scope.cumulativePaths = ['../outside.js'] },
      error: /must be an array of non-empty repo-relative paths/
    },
    {
      name: 'removed current claimed paths',
      mutate: function (scope) { scope.claimedPaths = ['tracked.txt'] },
      error: /must not contain claimedPaths/
    }
  ].forEach(function (testCase) {
    test('blocks legacy migration with ' + testCase.name, function () {
      const fixture = writeMigratableCurrentCodeTask(repo)
      testCase.mutate(fixture.scope)
      fs.writeFileSync(path.join(fixture.taskDir, 'diffs', 'code-scope-2.json'), JSON.stringify(fixture.scope))
      const script = path.resolve(__dirname, '..', 'migrate-workspace.js')
      expect(function () {
        childProcess.execFileSync('node', [script, '--task-id', 'test-task'], { cwd: repo, encoding: 'utf8' })
      }).toThrow(testCase.error)
      expect(JSON.parse(fs.readFileSync(path.join(fixture.taskDir, 'state.json'))).protocolVersion).toBe('1.0.0')
      expect(fs.existsSync(path.join(fixture.taskDir, 'runtime', 'protocol-migration.json'))).toBe(false)
    })
  })

  test('migrates a current code scope without exposing scope evidence', function () {
    const fixture = writeMigratableCurrentCodeTask(repo)
    const script = path.resolve(__dirname, '..', 'migrate-workspace.js')
    childProcess.execFileSync('node', [script, '--task-id', 'test-task'], { cwd: repo, encoding: 'utf8' })
    const value = review('approved', 2)
    expect(u.validateReviewObject(value)).toEqual([])
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
      error: /must not contain unexpectedPaths/
    },
    {
      name: 'duplicate claimed paths',
      fixture: writeMigratableChangedCodeTask,
      mutate: function (fixture) { fixture.scope.claimedPaths = ['tracked.txt', 'tracked.txt'] },
      error: /must not contain claimedPaths/
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

  ;['code-diff-1.patch'].forEach(function (patchFile) {
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

  test('migrates code scope with reconstructed cumulative paths and patch', function () {
    const fixture = writeMigratableChangedCodeTask(repo)
    const script = path.resolve(__dirname, '..', 'migrate-workspace.js')
    childProcess.execFileSync('node', [script, '--task-id', 'test-task'], { cwd: repo, encoding: 'utf8' })
    expect(fixture.scope).toEqual(expect.objectContaining({
      cumulativePaths: ['tracked.txt']
    }))
    expect(fixture.scope).not.toHaveProperty('roundPaths')
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
    fs.writeFileSync(path.join(taskDir, 'reviews', 'plan-review-1.md'), '# Review Loop 评审\n')
    writeCleanBaseline(repo, taskDir)
    const script = path.resolve(__dirname, '..', 'migrate-workspace.js')
    expect(function () {
      childProcess.execFileSync('node', [script, '--task-id', 'test-task'], { cwd: repo, encoding: 'utf8' })
    }).toThrow(/评审 Markdown 不符合固定格式/)
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
    fs.writeFileSync(path.join(taskDir, 'reviews', 'plan-review-1.md'), reviewMarkdown(review('changes_requested')))
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
    fs.writeFileSync(path.join(taskDir, 'reviews', 'plan-review-1.md'), reviewMarkdown(review('changes_requested')))
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
      fs.writeFileSync(path.join(taskDir, 'reviews', 'plan-review-1.md'), reviewMarkdown(review()))
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
    fs.writeFileSync(path.join(taskDir, 'reviews', 'plan-review-1.md'), reviewMarkdown(review()))
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
        fs.writeFileSync(path.join(taskDir, 'reviews', 'plan-review-1.md'), reviewMarkdown(review()))
      }
    },
    {
      phase: 'awaiting_final_confirm',
      codeRound: 1,
      prepare: function (taskDir) {
        fs.writeFileSync(path.join(taskDir, 'reviews', 'plan-review-1.md'), reviewMarkdown(review()))
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

  test('rejects legacy JSON review validation', function () {
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
    const script = path.resolve(__dirname, '..', 'validate-review-markdown.js')
    expect(function () {
      childProcess.execFileSync('node', [script, '--review', reviewFile], { cwd: repo, encoding: 'utf8' })
    }).toThrow(/must be a Markdown file/)
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
    expect(fs.readFileSync(path.join(projectRoles, 'planner.toml'), 'utf8')).toContain('负责 review-loop 工作流技术方案编写与修订。')
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
    expect(planner).toContain('description: 负责 review-loop 工作流技术方案编写与修订。')
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
