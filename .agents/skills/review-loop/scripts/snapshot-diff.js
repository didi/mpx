#!/usr/bin/env node
'use strict'

const childProcess = require('child_process')
const path = require('path')
const u = require('./review-loop-utils')

function main () {
  const args = u.parseArgs(process.argv)
  const taskId = args['task-id']
  if (!taskId) u.fail('Missing --task-id')
  const state = u.readState(taskId)
  const round = args.round ? Number(args.round) : state.codeRound + 1
  if (!u.isPositiveInteger(round)) u.fail('--round must be a positive integer')
  const diffFile = path.join(u.taskDir(taskId), 'diffs', 'code-diff-' + round + '.patch')
  let diff = ''
  try {
    diff = childProcess.execFileSync('git', ['diff', '--binary'], {
      cwd: u.repoRoot(),
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024
    })
  } catch (err) {
    u.fail('Failed to create git diff snapshot: ' + err.message)
  }
  u.writeText(diffFile, diff)
  process.stdout.write(JSON.stringify({ ok: true, diff: diffFile, bytes: Buffer.byteLength(diff) }, null, 2) + '\n')
}

try {
  main()
} catch (err) {
  console.error(err.message)
  process.exit(err.exitCode || 1)
}
