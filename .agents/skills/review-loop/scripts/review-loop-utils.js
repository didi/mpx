#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const reviewMarkdown = require('./review-markdown')

const protocolVersion = '3.0.0'
const legacyProtocolVersions = ['1.0.0', '2.0.0']
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

function readRegularText (file, label) {
  const description = label || 'File'
  let stat
  try {
    stat = fs.lstatSync(file)
  } catch (err) {
    if (err.code === 'ENOENT') fail(description + ' does not exist: ' + file)
    throw err
  }
  if (stat.isSymbolicLink() || !stat.isFile()) {
    fail(description + ' must be a regular non-symlink file: ' + file)
  }
  const fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0))
  try {
    if (!fs.fstatSync(fd).isFile()) {
      fail(description + ' must be a regular non-symlink file: ' + file)
    }
    return fs.readFileSync(fd, 'utf8')
  } finally {
    fs.closeSync(fd)
  }
}

function canonicalDirectory (dir, expected, label) {
  const description = label || 'Directory'
  let stat
  try {
    stat = fs.lstatSync(dir)
  } catch (err) {
    if (err.code === 'ENOENT') fail(description + ' does not exist: ' + dir)
    throw err
  }
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    fail(description + ' must be a canonical non-symlink directory: ' + dir)
  }
  const canonical = fs.realpathSync(dir)
  if (expected && canonical !== expected) {
    fail(description + ' must be the expected canonical directory: ' + dir)
  }
  return canonical
}

function resolveReviewArtifact (file) {
  const resolvedFile = path.resolve(file)
  if (path.extname(resolvedFile) !== '.md') fail('Review artifact must be a Markdown file: ' + resolvedFile)
  const reviewsDir = path.dirname(resolvedFile)
  const workspace = path.dirname(reviewsDir)
  const canonicalWorkspace = canonicalDirectory(workspace, '', 'Task workspace')
  const canonicalReviewsDir = canonicalDirectory(
    reviewsDir,
    path.join(canonicalWorkspace, 'reviews'),
    'Reviews directory'
  )
  return {
    file: resolvedFile,
    canonicalFile: path.join(canonicalReviewsDir, path.basename(resolvedFile))
  }
}

function reviewArtifactPath (taskId, kind, round) {
  return resolveReviewArtifact(path.join(taskDir(taskId), 'reviews', kind + '-review-' + round + '.md')).file
}

function readReviewArtifact (file) {
  const artifact = resolveReviewArtifact(file)
  return readRegularText(artifact.file, 'Review artifact')
}

function parseReviewArtifact (file) {
  return reviewMarkdown.parse(readReviewArtifact(file))
}

function formatReviewArtifact (review) {
  return reviewMarkdown.render(review)
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

function requireCurrentProtocol (state) {
  if (state.protocolVersion === protocolVersion) return
  if (legacyProtocolVersions.includes(state.protocolVersion)) {
    fail('Legacy workspace is read-only; run migrate-workspace.js before resuming')
  }
  fail('Unsupported protocolVersion: ' + state.protocolVersion)
}

function validateAllowedKeys (value, allowed, field, errors) {
  Object.keys(value).forEach(function (key) {
    if (!allowed.includes(key)) errors.push(field + ' must not contain additional property ' + key)
  })
}

function validateReviewObject (review) {
  const errors = []
  if (!review || typeof review !== 'object' || Array.isArray(review)) {
    return ['review must be an object']
  }
  validateAllowedKeys(review, ['round', 'status', 'summary', 'findings', 'evidence'], 'review', errors)
  if (!isPositiveInteger(review.round)) errors.push('round must be a positive integer')
  if (!reviewStatuses.includes(review.status)) errors.push('status must be approved or changes_requested')
  if (typeof review.summary !== 'string' || !review.summary.trim()) errors.push('summary must be a non-empty string')
  if (!Array.isArray(review.findings)) errors.push('findings must be an array')
  validateEvidence(review.evidence, errors)
  const findings = Array.isArray(review.findings) ? review.findings : []
  findings.forEach(function (finding, index) {
    const prefix = 'findings[' + index + ']'
    if (!finding || typeof finding !== 'object' || Array.isArray(finding)) {
      errors.push(prefix + ' must be an object')
      return
    }
    validateAllowedKeys(finding, ['id', 'severity', 'category', 'target', 'comment', 'suggestion'], prefix, errors)
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

function isNonEmptyString (value) {
  return typeof value === 'string' && Boolean(value.trim())
}

function validateStringArray (value, field, errors, requireItem) {
  if (!Array.isArray(value)) {
    errors.push(field + ' must be an array')
    return
  }
  if (requireItem && !value.length) errors.push(field + ' must not be empty')
  value.forEach(function (item, index) {
    if (!isNonEmptyString(item)) errors.push(field + '[' + index + '] must be a non-empty string')
  })
}

function validateEvidence (evidence, errors) {
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
    errors.push('evidence must be an object')
    return
  }
  validateAllowedKeys(evidence, ['reviewedPaths', 'residualRisks'], 'evidence', errors)
  validateStringArray(evidence.reviewedPaths, 'evidence.reviewedPaths', errors, true)
  validateStringArray(evidence.residualRisks, 'evidence.residualRisks', errors, false)
}

module.exports = {
  protocolVersion,
  legacyProtocolVersions,
  phases,
  parseArgs,
  fail,
  skillRoot,
  repoRoot,
  workspaceRoot,
  taskDir,
  ensureDir,
  readText,
  readRegularText,
  resolveReviewArtifact,
  reviewArtifactPath,
  readReviewArtifact,
  parseReviewArtifact,
  formatReviewArtifact,
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
  requireCurrentProtocol,
  validateReviewObject
}
