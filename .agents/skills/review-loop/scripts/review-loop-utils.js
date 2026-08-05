#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const protocolVersion = '2.0.0'
const legacyProtocolVersions = ['1.0.0']
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
  return resolveReviewArtifact(path.join(
    taskDir(taskId),
    'reviews',
    kind + '-review-' + round + '.json'
  )).file
}

function readReviewArtifact (file) {
  const artifact = resolveReviewArtifact(file)
  return readRegularText(artifact.file, 'Review artifact')
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
  if (review.status === 'approved' && review.evidence && review.evidence.diffScope &&
    Array.isArray(review.evidence.diffScope.unexpectedDispositions) &&
    review.evidence.diffScope.unexpectedDispositions.some(function (item) {
      return item && item.disposition === 'blocking'
    })) {
    errors.push('approved review must not have blocking unexpected path dispositions')
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

function validateObjectArray (value, field, required, errors) {
  if (!Array.isArray(value)) {
    errors.push(field + ' must be an array')
    return
  }
  if (!value.length) errors.push(field + ' must not be empty')
  value.forEach(function (item, index) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(field + '[' + index + '] must be an object')
      return
    }
    validateAllowedKeys(item, required, field + '[' + index + ']', errors)
    required.forEach(function (key) {
      if (!isNonEmptyString(item[key])) errors.push(field + '[' + index + '].' + key + ' must be a non-empty string')
    })
  })
}

function validateEvidence (evidence, errors) {
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
    errors.push('evidence must be an object')
    return
  }
  validateAllowedKeys(evidence, [
    'reviewedPaths',
    'tracedSymbols',
    'checks',
    'counterexamples',
    'diffScope',
    'residualRisks',
    'reviewerConfig'
  ], 'evidence', errors)
  validateStringArray(evidence.reviewedPaths, 'evidence.reviewedPaths', errors, true)
  validateObjectArray(evidence.checks, 'evidence.checks', ['command', 'result'], errors)
  validateObjectArray(evidence.counterexamples, 'evidence.counterexamples', ['scenario', 'result'], errors)
  validateStringArray(evidence.residualRisks, 'evidence.residualRisks', errors, false)
  if (!Array.isArray(evidence.tracedSymbols)) {
    errors.push('evidence.tracedSymbols must be an array')
  } else {
    if (!evidence.tracedSymbols.length) errors.push('evidence.tracedSymbols must not be empty')
    evidence.tracedSymbols.forEach(function (item, index) {
      const field = 'evidence.tracedSymbols[' + index + ']'
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        errors.push(field + ' must be an object')
        return
      }
      validateAllowedKeys(item, ['symbol', 'path', 'related'], field, errors)
      ;['symbol', 'path'].forEach(function (key) {
        if (!isNonEmptyString(item[key])) errors.push(field + '.' + key + ' must be a non-empty string')
      })
      validateStringArray(item.related, field + '.related', errors, true)
    })
  }
  const diffScope = evidence.diffScope
  if (!diffScope || typeof diffScope !== 'object' || Array.isArray(diffScope)) {
    errors.push('evidence.diffScope must be an object')
  } else {
    validateAllowedKeys(diffScope, [
      'cumulativeDiff',
      'roundDiff',
      'unexpectedPaths',
      'unexpectedDispositions'
    ], 'evidence.diffScope', errors)
    ;['cumulativeDiff', 'roundDiff'].forEach(function (key) {
      if (!isNonEmptyString(diffScope[key])) errors.push('evidence.diffScope.' + key + ' must be a non-empty string')
    })
    validateStringArray(diffScope.unexpectedPaths, 'evidence.diffScope.unexpectedPaths', errors, false)
    const dispositions = Array.isArray(diffScope.unexpectedDispositions) ? diffScope.unexpectedDispositions : []
    if (!Array.isArray(diffScope.unexpectedDispositions)) {
      errors.push('evidence.diffScope.unexpectedDispositions must be an array')
    }
    const dispositionPaths = new Set()
    dispositions.forEach(function (item, index) {
      const field = 'evidence.diffScope.unexpectedDispositions[' + index + ']'
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        errors.push(field + ' must be an object')
        return
      }
      validateAllowedKeys(item, ['path', 'disposition', 'reason'], field, errors)
      ;['path', 'reason'].forEach(function (key) {
        if (!isNonEmptyString(item[key])) errors.push(field + '.' + key + ' must be a non-empty string')
      })
      if (!['included', 'excluded', 'blocking'].includes(item.disposition)) {
        errors.push(field + '.disposition must be included, excluded, or blocking')
      }
      if (dispositionPaths.has(item.path)) errors.push(field + '.path must be unique')
      dispositionPaths.add(item.path)
    })
    if (Array.isArray(diffScope.unexpectedPaths)) {
      diffScope.unexpectedPaths.forEach(function (unexpectedPath) {
        if (!dispositionPaths.has(unexpectedPath)) {
          errors.push('unexpected path requires disposition: ' + unexpectedPath)
        }
      })
      dispositions.forEach(function (item) {
        if (item && !diffScope.unexpectedPaths.includes(item.path)) {
          errors.push('unexpected disposition path is not listed: ' + item.path)
        }
      })
    }
  }
  const config = evidence.reviewerConfig
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    errors.push('evidence.reviewerConfig must be an object')
  } else {
    validateAllowedKeys(config, ['model', 'reasoningEffort', 'sandboxMode', 'source'], 'evidence.reviewerConfig', errors)
    ;['model', 'reasoningEffort', 'sandboxMode', 'source'].forEach(function (key) {
      if (!isNonEmptyString(config[key])) errors.push('evidence.reviewerConfig.' + key + ' must be a non-empty string')
    })
    if (config.sandboxMode !== 'read-only') {
      errors.push('evidence.reviewerConfig.sandboxMode must be read-only')
    }
  }
}

