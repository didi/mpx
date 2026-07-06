#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const protocolVersion = '1.0.0'
const phases = [
  'plan_drafting',
  'plan_reviewing',
  'awaiting_plan_confirm',
  'code_drafting',
  'code_reviewing',
  'awaiting_final_confirm',
  'done'
]
const severities = ['critical', 'major', 'minor', 'nit']
const reviewStatuses = ['approved', 'changes_requested']

function parseArgs (argv) {
  const args = {}
  for (let i = 2; i < argv.length; i++) {
    const item = argv[i]
    if (!item.startsWith('--')) continue
    const eqIndex = item.indexOf('=')
    if (eqIndex > -1) {
      args[item.slice(2, eqIndex)] = item.slice(eqIndex + 1)
      continue
    }
    const key = item.slice(2)
    const next = argv[i + 1]
    if (next && !next.startsWith('--')) {
      args[key] = next
      i++
    } else {
      args[key] = true
    }
  }
  return args
}

function fail (message, code) {
  const err = new Error(message)
  err.exitCode = code || 1
  throw err
}

function skillRoot () {
  return path.resolve(__dirname, '..')
}

function repoRoot () {
  return process.cwd()
}

function workspaceRoot () {
  return path.join(repoRoot(), '.agent-workflows', 'review-loop')
}

function taskDir (taskId) {
  if (!taskId) fail('Missing --task-id')
  return path.join(workspaceRoot(), taskId)
}

function ensureDir (dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function readText (file) {
  return fs.readFileSync(file, 'utf8')
}

function writeText (file, content) {
  ensureDir(path.dirname(file))
  fs.writeFileSync(file, content)
}

function readJson (file) {
  return JSON.parse(readText(file))
}

function writeJson (file, value) {
  writeText(file, JSON.stringify(value, null, 2) + '\n')
}

function renderTemplate (content, data) {
  return content.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, function (_, key) {
    return Object.prototype.hasOwnProperty.call(data, key) ? String(data[key]) : ''
  })
}

function copyFile (from, to) {
  ensureDir(path.dirname(to))
  fs.copyFileSync(from, to)
}

function statePath (taskId) {
  return path.join(taskDir(taskId), 'state.json')
}

function readState (taskId) {
  return readJson(statePath(taskId))
}

function writeState (taskId, state) {
  writeJson(statePath(taskId), state)
}

function relativeToTask (taskId, file) {
  return path.relative(taskDir(taskId), path.resolve(file))
}

function isPositiveInteger (value) {
  return Number.isInteger(value) && value > 0
}

function validateReviewObject (review) {
  const errors = []
  if (!review || typeof review !== 'object' || Array.isArray(review)) {
    return ['review must be an object']
  }
  if (!isPositiveInteger(review.round)) errors.push('round must be a positive integer')
  if (!reviewStatuses.includes(review.status)) errors.push('status must be approved or changes_requested')
  if (typeof review.summary !== 'string' || !review.summary.trim()) errors.push('summary must be a non-empty string')
  if (!Array.isArray(review.findings)) errors.push('findings must be an array')
  const findings = Array.isArray(review.findings) ? review.findings : []
  findings.forEach(function (finding, index) {
    const prefix = 'findings[' + index + ']'
    if (!finding || typeof finding !== 'object' || Array.isArray(finding)) {
      errors.push(prefix + ' must be an object')
      return
    }
    ;['id', 'category', 'target', 'comment', 'suggestion'].forEach(function (key) {
      if (typeof finding[key] !== 'string' || !finding[key].trim()) {
        errors.push(prefix + '.' + key + ' must be a non-empty string')
      }
    })
    if (!severities.includes(finding.severity)) {
      errors.push(prefix + '.severity must be one of ' + severities.join(', '))
    }
  })
  if (review.status === 'approved' && findings.length) {
    errors.push('approved review must have no findings')
  }
  if (review.status === 'changes_requested') {
    const blocking = findings.some(function (finding) {
      return finding && finding.severity !== 'nit'
    })
    if (!blocking) errors.push('changes_requested review must include at least one non-nit finding')
  }
  return errors
}

module.exports = {
  protocolVersion,
  phases,
  parseArgs,
  fail,
  skillRoot,
  repoRoot,
  workspaceRoot,
  taskDir,
  ensureDir,
  readText,
  writeText,
  readJson,
  writeJson,
  renderTemplate,
  copyFile,
  statePath,
  readState,
  writeState,
  relativeToTask,
  isPositiveInteger,
  validateReviewObject
}
