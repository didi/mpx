#!/usr/bin/env node
'use strict'

const path = require('path')
const fs = require('fs')
const u = require('./review-loop-utils')

function scopeFileForReview (reviewFile, review) {
  if (!/^code-review-\d+\.json$/.test(path.basename(reviewFile))) return ''
  return path.join(path.dirname(path.dirname(reviewFile)), 'diffs', 'code-scope-' + review.round + '.json')
}

function main () {
  const args = u.parseArgs(process.argv)
  const reviewFile = args.review
  if (!reviewFile) u.fail('Missing --review')
  const review = JSON.parse(u.readReviewArtifact(reviewFile))
  const legacyReadOnly = args['legacy-read-only'] === true
  const errors = legacyReadOnly ? u.validateLegacyReviewObject(review) : u.validateReviewObject(review)
  if (legacyReadOnly && args.scope) u.fail('--scope is not available with --legacy-read-only')
  const scopeFile = args.scope ? path.resolve(args.scope) : scopeFileForReview(path.resolve(reviewFile), review)
  const expectedRound = args['expected-round'] ? Number(args['expected-round']) : review.round
  if (scopeFile && !legacyReadOnly) {
    if (!fs.existsSync(scopeFile)) {
      errors.push('missing scope metadata: ' + scopeFile)
    } else {
      errors.push.apply(errors, u.validateReviewScope(review, u.readJson(scopeFile), expectedRound))
    }
  }
  if (args['expected-round'] && review.round !== Number(args['expected-round'])) {
    errors.push('round must equal --expected-round ' + args['expected-round'])
  }
  if (errors.length) {
    u.fail('Invalid review JSON:\n- ' + errors.join('\n- '))
  }
  process.stdout.write(JSON.stringify({
    ok: true,
    review: path.resolve(reviewFile),
    scope: scopeFile,
    status: review.status,
    contract: legacyReadOnly ? 'legacy-read-only' : u.protocolVersion,
    resumable: !legacyReadOnly
  }, null, 2) + '\n')
}

try {
  main()
} catch (err) {
  console.error(err.message)
  process.exit(err.exitCode || 1)
}
