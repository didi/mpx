#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const reviewMarkdown = require('./review-markdown')
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
    review = reviewMarkdown.parse(raw)
  } catch (err) {
    u.fail('Reviewer output must be one pure Markdown document: ' + err.message)
  }
  const errors = u.validateReviewObject(review)
  if (review.round !== round) errors.push('review round must equal expected round ' + round)
  if (errors.length) u.fail('Invalid review Markdown:\n- ' + errors.join('\n- '))
  return { review: review, state: state }
}

function persist (taskId, kind, round, raw, options) {
  const validated = validate(taskId, kind, round, raw)
  if ((validated.state.platform === 'codex' || validated.state.platform === 'claude-code') &&
    !(options && options.reviewerRun)) {
    u.fail('Codex and Claude Code reviews must be finalized and persisted by review-manager.js')
  }
  const reviewFile = u.reviewArtifactPath(taskId, kind, round)
  const content = reviewMarkdown.render(validated.review)
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
    status: validated.review.status
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
