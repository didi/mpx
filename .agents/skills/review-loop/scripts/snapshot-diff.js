#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const u = require('./review-loop-utils')
const reviewManager = require('./review-manager')
const snapshot = require('./git-snapshot')

function main () {
  const args = u.parseArgs(process.argv)
  const taskId = args['task-id']
  if (!taskId) u.fail('Missing --task-id')
  const state = u.readState(taskId)
  u.requireCurrentProtocol(state)
  if (state.phase !== 'code_drafting' && state.phase !== 'code_reviewing') {
    u.fail('snapshot-diff requires phase code_drafting or recoverable code_reviewing')
  }
  const expectedRound = state.codeRound + 1
  const round = args.round ? Number(args.round) : state.codeRound + 1
  if (!u.isPositiveInteger(round)) u.fail('--round must be a positive integer')
  if (round !== expectedRound) u.fail('--round must equal state-derived next round ' + expectedRound)
  const reviewFile = path.join(u.taskDir(taskId), 'reviews', 'code-review-' + round + '.json')
  const runFile = reviewManager.artifactPath(taskId, 'code', round)
  const requestFile = reviewManager.requestPath(taskId, 'code', round)
  if (state.phase === 'code_reviewing' &&
    (fs.existsSync(reviewFile) || fs.existsSync(runFile) || fs.existsSync(requestFile))) {
    u.fail('snapshot-diff cannot replace artifacts after the current reviewer run starts')
  }
  const baseline = snapshot.readBaseline(taskId)
  snapshot.validateBaselineBlobs(taskId, baseline)
  const baselineTree = snapshot.createBaselineTree(taskId, baseline)
  const limits = baseline.limits || snapshot.defaultLimits
  const currentTree = snapshot.createWorktreeTree(taskId, '', limits)
  const previousScopeFile = path.join(u.taskDir(taskId), 'diffs', 'code-scope-' + (round - 1) + '.json')
  const previousTree = round === 1 ? baselineTree : u.readJson(previousScopeFile).currentTree
  const diffFile = path.join(u.taskDir(taskId), 'diffs', 'code-diff-' + round + '.patch')
  const roundFile = path.join(u.taskDir(taskId), 'diffs', 'code-round-' + round + '.patch')
  const pathsFile = path.resolve(args.paths || path.join(u.taskDir(taskId), 'runtime', 'code-round-' + round + '-paths.json'))
  if (!fs.existsSync(pathsFile)) u.fail('Missing coder changed-path manifest: ' + pathsFile)
  const pathsManifest = u.readJson(pathsFile)
  if (pathsManifest.round !== round || !Array.isArray(pathsManifest.paths)) {
    u.fail('Changed-path manifest must contain matching round and paths array')
  }
  const cumulativePaths = snapshot.diffPaths(taskId, baselineTree, currentTree)
  const roundPaths = snapshot.diffPaths(taskId, previousTree, currentTree)
  snapshot.validateTreePairPaths(taskId, baselineTree, currentTree, cumulativePaths, limits)
  snapshot.validateTreePairPaths(taskId, previousTree, currentTree, roundPaths, limits)
  const claimedSet = snapshot.validateClaimedPaths(pathsManifest.paths)
  const scope = {
    round: round,
    baselineHead: baseline.head,
    baselineTree: baselineTree,
    previousTree: previousTree,
    currentTree: currentTree,
    cumulativePaths: cumulativePaths,
    roundPaths: roundPaths,
    claimedPaths: roundPaths.filter(function (item) { return claimedSet.has(item) }),
    unexpectedPaths: roundPaths.filter(function (item) { return !claimedSet.has(item) })
  }
  const diff = snapshot.diffTrees(taskId, baselineTree, currentTree)
  const roundDiff = snapshot.diffTrees(taskId, previousTree, currentTree)
  u.writeText(diffFile, diff)
  u.writeText(roundFile, roundDiff)
  const scopeFile = path.join(u.taskDir(taskId), 'diffs', 'code-scope-' + round + '.json')
  u.writeJson(scopeFile, scope)
  process.stdout.write(JSON.stringify({
    ok: true,
    diff: diffFile,
    roundDiff: roundFile,
    scope: scopeFile,
    bytes: Buffer.byteLength(diff)
  }, null, 2) + '\n')
}

try {
  main()
} catch (err) {
  console.error(err.message)
  process.exit(err.exitCode || 1)
}
