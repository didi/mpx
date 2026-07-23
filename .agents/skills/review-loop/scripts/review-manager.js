#!/usr/bin/env node
'use strict'

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const persist = require('./persist-review-json')
const snapshot = require('./git-snapshot')
const u = require('./review-loop-utils')

const contextIsolationCheck = {
  command: 'context-isolation-preflight',
  result: 'passed: no parent planner/coder/orchestrator conversation visible'
}

function reviewerRole (kind) {
  if (kind === 'plan') return 'plan-reviewer'
  if (kind === 'code') return 'code-reviewer'
  u.fail('Reviewer kind must be plan or code')
}

function artifactPath (taskId, kind, round) {
  return path.join(u.taskDir(taskId), 'runtime', 'reviewer-runs', kind + '-review-' + round + '.json')
}

function requestPath (taskId, kind, round) {
  return path.join(u.taskDir(taskId), 'runtime', 'reviewer-runs', kind + '-review-' + round + '.request.json')
}

function taskPath (taskId, file) {
  return path.posix.join('.agent-workflows', 'review-loop', taskId, file)
}

function inputs (taskId, kind, round) {
  const files = [
    path.posix.join('.agents', 'skills', 'review-loop', 'templates', 'roles', reviewerRole(kind) + '.md'),
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

function inputDigest (file) {
  const absoluteFile = path.join(u.repoRoot(), file)
  const stat = fs.lstatSync(absoluteFile)
  if (stat.isSymbolicLink() || !stat.isFile()) {
    u.fail('Reviewer input must be a regular non-symlink file: ' + absoluteFile)
  }
  return crypto.createHash('sha256').update(fs.readFileSync(absoluteFile)).digest('hex')
}

function inputDigests (files) {
  return files.map(function (file) { return { path: file, sha256: inputDigest(file) } })
}

function reviewerConfig (platform) {
  return {
    model: 'host-selected',
    reasoningEffort: 'host-selected',
    sandboxMode: 'read-only',
    source: platform === 'codex' ? 'codex-native-subagent' : 'claude-native-subagent'
  }
}

function prompt (taskId, kind, round, platform) {
  return [
    'Run the ' + reviewerRole(kind) + ' role with a fresh context and no inherited planner/coder conversation.',
    'Before reading repository files, run the role\'s context-isolation preflight and include its passed evidence in the review JSON.',
    'Use only the repository paths below as initial task input, then inspect repository evidence as the role requires.',
    'Do not modify repository files. Return exactly one JSON object matching the schema, without a Markdown fence.',
    'Return reviewerConfig for schema compliance; the orchestrator will normalize it to the host-native reviewer contract.',
    '',
    inputs(taskId, kind, round).join('\n')
  ].join('\n') + '\n'
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
    runner: 'native-subagent',
    repository: '.',
    initialMessagePolicy: 'paths-only',
    contextInheritance: 'none',
    writePolicy: 'read-only-with-tree-drift-guard',
    inputs: files,
    inputDigests: inputDigests(files),
    workspaceTree: snapshot.createWorktreeTree(taskId),
    output: taskPath(taskId, 'reviews/' + kind + '-review-' + round + '.json')
  }
  if (kind === 'code') value.snapshotTree = snapshot.validateRoundSnapshot(taskId, round).currentTree
  return value
}

function digest (value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function writeExclusive (file, value, label) {
  const content = JSON.stringify(value, null, 2) + '\n'
  u.ensureDir(path.dirname(file))
  try {
    fs.writeFileSync(file, content, { flag: 'wx' })
  } catch (err) {
    if (err.code !== 'EEXIST') throw err
    if (u.readRegularText(file, label) !== content) u.fail(label + ' already exists with different content: ' + file)
  }
  return file
}

function prepare (state, taskId, kind, round) {
  const reviewRequest = request(taskId, kind, round, state.platform)
  const file = writeExclusive(requestPath(taskId, kind, round), reviewRequest, 'Reviewer request artifact')
  return {
    ok: true,
    runner: 'native-subagent',
    role: reviewRequest.role,
    request: file,
    requestDigest: digest(reviewRequest),
    prompt: prompt(taskId, kind, round, state.platform)
  }
}

function normalizeReviewerConfig (platform, raw) {
  const review = JSON.parse(raw)
  if (review && review.evidence && typeof review.evidence === 'object' && !Array.isArray(review.evidence)) {
    review.evidence.reviewerConfig = reviewerConfig(platform)
  }
  return JSON.stringify(review)
}

function validateReviewerConfig (review, platform) {
  const actual = review && review.evidence && review.evidence.reviewerConfig
  if (JSON.stringify(actual) !== JSON.stringify(reviewerConfig(platform))) {
    u.fail('Reviewer run artifact must contain the state-derived reviewer configuration')
  }
}

function validateContextIsolation (review) {
  const checks = review && review.evidence && review.evidence.checks
  const passed = Array.isArray(checks) && checks.some(function (check) {
    return check.command === contextIsolationCheck.command && check.result === contextIsolationCheck.result
  })
  if (!passed) {
    u.fail('Reviewer result must include the passed context-isolation-preflight evidence')
  }
}

function readPreparedRequest (taskId, kind, round, platform) {
  const file = requestPath(taskId, kind, round)
  const prepared = JSON.parse(u.readRegularText(file, 'Reviewer request artifact'))
  if (JSON.stringify(prepared) !== JSON.stringify(request(taskId, kind, round, platform))) {
    u.fail('Reviewer inputs or workspace tree changed after prepare; start a new review round')
  }
  return prepared
}

function finalize (state, taskId, kind, round, input, agentId) {
  if (!input) u.fail('--input is required for --finalize')
  if (!agentId) u.fail('--agent-id is required for --finalize')
  const reviewRequest = readPreparedRequest(taskId, kind, round, state.platform)
  const raw = u.readRegularText(path.resolve(input), 'Reviewer result')
  const validated = persist.validate(taskId, kind, round, normalizeReviewerConfig(state.platform, raw))
  validateContextIsolation(validated.review)
  const run = {
    request: reviewRequest,
    execution: {
      agentId: agentId,
      contextInheritance: 'none',
      resultSha256: crypto.createHash('sha256').update(raw).digest('hex')
    },
    review: validated.review
  }
  const file = writeExclusive(artifactPath(taskId, kind, round), run, 'Reviewer run artifact')
  const persisted = persist.persist(taskId, kind, round, JSON.stringify(validated.review), { reviewerRun: true })
  return { ok: true, runner: 'native-subagent', run: file, review: persisted.review, status: persisted.status }
}

function artifactDigest (taskId, kind, round) {
  return crypto.createHash('sha256').update(u.readRegularText(
    artifactPath(taskId, kind, round),
    'Reviewer run artifact'
  )).digest('hex')
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
  if (!actual.execution || typeof actual.execution.agentId !== 'string' || !actual.execution.agentId ||
    actual.execution.contextInheritance !== 'none') {
    u.fail('Invalid reviewer run artifact: native subagent execution evidence is incomplete')
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
  validateReviewerConfig(actual.review, platform)
  return { file: file, review: actual.review }
}

function requireValid (taskId, kind, round, platform) {
  const completed = requireBoundInputs(taskId, kind, round, platform)
  persist.validate(taskId, kind, round, JSON.stringify(completed.review))
  return completed
}

function requireForState (state, taskId, kind, round) {
  if (state.platform !== 'codex' && state.platform !== 'claude-code') return
  const completed = requireValid(taskId, kind, round, state.platform)
  if (u.readReviewArtifact(u.reviewArtifactPath(taskId, kind, round)) !== JSON.stringify(completed.review, null, 2) + '\n') {
    u.fail('Persisted review must exactly match the reviewer run artifact')
  }
  return completed
}

function confirmationDrift (state, taskId, kind, round) {
  if (state.platform !== 'codex' && state.platform !== 'claude-code') return { changed: false, changedPaths: [] }
  const content = u.readRegularText(artifactPath(taskId, kind, round), 'Reviewer run artifact')
  if (!state.lastReviewerRunDigest || crypto.createHash('sha256').update(content).digest('hex') !== state.lastReviewerRunDigest) {
    u.fail('Reviewer run artifact changed after state advancement')
  }
  const actual = JSON.parse(content)
  validateReviewerConfig(actual.review, state.platform)
  if (u.readReviewArtifact(u.reviewArtifactPath(taskId, kind, round)) !== JSON.stringify(actual.review, null, 2) + '\n') {
    u.fail('Persisted review must exactly match the reviewer run artifact')
  }
  if (kind === 'plan') {
    const planPath = taskPath(taskId, 'plan.md')
    const bound = actual.request.inputDigests.find(function (item) { return item.path === planPath })
    const current = inputDigest(planPath)
    return { changed: bound.sha256 !== current, changedPaths: bound.sha256 === current ? [] : [planPath], reviewedValue: bound.sha256, currentValue: current }
  }
  const drift = snapshot.snapshotDrift(taskId, actual.request.snapshotTree)
  return { changed: drift.changedPaths.length > 0, changedPaths: drift.changedPaths, reviewedValue: drift.reviewedTree, currentValue: drift.currentTree }
}

function validateInvocation (state, taskId, kind, round) {
  if (state.platform !== 'codex' && state.platform !== 'claude-code') u.fail('review-manager.js requires platform codex or claude-code')
  if (state.phase !== kind + '_reviewing') u.fail('Running a ' + kind + ' reviewer requires phase ' + kind + '_reviewing')
  if (round !== state[kind + 'Round'] + 1) u.fail('--round must equal state-derived next round ' + (state[kind + 'Round'] + 1))
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
  validateInvocation(state, taskId, kind, round)
  let result
  if (args.prepare) result = prepare(state, taskId, kind, round)
  else if (args.finalize) result = finalize(state, taskId, kind, round, args.input, args['agent-id'])
  else u.fail('Specify exactly one of --prepare or --finalize')
  process.stdout.write(JSON.stringify(result, null, 2) + '\n')
}

if (require.main === module) {
  try { main() } catch (err) { console.error(err.message); process.exit(err.exitCode || 1) }
}

module.exports = {
  artifactPath,
  artifactDigest,
  confirmationDrift,
  finalize,
  inputs,
  prepare,
  prompt,
  request,
  requestPath,
  reviewerConfig,
  requireValid,
  requireForState
}
