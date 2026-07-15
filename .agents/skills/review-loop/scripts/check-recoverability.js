#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const reviewerRun = require('./run-reviewer')
const u = require('./review-loop-utils')

function main () {
  const args = u.parseArgs(process.argv)
  const taskId = args['task-id']
  if (!taskId) u.fail('Missing --task-id')
  const dir = u.taskDir(taskId)
  if (!fs.existsSync(dir)) u.fail('Task workspace does not exist: ' + dir, 2)
  if (!fs.existsSync(u.statePath(taskId))) u.fail('Missing state.json for task ' + taskId, 2)
  const state = u.readState(taskId)
  if (u.legacyProtocolVersions.includes(state.protocolVersion)) {
    process.stdout.write(JSON.stringify({
      ok: true,
      action: 'legacy_read_only',
      resumable: false,
      phase: state.phase,
      protocolVersion: state.protocolVersion,
      currentProtocolVersion: u.protocolVersion,
      migrationCommand: 'node .agents/skills/review-loop/scripts/migrate-workspace.js --task-id ' + taskId,
      reason: 'Legacy reviews remain inspectable but do not satisfy the current evidence contract. Resume is blocked until controlled migration succeeds.'
    }, null, 2) + '\n')
    return
  }
  if (state.protocolVersion !== u.protocolVersion) {
    u.fail('Unsupported protocolVersion: ' + state.protocolVersion)
  }
  const required = ['goal.md', 'plan.md', 'reviews', 'diffs', 'logs', path.join('runtime', 'baseline', 'manifest.json')]
  if (state.phase === 'code_reviewing') {
    const round = state.codeRound + 1
    ;['code-diff-', 'code-round-', 'code-scope-'].forEach(function (prefix) {
      required.push(path.join('diffs', prefix + round + (prefix === 'code-scope-' ? '.json' : '.patch')))
    })
  }
  if ((state.platform === 'codex' || state.platform === 'claude-code') &&
    (state.phase === 'plan_reviewing' || state.phase === 'code_reviewing')) {
    const kind = state.phase === 'plan_reviewing' ? 'plan' : 'code'
    const round = state[kind + 'Round'] + 1
    const runFile = reviewerRun.artifactPath(taskId, kind, round)
    const reviewFile = u.reviewArtifactPath(taskId, kind, round)
    if (!fs.existsSync(runFile)) {
      process.stdout.write(JSON.stringify({
        ok: false,
        action: fs.existsSync(reviewFile) ? 'restart_task' : 'rerun_current_round',
        missing: [runFile],
        phase: state.phase,
        reason: fs.existsSync(reviewFile)
          ? 'A review exists without its immutable reviewer run artifact.'
          : 'The current reviewer has not completed.'
      }, null, 2) + '\n')
      return
    }
    if (!fs.existsSync(reviewFile)) {
      try {
        reviewerRun.requireValid(taskId, kind, round, state.platform)
      } catch (err) {
        process.stdout.write(JSON.stringify({
          ok: false,
          action: 'restart_task',
          missing: [reviewFile],
          phase: state.phase,
          reason: err.message
        }, null, 2) + '\n')
        return
      }
      process.stdout.write(JSON.stringify({
        ok: false,
        action: 'rerun_current_round',
        missing: [reviewFile],
        phase: state.phase,
        reason: 'Re-run run-reviewer.js to persist the completed reviewer artifact.'
      }, null, 2) + '\n')
      return
    }
    try {
      reviewerRun.requireForState(state, taskId, kind, round)
    } catch (err) {
      process.stdout.write(JSON.stringify({
        ok: false,
        action: 'restart_task',
        missing: [],
        phase: state.phase,
        reason: err.message
      }, null, 2) + '\n')
      return
    }
  }
  if ((state.platform === 'codex' || state.platform === 'claude-code') &&
    (state.phase === 'awaiting_plan_confirm' || state.phase === 'awaiting_final_confirm')) {
    const kind = state.phase === 'awaiting_plan_confirm' ? 'plan' : 'code'
    try {
      reviewerRun.confirmationDrift(state, taskId, kind, state[kind + 'Round'])
    } catch (err) {
      process.stdout.write(JSON.stringify({
        ok: false,
        action: 'restart_task',
        missing: [],
        phase: state.phase,
        reason: err.message
      }, null, 2) + '\n')
      return
    }
  }
  const missing = required.filter(function (item) {
    return !fs.existsSync(path.join(dir, item))
  })
  if (missing.length) {
    const reviewPersisted = state.phase === 'code_reviewing' && fs.existsSync(path.join(
      dir, 'reviews', 'code-review-' + (state.codeRound + 1) + '.json'
    ))
    process.stdout.write(JSON.stringify({
      ok: false,
      action: missing.includes(path.join('runtime', 'baseline', 'manifest.json')) || reviewPersisted
        ? 'restart_task'
        : 'rerun_current_round',
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
