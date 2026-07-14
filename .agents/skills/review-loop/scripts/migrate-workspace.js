#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const snapshot = require('./git-snapshot')
const u = require('./review-loop-utils')

function requireFile (file, errors) {
  if (!fs.existsSync(file)) errors.push('missing ' + file)
}

function readReview (file, errors) {
  try {
    return JSON.parse(u.readReviewArtifact(file))
  } catch (err) {
    errors.push('invalid review artifact ' + file + ': ' + err.message)
  }
}

function validatePlanReview (taskId, round, errors) {
  if (!u.isPositiveInteger(round)) {
    errors.push('a completed current-evidence plan review is required before entering the current phase')
    return
  }
  const reviewFile = u.reviewArtifactPath(taskId, 'plan', round)
  requireFile(reviewFile, errors)
  if (!fs.existsSync(reviewFile)) return
  const review = readReview(reviewFile, errors)
  if (!review) return
  errors.push.apply(errors, u.validateReviewObject(review))
  if (review.round !== round) errors.push('plan review round must equal completed round ' + round)
  return review
}

function validateCodeReview (taskId, round, scope, errors) {
  const reviewFile = u.reviewArtifactPath(taskId, 'code', round)
  requireFile(reviewFile, errors)
  if (!fs.existsSync(reviewFile) || !scope) return
  const review = readReview(reviewFile, errors)
  if (!review) return
  errors.push.apply(errors, u.validateReviewObject(review))
  errors.push.apply(errors, u.validateReviewScope(review, scope, round))
  return review
}

function arraysEqual (left, right) {
  return left.length === right.length && left.every(function (item, index) { return item === right[index] })
}

function validatePatch (file, expected, field, errors) {
  if (!fs.existsSync(file)) return
  if (!fs.readFileSync(file).equals(Buffer.from(expected))) {
    errors.push(field + ' must byte-exactly match its reconstructed Git diff')
  }
}

