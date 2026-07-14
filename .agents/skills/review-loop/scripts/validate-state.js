#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const reviewerRun = require('./run-reviewer')
const u = require('./review-loop-utils')

function existsInTask (taskId, file) {
  return fs.existsSync(path.join(u.taskDir(taskId), file))
}

function main () {
  const args = u.parseArgs(process.argv)
  const taskId = args['task-id']
  if (!taskId) u.fail('Missing --task-id')
  const state = u.readState(taskId)
  const errors = []

  if (state.protocolVersion !== u.protocolVersion) {
    errors.push('protocolVersion mismatch: expected ' + u.protocolVersion + ', received ' + state.protocolVersion)
    if (u.legacyProtocolVersions.includes(state.protocolVersion)) {
      errors.push('legacy workspace is read-only; run check-recoverability.js, then migrate-workspace.js before resuming')
    }
  }
  if (state.taskId !== taskId) errors.push('taskId mismatch')
  if (!u.phases.includes(state.phase)) errors.push('invalid phase: ' + state.phase)
  if (!Number.isInteger(state.planRound) || state.planRound < 0) errors.push('planRound must be >= 0')
  if (!Number.isInteger(state.codeRound) || state.codeRound < 0) errors.push('codeRound must be >= 0')
  if (!u.isPositiveInteger(state.maxRounds) || state.maxRounds > 10) errors.push('maxRounds must be an integer from 1 to 10')
  if (typeof state.awaitingUserConfirmation !== 'boolean') errors.push('awaitingUserConfirmation must be boolean')
  ;['goal.md', 'plan.md', 'state.json', path.join('runtime', 'baseline', 'manifest.json')].forEach(function (file) {
    if (!existsInTask(taskId, file)) errors.push('missing ' + file)
  })
  ;['reviews', 'diffs', 'logs', path.join('runtime', 'roles')].forEach(function (dir) {
    if (!existsInTask(taskId, dir)) errors.push('missing ' + dir + '/')
  })
  if (state.lastReviewFile && !existsInTask(taskId, state.lastReviewFile)) {
    errors.push('lastReviewFile does not exist: ' + state.lastReviewFile)
  }
  if (state.phase === 'code_reviewing') {
    const round = state.codeRound + 1
    ;[
      path.join('diffs', 'code-diff-' + round + '.patch'),
      path.join('diffs', 'code-round-' + round + '.patch'),
      path.join('diffs', 'code-scope-' + round + '.json')
    ].forEach(function (file) {
      if (!existsInTask(taskId, file)) errors.push('missing ' + file)
    })
  }
  if ((state.platform === 'codex' || state.platform === 'claude-code') &&
    (state.phase === 'plan_reviewing' || state.phase === 'code_reviewing')) {
    const kind = state.phase === 'plan_reviewing' ? 'plan' : 'code'
    const round = state[kind + 'Round'] + 1
    const runFile = reviewerRun.artifactPath(taskId, kind, round)
    const reviewFile = u.reviewArtifactPath(taskId, kind, round)
    if (fs.existsSync(runFile) || fs.existsSync(reviewFile)) {
      try {
        reviewerRun.requireForState(state, taskId, kind, round)
      } catch (err) {
        errors.push(err.message)
      }
    }
  }
  if ((state.platform === 'codex' || state.platform === 'claude-code') &&
    (state.phase === 'awaiting_plan_confirm' || state.phase === 'awaiting_final_confirm')) {
    const kind = state.phase === 'awaiting_plan_confirm' ? 'plan' : 'code'
    try {
      reviewerRun.confirmationDrift(state, taskId, kind, state[kind + 'Round'])
    } catch (err) {
      errors.push(err.message)
    }
  }
  if (errors.length) {
    u.fail('Invalid state:\n- ' + errors.join('\n- '))
  }
  process.stdout.write(JSON.stringify({ ok: true, taskId: taskId, phase: state.phase, maxRounds: state.maxRounds }, null, 2) + '\n')
}

try {
  main()
} catch (err) {
  console.error(err.message)
  process.exit(err.exitCode || 1)
}
