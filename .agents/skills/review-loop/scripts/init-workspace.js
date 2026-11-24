#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const u = require('./review-loop-utils')
const snapshot = require('./git-snapshot')

function hasEntries (dir) {
  return fs.existsSync(dir) && fs.readdirSync(dir).length > 0
}

function main () {
  const args = u.parseArgs(process.argv)
  const taskId = args['task-id']
  if (!taskId) u.fail('Missing --task-id')
  const maxRounds = args['max-rounds'] ? Number(args['max-rounds']) : 3
  if (!u.isPositiveInteger(maxRounds) || maxRounds > 10) {
    u.fail('--max-rounds must be an integer from 1 to 10')
  }

  const dir = u.taskDir(taskId)
  if (fs.existsSync(u.statePath(taskId)) && !args.force) {
    u.fail('Workspace already exists for task ' + taskId + '. Use --force to overwrite initial files.', 2)
  }
  if (args.force && [
    path.join(dir, 'reviews'),
    path.join(dir, 'runtime', 'reviewer-runs')
  ].some(hasEntries)) {
    u.fail('Workspace contains immutable review history; use a new task id instead of --force.', 2)
  }

  snapshot.captureBaseline(taskId)

  ;['reviews', 'diffs', 'logs', path.join('runtime', 'roles'), path.join('runtime', 'reviewer-runs')].forEach(function (subdir) {
    u.ensureDir(path.join(dir, subdir))
  })

  const goal = args['goal-file'] ? u.readText(path.resolve(args['goal-file'])) : (args.goal || '')
  const createdAt = new Date().toISOString()
  const templateData = {
    goal: goal || '待补充。',
    taskId: taskId,
    maxRounds: maxRounds,
    createdAt: createdAt,
    constraints: args.constraints || '无。'
  }
  const templatesDir = path.join(u.skillRoot(), 'templates')
  u.writeText(path.join(dir, 'goal.md'), u.renderTemplate(u.readText(path.join(templatesDir, 'goal.md')), templateData))
  u.writeText(path.join(dir, 'plan.md'), u.readText(path.join(templatesDir, 'plan.md')))

  const state = {
    protocolVersion: u.protocolVersion,
    taskId: taskId,
    phase: 'plan_drafting',
    planRound: 0,
    codeRound: 0,
    maxRounds: maxRounds,
    planStatus: 'drafting',
    codeStatus: 'pending',
    awaitingUserConfirmation: false,
    lastReviewFile: '',
    lastReviewerRunDigest: '',
    confirmationOverrides: [],
    terminationReason: '',
    roleMode: '',
    platform: args.platform || '',
    createdAt: createdAt,
    updatedAt: createdAt
  }
  u.writeState(taskId, state)
  process.stdout.write(JSON.stringify({ ok: true, taskId: taskId, workspace: dir, maxRounds: maxRounds }, null, 2) + '\n')
}

try {
  main()
} catch (err) {
  console.error(err.message)
  process.exit(err.exitCode || 1)
}