function validateCodeScope (taskId, round, baseline, baselineTree, previousTree, errors) {
  const dir = path.join(u.taskDir(taskId), 'diffs')
  const scopeFile = path.join(dir, 'code-scope-' + round + '.json')
  const cumulativePatchFile = path.join(dir, 'code-diff-' + round + '.patch')
  const roundPatchFile = path.join(dir, 'code-round-' + round + '.patch')
  ;[scopeFile, cumulativePatchFile, roundPatchFile].forEach(function (file) { requireFile(file, errors) })
  if (!fs.existsSync(scopeFile)) return
  let scope
  try {
    scope = u.readJson(scopeFile)
  } catch (err) {
    errors.push('invalid code scope ' + round + ': ' + err.message)
    return
  }
  if (!scope || typeof scope !== 'object' || Array.isArray(scope)) {
    errors.push('code scope ' + round + ' must be an object')
    return
  }
  if (scope.round !== round) errors.push('scope metadata round must equal expected round ' + round)
  ;['baselineHead', 'baselineTree', 'previousTree', 'currentTree'].forEach(function (field) {
    if (typeof scope[field] !== 'string' || !scope[field]) {
      errors.push('code scope ' + round + ' ' + field + ' must be a non-empty string')
    }
  })
  const normalizedPaths = {}
  ;['cumulativePaths', 'roundPaths', 'claimedPaths', 'unexpectedPaths'].forEach(function (field) {
    try {
      normalizedPaths[field] = Array.from(snapshot.validateRepoRelativePaths(
        scope[field],
        'code scope ' + round + ' ' + field
      ))
      if (!arraysEqual(scope[field], normalizedPaths[field])) {
        errors.push('code scope ' + round + ' ' + field + ' must use unique canonical Git paths in stored order')
      }
    } catch (err) {
      errors.push(err.message)
    }
  })
  if (baseline && typeof scope.baselineHead === 'string' && scope.baselineHead !== baseline.head) {
    errors.push('code scope ' + round + ' baselineHead must match baseline HEAD')
  }
  if (baselineTree && typeof scope.baselineTree === 'string' && scope.baselineTree !== baselineTree) {
    errors.push('code scope ' + round + ' baselineTree must match reconstructed baseline tree')
  }
  if (previousTree && typeof scope.previousTree === 'string' && scope.previousTree !== previousTree) {
    errors.push('code scope ' + round + ' previousTree must match the previous scope tree')
  }
  let currentTreeValid = false
  if (typeof scope.currentTree === 'string' && scope.currentTree) {
    try {
      snapshot.validateTreeObject(taskId, scope.currentTree)
      currentTreeValid = true
    } catch (err) {
      errors.push('code scope ' + round + ' currentTree must reference an existing tree object: ' + err.message)
    }
  }
  if (baselineTree && previousTree && currentTreeValid &&
    scope.baselineTree === baselineTree && scope.previousTree === previousTree) {
    try {
      const cumulativePaths = snapshot.diffPaths(taskId, baselineTree, scope.currentTree)
      const roundPaths = snapshot.diffPaths(taskId, previousTree, scope.currentTree)
      if (normalizedPaths.cumulativePaths && !arraysEqual(normalizedPaths.cumulativePaths, cumulativePaths)) {
        errors.push('code scope ' + round + ' cumulativePaths must exactly match the reconstructed Git paths')
      }
      if (normalizedPaths.roundPaths && !arraysEqual(normalizedPaths.roundPaths, roundPaths)) {
        errors.push('code scope ' + round + ' roundPaths must exactly match the reconstructed Git paths')
      }
      if (normalizedPaths.claimedPaths && normalizedPaths.unexpectedPaths) {
        const claimed = new Set(normalizedPaths.claimedPaths)
        const unexpected = new Set(normalizedPaths.unexpectedPaths)
        const expectedClaimed = roundPaths.filter(function (item) { return claimed.has(item) })
        const expectedUnexpected = roundPaths.filter(function (item) { return !claimed.has(item) })
        if (Array.from(claimed).some(function (item) { return unexpected.has(item) }) ||
          !arraysEqual(normalizedPaths.claimedPaths, expectedClaimed) ||
          !arraysEqual(normalizedPaths.unexpectedPaths, expectedUnexpected)) {
          errors.push('code scope ' + round +
            ' claimedPaths and unexpectedPaths must be an ordered, unique, disjoint partition of roundPaths')
        }
      }
      validatePatch(
        cumulativePatchFile,
        snapshot.diffTrees(taskId, baselineTree, scope.currentTree),
        'code-diff-' + round + '.patch',
        errors
      )
      validatePatch(
        roundPatchFile,
        snapshot.diffTrees(taskId, previousTree, scope.currentTree),
        'code-round-' + round + '.patch',
        errors
      )
    } catch (err) {
      errors.push('unable to reconstruct code scope ' + round + ': ' + err.message)
    }
  }
  return scope
}

function validateTerminalReview (review, round, maxRounds, kind, errors) {
  if (!u.isPositiveInteger(maxRounds)) return
  if (review && review.status !== 'approved' && round < maxRounds) {
    errors.push('latest ' + kind + ' review must be approved or reach maxRounds before entering the current phase')
  }
}

function legacyReviewFiles (taskId) {
  const reviewsDir = path.dirname(u.reviewArtifactPath(taskId, 'plan', 1))
  return fs.readdirSync(reviewsDir).filter(function (file) {
    if (!/^(plan|code)-review-\d+\.json$/.test(file)) return false
    return u.validateReviewObject(JSON.parse(u.readReviewArtifact(path.join(reviewsDir, file)))).length > 0
  }).map(function (file) {
    return path.posix.join('reviews', file)
  }).sort()
}

