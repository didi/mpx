#!/usr/bin/env node
'use strict'

const childProcess = require('child_process')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const persist = require('./persist-review-json')
const snapshot = require('./git-snapshot')
const u = require('./review-loop-utils')

function reviewerRole (kind) {
  if (kind === 'plan') return 'plan-reviewer'
  if (kind === 'code') return 'code-reviewer'
  u.fail('Reviewer kind must be plan or code')
}

function artifactPath (taskId, kind, round) {
  return path.join(
    u.taskDir(taskId),
    'runtime',
    'reviewer-runs',
    kind + '-review-' + round + '.json'
  )
}

function taskPath (taskId, file) {
  return path.posix.join('.agent-workflows', 'review-loop', taskId, file)
}

function inputs (taskId, kind, round) {
  const role = reviewerRole(kind)
  const files = [
    path.posix.join('.agents', 'skills', 'review-loop', 'templates', 'roles', role + '.md'),
    path.posix.join('.agents', 'skills', 'review-loop', 'schemas', 'review.schema.json'),
    taskPath(taskId, 'goal.md'),
    taskPath(taskId, 'plan.md')
  ]
  if (kind === 'plan') {
    Array.from({ length: round - 1 }, function (_, index) { return index + 1 }).forEach(function (reviewRound) {
      files.push(taskPath(taskId, 'reviews/plan-review-' + reviewRound + '.json'))
    })
  } else {
    ;['code-diff-', 'code-round-', 'code-scope-'].forEach(function (prefix) {
      files.push(taskPath(taskId, 'diffs/' + prefix + round + (prefix === 'code-scope-' ? '.json' : '.patch')))
    })
    files.push(taskPath(taskId, 'logs/coder-' + round + '.md'))
    Array.from({ length: round - 1 }, function (_, index) { return index + 1 }).forEach(function (reviewRound) {
      files.push(taskPath(taskId, 'reviews/code-review-' + reviewRound + '.json'))
    })
  }
  return files
}

function inputDigests (files) {
  return files.map(function (file) {
    return {
      path: file,
      sha256: inputDigest(file)
    }
  })
}

function inputDigest (file) {
  const absoluteFile = path.join(u.repoRoot(), file)
  const stat = fs.lstatSync(absoluteFile)
  if (stat.isSymbolicLink() || !stat.isFile()) {
    u.fail('Reviewer input must be a regular non-symlink file: ' + absoluteFile)
  }
  return crypto.createHash('sha256').update(fs.readFileSync(absoluteFile)).digest('hex')
}

function runner (platform, kind) {
  if (platform === 'codex') return 'codex exec review'
  if (platform === 'claude-code') return kind === 'code' ? 'claude /code-review' : 'claude -p'
  u.fail('Unsupported reviewer platform: ' + platform)
}

function prompt (taskId, kind, round, platform) {
  const source = reviewerConfig(platform, kind).source
  return [
    'Run the reviewer role using only the repository paths listed below as initial task input.',
    'Do not assume or reconstruct any parent, planner, or coder conversation.',
    'Read the role instructions first and return exactly one JSON object matching the listed schema.',
    'Do not modify repository files.',
    'Return reviewerConfig for schema compliance; the runner will replace it with the command-derived model, effort, read-only mode, and source "' + source + '".',
    '',
    inputs(taskId, kind, round).join('\n')
  ].join('\n') + '\n'
}

function command (platform, taskId, kind, round) {
  const config = reviewerConfig(platform, kind)
  if (platform === 'codex') {
    return [
      'codex',
      '--sandbox', config.sandboxMode,
      '--model', config.model,
      '--config', 'model_reasoning_effort="' + config.reasoningEffort + '"',
      'exec', 'review',
      '--ephemeral',
      '--output-schema', path.posix.join('.agents', 'skills', 'review-loop', 'schemas', 'review.schema.json'),
      '-'
    ]
  }
  if (platform === 'claude-code') {
    const invocation = [
      'claude',
      '-p',
      '--no-session-persistence',
      '--model', config.model,
      '--effort', config.reasoningEffort,
      '--permission-mode', 'plan',
      '--disallowedTools', 'Edit,Write,NotebookEdit',
      '--output-format', 'json',
      '--json-schema', JSON.stringify(u.readJson(path.join(u.skillRoot(), 'schemas', 'review.schema.json')))
    ]
    if (kind === 'code') {
      invocation.push(
        '--append-system-prompt', prompt(taskId, kind, round, platform),
        '/code-review high ' + taskPath(taskId, 'diffs/code-diff-' + round + '.patch')
      )
    } else {
      invocation.push(prompt(taskId, kind, round, platform))
    }
    return invocation
  }
  u.fail('Unsupported reviewer platform: ' + platform)
}

