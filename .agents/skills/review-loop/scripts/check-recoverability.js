#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const u = require('./review-loop-utils')

function main () {
  const args = u.parseArgs(process.argv)
  const taskId = args['task-id']
  if (!taskId) u.fail('Missing --task-id')
  const dir = u.taskDir(taskId)
  if (!fs.existsSync(dir)) u.fail('Task workspace does not exist: ' + dir, 2)
  if (!fs.existsSync(u.statePath(taskId))) u.fail('Missing state.json for task ' + taskId, 2)
  const state = u.readState(taskId)
  const required = ['goal.md', 'plan.md', 'reviews', 'diffs', 'logs']
  const missing = required.filter(function (item) {
    return !fs.existsSync(path.join(dir, item))
  })
  if (missing.length) {
    process.stdout.write(JSON.stringify({
      ok: false,
      action: 'rerun_current_round',
      missing: missing,
      phase: state.phase
    }, null, 2) + '\n')
    return
  }
  process.stdout.write(JSON.stringify({
    ok: true,
    action: 'continue',
    phase: state.phase,
    planRound: state.planRound,
    codeRound: state.codeRound
  }, null, 2) + '\n')
}

try {
  main()
} catch (err) {
  console.error(err.message)
  process.exit(err.exitCode || 1)
}
