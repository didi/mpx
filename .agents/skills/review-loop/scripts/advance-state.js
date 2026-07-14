#!/usr/bin/env node
'use strict'

const path = require('path')
const u = require('./review-loop-utils')

function touch (state) {
  state.updatedAt = new Date().toISOString()
}

function setWaiting (state, value) {
  state.awaitingUserConfirmation = value
}

function loadReview (args) {
  if (!args.review) u.fail('Missing --review')
  const review = u.readJson(path.resolve(args.review))
  const errors = u.validateReviewObject(review)
  if (errors.length) u.fail('Invalid review JSON:\n- ' + errors.join('\n- '))
  return review
}

function main () {
  const args = u.parseArgs(process.argv)
  const taskId = args['task-id']
  const event = args.event
  if (!taskId) u.fail('Missing --task-id')
  if (!event) u.fail('Missing --event')

  const state = u.readState(taskId)
  state.terminationReason = ''

  if (event === 'planner-complete') {
    if (state.phase !== 'plan_drafting') u.fail('planner-complete requires phase plan_drafting')
    state.phase = 'plan_reviewing'
    state.planStatus = 'reviewing'
    setWaiting(state, false)
  } else if (event === 'plan-review-complete') {
    if (state.phase !== 'plan_reviewing') u.fail('plan-review-complete requires phase plan_reviewing')
    const review = loadReview(args)
    state.planRound += 1
    state.lastReviewFile = u.relativeToTask(taskId, path.resolve(args.review))
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
    state.phase = 'code_drafting'
    state.codeStatus = 'drafting'
    setWaiting(state, false)
  } else if (event === 'reject-plan') {
    if (state.phase !== 'awaiting_plan_confirm') u.fail('reject-plan requires phase awaiting_plan_confirm')
    state.phase = 'plan_drafting'
    state.planStatus = 'drafting'
    setWaiting(state, false)
  } else if (event === 'coder-complete') {
    if (state.phase !== 'code_drafting') u.fail('coder-complete requires phase code_drafting')
    state.phase = 'code_reviewing'
    state.codeStatus = 'reviewing'
    setWaiting(state, false)
  } else if (event === 'code-review-complete') {
    if (state.phase !== 'code_reviewing') u.fail('code-review-complete requires phase code_reviewing')
    const review = loadReview(args)
    state.codeRound += 1
    state.lastReviewFile = u.relativeToTask(taskId, path.resolve(args.review))
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
    state.phase = 'done'
    state.codeStatus = 'done'
    setWaiting(state, false)
  } else if (event === 'reject-final') {
    if (state.phase !== 'awaiting_final_confirm') u.fail('reject-final requires phase awaiting_final_confirm')
    state.phase = 'code_drafting'
    state.codeStatus = 'drafting'
    setWaiting(state, false)
  } else if (event === 'set-max-rounds') {
    const maxRounds = Number(args['max-rounds'])
    if (!u.isPositiveInteger(maxRounds) || maxRounds > 10) u.fail('--max-rounds must be an integer from 1 to 10')
    if (maxRounds < state.planRound || maxRounds < state.codeRound) {
      u.fail('--max-rounds cannot be lower than existing completed rounds')
    }
    state.maxRounds = maxRounds
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
