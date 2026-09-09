#!/usr/bin/env node
'use strict'

const path = require('path')
const u = require('./review-loop-utils')

function main () {
  const args = u.parseArgs(process.argv)
  const reviewFile = args.review
  if (!reviewFile) u.fail('Missing --review')
  const review = u.parseReviewArtifact(reviewFile)
  const errors = u.validateReviewObject(review)
  if (args['expected-round'] && review.round !== Number(args['expected-round'])) {
    errors.push('round must equal --expected-round ' + args['expected-round'])
  }
  if (errors.length) u.fail('Invalid review Markdown:\n- ' + errors.join('\n- '))
  process.stdout.write(JSON.stringify({
    ok: true,
    review: path.resolve(reviewFile),
    status: review.status,
    contract: u.protocolVersion
  }, null, 2) + '\n')
}

try {
  main()
} catch (err) {
  console.error(err.message)
  process.exit(err.exitCode || 1)
}
