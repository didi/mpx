#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const u = require('./review-loop-utils')

function readInput (args) {
  return args.input ? fs.readFileSync(path.resolve(args.input), 'utf8') : fs.readFileSync(0, 'utf8')
}

function validate (taskId, kind, round, raw) {
  if (!taskId) u.fail('Missing --task-id')
  if (kind !== 'plan' && kind !== 'code') u.fail('--kind must be plan or code')
  if (!u.isPositiveInteger(round)) u.fail('--round must be a positive integer')
  const state = u.readState(taskId)
  u.requireCurrentProtocol(state)
  const expectedPhase = kind + '_reviewing'
  const expectedRound = state[kind + 'Round'] + 1
  if (state.phase !== expectedPhase) u.fail('persisting a ' + kind + ' review requires phase ' + expectedPhase)
  if (round !== expectedRound) u.fail('--round must equal state-derived next round ' + expectedRound)
  let review
  try {
    review = JSON.parse(raw.trim())
  } catch (err) {
    u.fail('Reviewer output must be one strict JSON object: ' + err.message)
  }
  const errors = u.validateReviewObject(review)
  if (review.round !== round) errors.push('review round must equal expected round ' + round)
  let scopeFile = ''
  if (kind === 'code') {
    scopeFile = path.join(u.taskDir(taskId), 'diffs', 'code-scope-' + round + '.json')
    if (!fs.existsSync(scopeFile)) {
      errors.push('missing scope metadata: ' + scopeFile)
    } else {
      errors.push.apply(errors, u.validateReviewScope(review, u.readJson(scopeFile), round))
    }
  }
  if (errors.length) u.fail('Invalid review JSON:\n- ' + errors.join('\n- '))
  return { review: review, scope: scopeFile, state: state }
}

function persist (taskId, kind, round, raw, options) {
  const validated = validate(taskId, kind, round, raw)
  if ((validated.state.platform === 'codex' || validated.state.platform === 'claude-code') &&
    !(options && options.reviewerRun)) {
    u.fail('Codex and Claude Code reviews must be executed and persisted by run-reviewer.js')
  }
  const review = validated.review
  const reviewFile = u.reviewArtifactPath(taskId, kind, round)
  const content = JSON.stringify(review, null, 2) + '\n'
  try {
    fs.writeFileSync(reviewFile, content, { flag: 'wx' })
  } catch (err) {
    if (err.code !== 'EEXIST') throw err
    if (u.readReviewArtifact(reviewFile) !== content) {
      u.fail('Review artifact already exists with different content: ' + reviewFile)
    }
  }
  return {
    ok: true,
    review: reviewFile,
    scope: validated.scope,
    status: review.status
  }
}

function main () {
  const args = u.parseArgs(process.argv)
  const result = persist(
    args['task-id'],
    args.kind,
    Number(args.round),
    readInput(args)
  )
  process.stdout.write(JSON.stringify(result, null, 2) + '\n')
}

if (require.main === module) {
  try {
    main()
  } catch (err) {
    console.error(err.message)
    process.exit(err.exitCode || 1)
  }
}

module.exports = { persist, validate }