function main () {
  const args = u.parseArgs(process.argv)
  const taskId = args['task-id']
  if (!taskId) u.fail('Missing --task-id')
  const state = u.readState(taskId)
  if (!u.legacyProtocolVersions.includes(state.protocolVersion)) {
    u.fail('Workspace protocol is not migratable: ' + state.protocolVersion)
  }
  const errors = []
  if (!u.phases.includes(state.phase)) errors.push('invalid phase: ' + state.phase)
  if (!Number.isInteger(state.planRound) || state.planRound < 0) errors.push('planRound must be >= 0')
  if (!Number.isInteger(state.codeRound) || state.codeRound < 0) errors.push('codeRound must be >= 0')
  if (!u.isPositiveInteger(state.maxRounds) || state.maxRounds > 10) {
    errors.push('maxRounds must be an integer from 1 to 10')
  }
  ;['goal.md', 'plan.md', 'reviews', 'diffs', 'logs', 'runtime'].forEach(function (item) {
    requireFile(path.join(u.taskDir(taskId), item), errors)
  })
  const baselineFile = path.join(u.taskDir(taskId), 'runtime', 'baseline', 'manifest.json')
  requireFile(baselineFile, errors)
  let baseline
  let baselineTree
  if (fs.existsSync(baselineFile)) {
    try {
      baseline = snapshot.readBaseline(taskId)
      snapshot.validateBaselineBlobs(taskId, baseline)
      baselineTree = snapshot.createBaselineTree(taskId, baseline)
    } catch (err) {
      errors.push('baseline is not reconstructable: ' + err.message)
    }
  }
  if (['plan_drafting', 'plan_reviewing', 'awaiting_plan_confirm'].includes(state.phase) && state.codeRound !== 0) {
    errors.push(state.phase + ' requires codeRound 0')
  }
  if (['code_drafting', 'code_reviewing', 'awaiting_final_confirm', 'done'].includes(state.phase) &&
    !u.isPositiveInteger(state.planRound)) {
    errors.push(state.phase + ' requires at least one completed plan round')
  }
  if (['awaiting_final_confirm', 'done'].includes(state.phase) && !u.isPositiveInteger(state.codeRound)) {
    errors.push(state.phase + ' requires at least one completed code round')
  }
  if ((state.platform === 'codex' || state.platform === 'claude-code') &&
    (state.phase === 'awaiting_plan_confirm' || state.phase === 'awaiting_final_confirm')) {
    errors.push('cannot migrate a managed confirmation phase without its immutable reviewer run; start a new task')
  }
  let planReview
  if (['awaiting_plan_confirm', 'code_drafting', 'code_reviewing', 'awaiting_final_confirm', 'done'].includes(state.phase)) {
    planReview = validatePlanReview(taskId, state.planRound, errors)
    validateTerminalReview(planReview, state.planRound, state.maxRounds, 'plan', errors)
  }
  let latestCodeReview
  let previousTree = baselineTree
  Array.from({ length: state.codeRound }, function (_, index) { return index + 1 }).forEach(function (round) {
    const scope = validateCodeScope(taskId, round, baseline, baselineTree, previousTree, errors)
    latestCodeReview = validateCodeReview(taskId, round, scope, errors)
    if (scope && typeof scope.currentTree === 'string' && scope.currentTree) previousTree = scope.currentTree
  })
  if (['awaiting_final_confirm', 'done'].includes(state.phase)) {
    validateTerminalReview(latestCodeReview, state.codeRound, state.maxRounds, 'code', errors)
  }
  if (state.phase === 'code_reviewing') {
    const round = state.codeRound + 1
    validateCodeScope(taskId, round, baseline, baselineTree, previousTree, errors)
  }
  if (errors.length) {
    u.fail('Legacy workspace cannot be safely migrated. It remains read-only:\n- ' + errors.join('\n- ') +
      '\nStart a new task or reconstruct the missing current-protocol artifacts without rewriting legacy reviews.')
  }
  const migratedAt = new Date().toISOString()
  const legacyArtifacts = legacyReviewFiles(taskId)
  const record = {
    from: state.protocolVersion,
    to: u.protocolVersion,
    migratedAt: migratedAt,
    legacyReadOnlyArtifacts: legacyArtifacts
  }
  state.protocolVersion = u.protocolVersion
  state.migratedFrom = record.from
  state.updatedAt = migratedAt
  u.writeJson(path.join(u.taskDir(taskId), 'runtime', 'protocol-migration.json'), record)
  u.writeState(taskId, state)
  process.stdout.write(JSON.stringify({
    ok: true,
    taskId: taskId,
    protocolVersion: state.protocolVersion,
    legacyReadOnlyArtifacts: legacyArtifacts
  }, null, 2) + '\n')
}

try {
  main()
} catch (err) {
  console.error(err.message)
  process.exit(err.exitCode || 1)
}