function request (taskId, kind, round, platform) {
  if (!u.isPositiveInteger(round)) u.fail('Reviewer round must be a positive integer')
  const files = inputs(taskId, kind, round)
  const value = {
    protocolVersion: u.protocolVersion,
    taskId: taskId,
    platform: platform,
    kind: kind,
    round: round,
    role: reviewerRole(kind),
    runner: runner(platform, kind),
    command: command(platform, taskId, kind, round),
    repository: '.',
    initialMessagePolicy: 'paths-only',
    inputs: files,
    inputDigests: inputDigests(files),
    output: taskPath(taskId, 'reviews/' + kind + '-review-' + round + '.json')
  }
  if (kind === 'code') value.snapshotTree = snapshot.validateRoundSnapshot(taskId, round).currentTree
  return value
}

function writeArtifact (taskId, kind, round, reviewRequest, review) {
  const file = artifactPath(taskId, kind, round)
  const content = JSON.stringify({
    request: reviewRequest,
    review: review
  }, null, 2) + '\n'
  u.ensureDir(path.dirname(file))
  try {
    fs.writeFileSync(file, content, { flag: 'wx' })
  } catch (err) {
    if (err.code !== 'EEXIST') throw err
    if (u.readRegularText(file, 'Reviewer run artifact') !== content) {
      u.fail('Reviewer run artifact already exists with different content: ' + file)
    }
  }
  return file
}

function artifactDigest (taskId, kind, round) {
  return crypto.createHash('sha256').update(u.readRegularText(
    artifactPath(taskId, kind, round),
    'Reviewer run artifact'
  )).digest('hex')
}

function reviewerConfig (platform, kind) {
  return {
    model: platform === 'codex' ? 'gpt-5.6' : 'opus',
    reasoningEffort: 'high',
    sandboxMode: 'read-only',
    source: platform === 'codex'
      ? 'codex-exec-review-command'
      : kind === 'code' ? 'claude-code-review-command' : 'claude-plan-review-command'
  }
}

function normalizeReviewerConfig (platform, kind, raw) {
  const review = JSON.parse(raw)
  if (review && review.evidence && typeof review.evidence === 'object' && !Array.isArray(review.evidence)) {
    review.evidence.reviewerConfig = reviewerConfig(platform, kind)
  }
  return JSON.stringify(review)
}

function validateReviewerConfig (review, platform, kind) {
  const actual = review && review.evidence && review.evidence.reviewerConfig
  if (JSON.stringify(actual) !== JSON.stringify(reviewerConfig(platform, kind))) {
    u.fail('Reviewer run artifact must contain the state-derived reviewer configuration')
  }
}

function requireValid (taskId, kind, round, platform) {
  const completed = requireBoundInputs(taskId, kind, round, platform)
  persist.validate(taskId, kind, round, JSON.stringify(completed.review))
  return completed
}

function requireBoundInputs (taskId, kind, round, platform) {
  const file = artifactPath(taskId, kind, round)
  let actual
  try {
    actual = JSON.parse(u.readRegularText(file, 'Reviewer run artifact'))
  } catch (err) {
    u.fail('Invalid reviewer run artifact: ' + err.message)
  }
  if (!actual || typeof actual !== 'object' || Array.isArray(actual) ||
    JSON.stringify(actual.request) !== JSON.stringify(request(taskId, kind, round, platform))) {
    u.fail('Invalid reviewer run artifact: request must exactly match the state-derived reviewer invocation')
  }
  const errors = u.validateReviewObject(actual.review)
  if (actual.review && actual.review.round !== round) errors.push('review round must equal expected round ' + round)
  if (kind === 'code') {
    errors.push.apply(errors, u.validateReviewScope(
      actual.review,
      u.readJson(path.join(u.taskDir(taskId), 'diffs', 'code-scope-' + round + '.json')),
      round
    ))
  }
  if (errors.length) u.fail('Invalid reviewer run artifact review:\n- ' + errors.join('\n- '))
  validateReviewerConfig(actual.review, platform, kind)
  return { file: file, review: actual.review }
}

function requireForState (state, taskId, kind, round) {
  if (state.platform !== 'codex' && state.platform !== 'claude-code') return
  const completed = requireValid(taskId, kind, round, state.platform)
  const reviewFile = u.reviewArtifactPath(taskId, kind, round)
  const expected = JSON.stringify(completed.review, null, 2) + '\n'
  if (u.readReviewArtifact(reviewFile) !== expected) {
    u.fail('Persisted review must exactly match the reviewer run artifact')
  }
  return completed
}