function validateReviewScope (review, scope, expectedRound) {
  const errors = []
  if (!scope || typeof scope !== 'object' || Array.isArray(scope)) {
    return ['scope metadata must be an object']
  }
  if (expectedRound !== undefined && review.round !== expectedRound) {
    errors.push('review round must equal expected round ' + expectedRound)
  }
  if (expectedRound !== undefined && scope.round !== expectedRound) {
    errors.push('scope metadata round must equal expected round ' + expectedRound)
  }
  if (!Array.isArray(scope.unexpectedPaths)) return ['scope metadata unexpectedPaths must be an array']
  const actual = review && review.evidence && review.evidence.diffScope && review.evidence.diffScope.unexpectedPaths
  if (!Array.isArray(actual)) return ['evidence.diffScope.unexpectedPaths must be an array']
  const expectedPaths = Array.from(new Set(scope.unexpectedPaths)).sort()
  const actualPaths = Array.from(new Set(actual)).sort()
  if (JSON.stringify(actualPaths) !== JSON.stringify(expectedPaths)) {
    errors.push('evidence.diffScope.unexpectedPaths must match scope metadata')
  }
  if (expectedRound !== undefined && review && review.evidence && review.evidence.diffScope) {
    const diffScope = review.evidence.diffScope
    if (diffScope.cumulativeDiff !== 'diffs/code-diff-' + expectedRound + '.patch') {
      errors.push('evidence.diffScope.cumulativeDiff must reference expected round ' + expectedRound)
    }
    if (diffScope.roundDiff !== 'diffs/code-round-' + expectedRound + '.patch') {
      errors.push('evidence.diffScope.roundDiff must reference expected round ' + expectedRound)
    }
  }
  return errors
}

function validateLegacyReviewObject (review) {
  const errors = []
  if (!review || typeof review !== 'object' || Array.isArray(review)) return ['review must be an object']
  if (!isPositiveInteger(review.round)) errors.push('round must be a positive integer')
  if (!reviewStatuses.includes(review.status)) errors.push('status must be approved or changes_requested')
  if (!isNonEmptyString(review.summary)) errors.push('summary must be a non-empty string')
  if (!Array.isArray(review.findings)) errors.push('findings must be an array')
  if (review.status === 'approved' && Array.isArray(review.findings) && review.findings.length) {
    errors.push('approved review must have no findings')
  }
  return errors
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
  validateReviewObject,
  validateReviewScope,
  validateLegacyReviewObject
}
