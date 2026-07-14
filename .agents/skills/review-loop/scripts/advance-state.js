#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const reviewerRun = require('./run-reviewer')
const snapshot = require('./git-snapshot')
const u = require('./review-loop-utils')

function touch (state) {
  state.updatedAt = new Date().toISOString()
}

function setWaiting (state, value) {
  state.awaitingUserConfirmation = value
}

function requireCodeSnapshot (taskId, round) {
  const dir = path.join(u.taskDir(taskId), 'diffs')
  const missing = []
  ;[
    'code-diff-' + round + '.patch',
    'code-round-' + round + '.patch',
    'code-scope-' + round + '.json'
  ].forEach(function (file) {
    if (!fs.existsSync(path.join(dir, file))) missing.push(file)
  })
  if (missing.length) {
    u.fail('coder-complete requires snapshot-diff artifacts for round ' + round + ': ' + missing.join(', '))
  }
  if (u.readJson(path.join(dir, 'code-scope-' + round + '.json')).round !== round) {
    u.fail('coder-complete requires code scope for round ' + round)
  }
  snapshot.validateRoundSnapshot(taskId, round)
}

function confirmReview (state, taskId, kind, round, args) {
  const drift = reviewerRun.confirmationDrift(state, taskId, kind, round)
  if (!drift.changed) return
  if (args['accept-changed-inputs'] !== 'true') {
    u.fail('Reviewed ' + kind + ' content changed before confirmation: ' + drift.changedPaths.join(', ') +
      '. Re-review it or explicitly pass --accept-changed-inputs true with --override-reason.')
  }
  if (typeof args['override-reason'] !== 'string' || !args['override-reason'].trim()) {
    u.fail('Changed review inputs require a non-empty --override-reason')
  }
  if (!Array.isArray(state.confirmationOverrides)) state.confirmationOverrides = []
  state.confirmationOverrides.push(Object.assign({
    kind: kind,
    round: round,
    acceptedAt: new Date().toISOString(),
    reason: args['override-reason']
  }, drift))
}

function loadReview (taskId, args, kind, expectedRound, scopeFile) {
  if (!args.review) u.fail('Missing --review')
  const state = u.readState(taskId)
  reviewerRun.requireForState(state, taskId, kind, expectedRound)
  const reviewFile = u.reviewArtifactPath(taskId, kind, expectedRound)
  const supplied = u.resolveReviewArtifact(args.review)
  if (supplied.canonicalFile !== u.resolveReviewArtifact(reviewFile).canonicalFile) {
    u.fail('--review must be the canonical current-task artifact: ' + reviewFile)
  }
  const review = JSON.parse(u.readReviewArtifact(reviewFile))
  const errors = u.validateReviewObject(review)
  if (review.round !== expectedRound) errors.push('review round must equal expected round ' + expectedRound)
  if (scopeFile) {
    if (!fs.existsSync(scopeFile)) {
      errors.push('missing scope metadata: ' + scopeFile)
    } else {
      errors.push.apply(errors, u.validateReviewScope(review, u.readJson(scopeFile), expectedRound))
    }
  }
  if (errors.length) u.fail('Invalid review JSON:\n- ' + errors.join('\n- '))
  return {
    review: review,
    file: reviewFile,
    runDigest: state.platform === 'codex' || state.platform === 'claude-code'
      ? reviewerRun.artifactDigest(taskId, kind, expectedRound)
      : ''
  }
}

