#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
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

  if (state.protocolVersion !== u.protocolVersion) errors.push('protocolVersion mismatch')
  if (state.taskId !== taskId) errors.push('taskId mismatch')
  if (!u.phases.includes(state.phase)) errors.push('invalid phase: ' + state.phase)
  if (!Number.isInteger(state.planRound) || state.planRound < 0) errors.push('planRound must be >= 0')
  if (!Number.isInteger(state.codeRound) || state.codeRound < 0) errors.push('codeRound must be >= 0')
  if (!u.isPositiveInteger(state.maxRounds) || state.maxRounds > 10) errors.push('maxRounds must be an integer from 1 to 10')
  if (typeof state.awaitingUserConfirmation !== 'boolean') errors.push('awaitingUserConfirmation must be boolean')
  ;['goal.md', 'plan.md', 'state.json'].forEach(function (file) {
    if (!existsInTask(taskId, file)) errors.push('missing ' + file)
  })
  ;['reviews', 'diffs', 'logs', path.join('runtime', 'roles')].forEach(function (dir) {
    if (!existsInTask(taskId, dir)) errors.push('missing ' + dir + '/')
  })
  if (state.lastReviewFile && !existsInTask(taskId, state.lastReviewFile)) {
    errors.push('lastReviewFile does not exist: ' + state.lastReviewFile)
  }
  if (state.phase === 'code_reviewing') {
    const diffFile = path.join('diffs', 'code-diff-' + (state.codeRound + 1) + '.patch')
    if (!existsInTask(taskId, diffFile)) errors.push('missing ' + diffFile)
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
