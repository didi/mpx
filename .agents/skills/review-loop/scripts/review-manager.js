#!/usr/bin/env node
'use strict'

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const persist = require('./persist-review-markdown')
const reviewMarkdown = require('./review-markdown')
const snapshot = require('./git-snapshot')
const u = require('./review-loop-utils')

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

function codeDiffPath (taskId, round) {
  return path.join(u.taskDir(taskId), 'diffs', 'code-diff-' + round + '.patch')
}

function taskPath (taskId, file) {
  return path.posix.join('.agent-workflows', 'review-loop', taskId, file)
}

function reviewTaskPath (taskId, kind, round) {
  return taskPath(taskId, 'reviews/' + kind + '-review-' + round + '.md')
}

function inputs (taskId, kind, round) {
  const files = [
    path.posix.join('.agents', 'skills', 'review-loop', 'templates', 'roles', reviewerRole(kind) + '.md'),
    taskPath(taskId, 'goal.md'),
    taskPath(taskId, 'plan.md')
  ]
  if (kind === 'plan') {
    Array.from({ length: round - 1 }, function (_, index) { return index + 1 }).forEach(function (reviewRound) {
      files.push(reviewTaskPath(taskId, 'plan', reviewRound))
    })
  } else {
    files.push(taskPath(taskId, 'runtime/baseline/manifest.json'))
    files.push(taskPath(taskId, 'diffs/code-diff-' + round + '.patch'))
    files.push(taskPath(taskId, 'logs/coder-' + round + '.md'))
    Array.from({ length: round - 1 }, function (_, index) { return index + 1 }).forEach(function (reviewRound) {
      files.push(reviewTaskPath(taskId, 'code', reviewRound))
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
    '本轮（round ' + round + '）必须将 ' + reviewerRole(kind) + ' 作为全新、独立的原生子 Agent 拉起；每一轮都要创建新实例，不得恢复或复用任何之前创建的 reviewer，也不得继承父级会话、planner 或 coder 的任何上下文。',
    '仅使用下列仓库路径作为初始任务输入，再按照角色要求检查仓库证据。',
    '不得修改仓库文件。只返回一份符合角色模板固定格式的 Markdown 文档，不加外围说明。',
    '所有自然语言评审内容必须使用中文；命令、路径、代码符号、Markdown 固定字段名和协议枚举值可保留原文。',
    '评审正文只能使用角色模板规定的 Markdown 章节，不得返回 reviewerConfig。',
    '',
    inputs(taskId, kind, round).join('\n')
  ].join('\n') + '\n'
}

function request (taskId, kind, round, platform, boundTrees) {
  if (!u.isPositiveInteger(round)) u.fail('Reviewer round must be a positive integer')
  const files = inputs(taskId, kind, round)
  const trees = kind === 'code' ? (boundTrees || snapshot.reviewTrees(taskId)) : null
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
    workspaceTree: trees ? trees.currentTree : snapshot.createWorktreeTree(taskId),
    output: taskPath(taskId, 'reviews/' + kind + '-review-' + round + '.md')
  }
  if (trees) {
    value.baselineTree = trees.baselineTree
    value.snapshotTree = trees.currentTree
  }
  return value
}

function digest (value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function writeTextExclusive (file, content, label) {
  u.ensureDir(path.dirname(file))
  try {
    fs.writeFileSync(file, content, { flag: 'wx' })
  } catch (err) {
    if (err.code !== 'EEXIST') throw err
    if (u.readRegularText(file, label) !== content) u.fail(label + ' already exists with different content: ' + file)
  }
  return file
}

function writeExclusive (file, value, label) {
  return writeTextExclusive(file, JSON.stringify(value, null, 2) + '\n', label)
}

function validateCodeDiff (taskId, round, reviewRequest) {
  if (reviewRequest.kind !== 'code') return ''
  const file = codeDiffPath(taskId, round)
  const expected = snapshot.diffTrees(taskId, reviewRequest.baselineTree, reviewRequest.snapshotTree)
  if (u.readRegularText(file, 'Code review diff') !== expected) {
    u.fail('Code review diff must exactly match the prepared baseline and worktree trees')
  }
  return file
}

function prepare (state, taskId, kind, round) {
  const trees = kind === 'code' ? snapshot.reviewTrees(taskId) : null
  const diff = trees
    ? writeTextExclusive(
        codeDiffPath(taskId, round),
        snapshot.diffTrees(taskId, trees.baselineTree, trees.currentTree),
        'Code review diff'
      )
    : ''
  const reviewRequest = request(taskId, kind, round, state.platform, trees)
  const file = writeExclusive(requestPath(taskId, kind, round), reviewRequest, 'Reviewer request artifact')
  const result = {
    ok: true,
    runner: 'native-subagent',
    role: reviewRequest.role,
    request: file,
    requestDigest: digest(reviewRequest),
    prompt: prompt(taskId, kind, round, state.platform)
  }
  if (diff) result.diff = diff
  return result
}

function validateReviewerConfig (actual, platform) {
  if (JSON.stringify(actual) !== JSON.stringify(reviewerConfig(platform))) {
    u.fail('Reviewer run artifact must contain the state-derived reviewer configuration')
  }
}

function requireFreshReviewerAgent (taskId, kind, round, agentId) {
  const current = artifactPath(taskId, kind, round)
  const dir = path.dirname(current)
  if (!fs.existsSync(dir)) return
  fs.readdirSync(dir).filter(function (file) {
    return /^(plan|code)-review-\d+\.json$/.test(file)
  }).forEach(function (file) {
    const runPath = path.join(dir, file)
    if (runPath === current) return
    let run
    try {
      run = JSON.parse(u.readRegularText(runPath, 'Reviewer run artifact'))
    } catch (err) {
      u.fail('Invalid reviewer run artifact: ' + err.message)
    }
    if (run && run.execution && run.execution.agentId === agentId) {
      u.fail('每轮 reviewer 必须使用全新子 Agent，--agent-id 不得与历史 reviewer-run 重复: ' + agentId)
    }
  })
}

function requirePrepared (taskId, kind, round, platform) {
  const file = requestPath(taskId, kind, round)
  const prepared = JSON.parse(u.readRegularText(file, 'Reviewer request artifact'))
  if (JSON.stringify(prepared) !== JSON.stringify(request(taskId, kind, round, platform))) {
    u.fail('Reviewer inputs or workspace tree changed after prepare; start a new review round')
  }
  validateCodeDiff(taskId, round, prepared)
  return prepared
}

function finalize (state, taskId, kind, round, input, agentId) {
  if (!input) u.fail('--input is required for --finalize')
  if (!agentId) u.fail('--agent-id is required for --finalize')
  requireFreshReviewerAgent(taskId, kind, round, agentId)
  const reviewRequest = requirePrepared(taskId, kind, round, state.platform)
  const raw = u.readRegularText(path.resolve(input), 'Reviewer result')
  const validated = persist.validate(taskId, kind, round, raw)
  const reviewDocument = reviewMarkdown.render(validated.review)
  const run = {
    request: reviewRequest,
    execution: {
      agentId: agentId,
      contextInheritance: 'none',
      resultSha256: crypto.createHash('sha256').update(raw).digest('hex'),
      reviewerConfig: reviewerConfig(state.platform)
    },
    reviewDocument: reviewDocument
  }
  const file = writeExclusive(artifactPath(taskId, kind, round), run, 'Reviewer run artifact')
  const persisted = persist.persist(taskId, kind, round, reviewDocument, { reviewerRun: true })
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
  validateCodeDiff(taskId, round, actual.request)
  if (!actual.execution || typeof actual.execution.agentId !== 'string' || !actual.execution.agentId ||
    actual.execution.contextInheritance !== 'none') {
    u.fail('Invalid reviewer run artifact: native subagent execution evidence is incomplete')
  }
  let review
  try {
    review = reviewMarkdown.parse(actual.reviewDocument)
  } catch (err) {
    u.fail('Invalid reviewer run artifact Markdown: ' + err.message)
  }
  const errors = u.validateReviewObject(review)
  if (review.round !== round) errors.push('review round must equal expected round ' + round)
  if (errors.length) u.fail('Invalid reviewer run artifact review:\n- ' + errors.join('\n- '))
  validateReviewerConfig(actual.execution.reviewerConfig, platform)
  return { file: file, review: review, document: reviewMarkdown.render(review) }
}

function requireValid (taskId, kind, round, platform) {
  const completed = requireBoundInputs(taskId, kind, round, platform)
  persist.validate(taskId, kind, round, completed.document)
  return completed
}

function requireForState (state, taskId, kind, round) {
  if (state.platform !== 'codex' && state.platform !== 'claude-code') return
  const completed = requireValid(taskId, kind, round, state.platform)
  const reviewFile = u.reviewArtifactPath(taskId, kind, round)
  if (u.readReviewArtifact(reviewFile) !== completed.document) {
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
  validateReviewerConfig(actual.execution && actual.execution.reviewerConfig, state.platform)
  let review
  try {
    review = reviewMarkdown.parse(actual.reviewDocument)
  } catch (err) {
    u.fail('Invalid reviewer run artifact Markdown: ' + err.message)
  }
  const reviewFile = u.reviewArtifactPath(taskId, kind, round)
  if (u.readReviewArtifact(reviewFile) !== reviewMarkdown.render(review)) {
    u.fail('Persisted review must exactly match the reviewer run artifact')
  }
  if (kind === 'plan') {
    const planPath = taskPath(taskId, 'plan.md')
    const bound = actual.request.inputDigests.find(function (item) { return item.path === planPath })
    const current = inputDigest(planPath)
    return { changed: bound.sha256 !== current, changedPaths: bound.sha256 === current ? [] : [planPath], reviewedValue: bound.sha256, currentValue: current }
  }
  validateCodeDiff(taskId, round, actual.request)
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
  codeDiffPath,
  finalize,
  inputs,
  prepare,
  prompt,
  request,
  requestPath,
  requirePrepared,
  requireFreshReviewerAgent,
  reviewerConfig,
  requireValid,
  requireForState
}