function main () {
  const args = u.parseArgs(process.argv)
  const taskId = args['task-id']
  const event = args.event
  if (!taskId) u.fail('Missing --task-id')
  if (!event) u.fail('Missing --event')

  const state = u.readState(taskId)
  u.requireCurrentProtocol(state)
  const previousTerminationReason = state.terminationReason
  state.terminationReason = ''

  if (event === 'planner-complete') {
    if (state.phase !== 'plan_drafting') u.fail('planner-complete requires phase plan_drafting')
    state.phase = 'plan_reviewing'
    state.planStatus = 'reviewing'
    setWaiting(state, false)
  } else if (event === 'plan-review-complete') {
    if (state.phase !== 'plan_reviewing') u.fail('plan-review-complete requires phase plan_reviewing')
    const loaded = loadReview(taskId, args, 'plan', state.planRound + 1)
    const review = loaded.review
    state.planRound += 1
    state.lastReviewFile = u.relativeToTask(taskId, loaded.file)
    state.lastReviewerRunDigest = loaded.runDigest
    if (review.status === 'approved') {
      state.phase = 'awaiting_plan_confirm'
      state.planStatus = 'approved'
      state.terminationReason = 'approved'
      setWaiting(state, true)
    } else if (state.planRound >= state.maxRounds) {
      state.phase = 'awaiting_plan_confirm'
      state.planStatus = 'max_rounds_reached'
      state.terminationReason = 'max_rounds_reached'
      setWaiting(state, true)
    } else {
      state.phase = 'plan_drafting'
      state.planStatus = 'changes_requested'
      setWaiting(state, false)
    }
  } else if (event === 'confirm-plan') {
    if (state.phase !== 'awaiting_plan_confirm') u.fail('confirm-plan requires phase awaiting_plan_confirm')
    confirmReview(state, taskId, 'plan', state.planRound, args)
    state.phase = 'code_drafting'
    state.codeStatus = 'drafting'
    setWaiting(state, false)
  } else if (event === 'reject-plan') {
    if (state.phase !== 'awaiting_plan_confirm') u.fail('reject-plan requires phase awaiting_plan_confirm')
    if (previousTerminationReason === 'max_rounds_reached') {
      u.fail('reject-plan after max_rounds_reached requires an explicit maxRounds increase')
    }
    state.phase = 'plan_drafting'
    state.planStatus = 'drafting'
    setWaiting(state, false)
  } else if (event === 'coder-complete') {
    if (state.phase !== 'code_drafting') u.fail('coder-complete requires phase code_drafting')
    requireCodeSnapshot(taskId, state.codeRound + 1)
    state.phase = 'code_reviewing'
    state.codeStatus = 'reviewing'
    setWaiting(state, false)
  } else if (event === 'code-review-complete') {
    if (state.phase !== 'code_reviewing') u.fail('code-review-complete requires phase code_reviewing')
    const expectedRound = state.codeRound + 1
    const loaded = loadReview(taskId, args, 'code', expectedRound, path.join(u.taskDir(taskId), 'diffs', 'code-scope-' + expectedRound + '.json'))
    const review = loaded.review
    state.codeRound += 1
    state.lastReviewFile = u.relativeToTask(taskId, loaded.file)
    state.lastReviewerRunDigest = loaded.runDigest
    if (review.status === 'approved') {
      state.phase = 'awaiting_final_confirm'
      state.codeStatus = 'approved'
      state.terminationReason = 'approved'
      setWaiting(state, true)
    } else if (state.codeRound >= state.maxRounds) {
      state.phase = 'awaiting_final_confirm'
      state.codeStatus = 'max_rounds_reached'
      state.terminationReason = 'max_rounds_reached'
      setWaiting(state, true)
    } else {
      state.phase = 'code_drafting'
      state.codeStatus = 'changes_requested'
      setWaiting(state, false)
    }
  } else if (event === 'confirm-final') {
    if (state.phase !== 'awaiting_final_confirm') u.fail('confirm-final requires phase awaiting_final_confirm')
    confirmReview(state, taskId, 'code', state.codeRound, args)
    state.phase = 'done'
    state.codeStatus = 'done'
    setWaiting(state, false)
  } else if (event === 'reject-final') {
    if (state.phase !== 'awaiting_final_confirm') u.fail('reject-final requires phase awaiting_final_confirm')
    if (previousTerminationReason === 'max_rounds_reached') {
      u.fail('reject-final after max_rounds_reached requires an explicit maxRounds increase')
    }
    state.phase = 'code_drafting'
    state.codeStatus = 'drafting'
    setWaiting(state, false)
  } else if (event === 'set-max-rounds') {
    const maxRounds = Number(args['max-rounds'])
    if (!u.isPositiveInteger(maxRounds) || maxRounds > 10) u.fail('--max-rounds must be an integer from 1 to 10')
    if (previousTerminationReason !== 'max_rounds_reached' || !state.awaitingUserConfirmation ||
      (state.phase !== 'awaiting_plan_confirm' && state.phase !== 'awaiting_final_confirm')) {
      u.fail('set-max-rounds requires a max_rounds_reached confirmation phase')
    }
    if (args['user-confirmed'] !== 'true') u.fail('set-max-rounds requires --user-confirmed true')
    if (maxRounds <= state.maxRounds) u.fail('--max-rounds must be greater than the current maxRounds')
    state.maxRounds = maxRounds
    setWaiting(state, false)
    if (state.phase === 'awaiting_plan_confirm') {
      state.phase = 'plan_drafting'
      state.planStatus = 'changes_requested'
    } else {
      state.phase = 'code_drafting'
      state.codeStatus = 'changes_requested'
    }
  } else {
    u.fail('Unsupported event: ' + event)
  }

  touch(state)
  u.writeState(taskId, state)
  process.stdout.write(JSON.stringify({
    ok: true,
    taskId: taskId,
    event: event,
    phase: state.phase,
    planRound: state.planRound,
    codeRound: state.codeRound,
    maxRounds: state.maxRounds,
    terminationReason: state.terminationReason
  }, null, 2) + '\n')
}

try {
  main()
} catch (err) {
  console.error(err.message)
  process.exit(err.exitCode || 1)
}