function confirmationDrift (state, taskId, kind, round) {
  if (state.platform !== 'codex' && state.platform !== 'claude-code') {
    return { changed: false, changedPaths: [] }
  }
  const file = artifactPath(taskId, kind, round)
  const content = u.readRegularText(file, 'Reviewer run artifact')
  if (!state.lastReviewerRunDigest ||
    crypto.createHash('sha256').update(content).digest('hex') !== state.lastReviewerRunDigest) {
    u.fail('Reviewer run artifact changed after state advancement')
  }
  const actual = JSON.parse(content)
  if (!actual || typeof actual !== 'object' || Array.isArray(actual)) {
    u.fail('Invalid reviewer run artifact')
  }
  const errors = u.validateReviewObject(actual.review)
  if (actual.review && actual.review.round !== round) errors.push('review round must equal expected round ' + round)
  if (errors.length) u.fail('Invalid reviewer run artifact review:\n- ' + errors.join('\n- '))
  validateReviewerConfig(actual.review, state.platform, kind)
  const reviewFile = u.reviewArtifactPath(taskId, kind, round)
  if (u.readReviewArtifact(reviewFile) !== JSON.stringify(actual.review, null, 2) + '\n') {
    u.fail('Persisted review must exactly match the reviewer run artifact')
  }
  if (kind === 'plan') {
    const planPath = taskPath(taskId, 'plan.md')
    const bound = actual.request && Array.isArray(actual.request.inputDigests) &&
      actual.request.inputDigests.find(function (item) { return item.path === planPath })
    if (!bound || typeof bound.sha256 !== 'string') u.fail('Reviewer run artifact is missing the plan digest')
    const current = inputDigest(planPath)
    return {
      changed: bound.sha256 !== current,
      changedPaths: bound.sha256 === current ? [] : [planPath],
      reviewedValue: bound.sha256,
      currentValue: current
    }
  }
  const reviewedTree = actual.request && actual.request.snapshotTree
  if (typeof reviewedTree !== 'string' || !reviewedTree) {
    u.fail('Reviewer run artifact is missing the reviewed snapshot tree')
  }
  const drift = snapshot.snapshotDrift(taskId, reviewedTree)
  return {
    changed: drift.changedPaths.length > 0,
    changedPaths: drift.changedPaths,
    reviewedValue: drift.reviewedTree,
    currentValue: drift.currentTree
  }
}

function reviewOutput (platform, raw) {
  if (platform === 'codex') return raw
  let result
  try {
    result = JSON.parse(raw)
  } catch (err) {
    u.fail('Claude reviewer output must be a JSON result envelope: ' + err.message)
  }
  if (!result || result.subtype !== 'success' || !result.structured_output) {
    u.fail('Claude reviewer did not return a successful structured_output result')
  }
  return JSON.stringify(result.structured_output)
}

function execute (state, taskId, kind, round) {
  const platform = state.platform
  const file = artifactPath(taskId, kind, round)
  let completed
  if (fs.existsSync(file)) {
    completed = requireValid(taskId, kind, round, platform)
  } else {
    const reviewRequest = request(taskId, kind, round, platform)
    const invocation = reviewRequest.command
    const result = childProcess.spawnSync(invocation[0], invocation.slice(1), {
      cwd: u.repoRoot(),
      input: platform === 'codex' ? prompt(taskId, kind, round, platform) : undefined,
      encoding: 'utf8',
      maxBuffer: 100 * 1024 * 1024
    })
    if (result.stderr) process.stderr.write(result.stderr)
    if (result.error) u.fail('Unable to start reviewer: ' + result.error.message)
    if (result.status !== 0) u.fail(runner(platform, kind) + ' exited with status ' + result.status)
    const validated = persist.validate(taskId, kind, round, normalizeReviewerConfig(
      platform,
      kind,
      reviewOutput(platform, result.stdout)
    ))
    if (JSON.stringify(request(taskId, kind, round, platform)) !== JSON.stringify(reviewRequest)) {
      u.fail('Reviewer inputs changed while the reviewer was running')
    }
    completed = {
      file: writeArtifact(taskId, kind, round, reviewRequest, validated.review),
      review: validated.review
    }
  }
  const persisted = persist.persist(taskId, kind, round, JSON.stringify(completed.review), {
    reviewerRun: true
  })
  return {
    ok: true,
    runner: runner(platform, kind),
    run: completed.file,
    review: persisted.review,
    status: persisted.status
  }
}

function main () {
  const args = u.parseArgs(process.argv)
  const taskId = args['task-id']
  const kind = args.kind
  const round = Number(args.round)
  if (!taskId) u.fail('Missing --task-id')
  if (kind !== 'plan' && kind !== 'code') u.fail('--kind must be plan or code')
  if (!u.isPositiveInteger(round)) u.fail('--round must be a positive integer')

  const state = u.readState(taskId)
  u.requireCurrentProtocol(state)
  if (state.platform !== 'codex' && state.platform !== 'claude-code') {
    u.fail('run-reviewer.js requires platform codex or claude-code')
  }
  if (state.phase !== kind + '_reviewing') {
    u.fail('Running a ' + kind + ' reviewer requires phase ' + kind + '_reviewing')
  }
  if (round !== state[kind + 'Round'] + 1) {
    u.fail('--round must equal state-derived next round ' + (state[kind + 'Round'] + 1))
  }

  process.stdout.write(JSON.stringify(execute(state, taskId, kind, round), null, 2) + '\n')
}

if (require.main === module) {
  try {
    main()
  } catch (err) {
    console.error(err.message)
    process.exit(err.exitCode || 1)
  }
}

module.exports = {
  artifactPath,
  artifactDigest,
  command,
  confirmationDrift,
  inputs,
  prompt,
  request,
  reviewOutput,
  reviewerConfig,
  requireValid,
  requireForState,
  execute
}
