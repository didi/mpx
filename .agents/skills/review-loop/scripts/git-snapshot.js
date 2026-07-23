#!/usr/bin/env node
'use strict'

const childProcess = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const u = require('./review-loop-utils')

const defaultLimits = {
  maxFileBytes: 10 * 1024 * 1024,
  maxTotalBytes: 50 * 1024 * 1024
}

function git (args, options) {
  return childProcess.execFileSync('git', args, Object.assign({
    cwd: u.repoRoot(),
    encoding: 'utf8',
    maxBuffer: 100 * 1024 * 1024
  }, options))
}

function splitNull (value) {
  return value.split('\0').filter(Boolean)
}

function changedPathsFromHead (head) {
  return Array.from(new Set(splitNull(git(['diff', '--name-only', '-z', head || 'HEAD', '--'])).concat(
    splitNull(git(['ls-files', '--others', '--exclude-standard', '-z']))
  ))).sort()
}

function snapshotEnv (taskId, additions) {
  const objectDir = path.join(u.taskDir(taskId), 'runtime', 'snapshot-objects')
  const commonDir = git(['rev-parse', '--git-common-dir']).trim()
  u.ensureDir(objectDir)
  return Object.assign({}, process.env, {
    GIT_OBJECT_DIRECTORY: objectDir,
    GIT_ALTERNATE_OBJECT_DIRECTORIES: path.resolve(u.repoRoot(), commonDir, 'objects')
  }, additions)
}

function validatePaths (paths, limits) {
  let totalBytes = 0
  paths.forEach(function (relativePath) {
    let stat
    const file = path.join(u.repoRoot(), relativePath)
    try {
      stat = fs.lstatSync(file)
    } catch (err) {
      if (err.code === 'ENOENT') return
      u.fail('Unable to read snapshot path ' + relativePath + ': ' + err.message)
    }
    if (!stat.isFile() && !stat.isSymbolicLink()) {
      u.fail('Unsupported snapshot path type: ' + relativePath)
    }
    const bytes = stat.isSymbolicLink() ? Buffer.byteLength(fs.readlinkSync(file)) : stat.size
    if (bytes > limits.maxFileBytes) {
      u.fail('Snapshot file exceeds maxFileBytes: ' + relativePath + ' (' + bytes + ' bytes)')
    }
    totalBytes += bytes
    if (totalBytes > limits.maxTotalBytes) {
      u.fail('Snapshot content exceeds maxTotalBytes (' + totalBytes + ' bytes)')
    }
  })
}

function withTemporaryIndex (taskId, callback) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-index-'))
  const env = snapshotEnv(taskId, { GIT_INDEX_FILE: path.join(tempDir, 'index') })
  try {
    return callback(env)
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

function createWorktreeTree (taskId, head, limits) {
  validatePaths(changedPathsFromHead(head), limits || defaultLimits)
  return withTemporaryIndex(taskId, function (env) {
    git(['read-tree', head || 'HEAD'], { env: env })
    git(['add', '-A', '--', '.'], { env: env })
    return git(['write-tree'], { env: env }).trim()
  })
}

function treeEntries (taskId, tree, changedPaths) {
  const byPath = {}
  splitNull(git(['ls-tree', '-r', '-z', tree], { env: snapshotEnv(taskId) })).forEach(function (line) {
    const tabIndex = line.indexOf('\t')
    const metadata = line.slice(0, tabIndex).split(' ')
    byPath[line.slice(tabIndex + 1)] = { mode: metadata[0], type: metadata[1], oid: metadata[2] }
  })
  return changedPaths.map(function (relativePath) {
    const entry = byPath[relativePath]
    if (!entry) return { path: relativePath, exists: false }
    if (entry.type !== 'blob' || (entry.mode !== '100644' && entry.mode !== '100755' && entry.mode !== '120000')) {
      u.fail('Unsupported baseline Git entry: ' + relativePath + ' (' + entry.mode + ' ' + entry.type + ')')
    }
    return Object.assign({ path: relativePath, exists: true }, entry)
  })
}

function validateEntrySizes (taskId, entries, limits) {
  let totalBytes = 0
  entries.forEach(function (entry) {
    if (!entry.exists) return
    const bytes = Number(git(['cat-file', '-s', entry.oid], { env: snapshotEnv(taskId) }).trim())
    if (bytes > limits.maxFileBytes) {
      u.fail('Snapshot file exceeds maxFileBytes: ' + entry.path + ' (' + bytes + ' bytes)')
    }
    totalBytes += bytes
    if (totalBytes > limits.maxTotalBytes) {
      u.fail('Snapshot content exceeds maxTotalBytes (' + totalBytes + ' bytes)')
    }
  })
}

function validateTreePairPaths (taskId, fromTree, toTree, paths, limits) {
  const entries = treeEntries(taskId, fromTree, paths).concat(treeEntries(taskId, toTree, paths))
  const seen = new Set()
  validateEntrySizes(taskId, entries.filter(function (entry) {
    if (!entry.exists || seen.has(entry.oid)) return false
    seen.add(entry.oid)
    return true
  }), limits)
}

function validateTreeObject (taskId, tree) {
  if (git(['cat-file', '-t', tree], { env: snapshotEnv(taskId) }).trim() !== 'tree') {
    u.fail('Git object is not a tree: ' + tree)
  }
}

function captureBlobs (taskId, entries) {
  const baselineDir = path.join(u.taskDir(taskId), 'runtime', 'baseline')
  const blobsDir = path.join(baselineDir, 'blobs')
  const written = new Set()
  entries.forEach(function (entry) {
    if (!entry.exists) return
    const blobName = entry.oid
    if (!written.has(blobName)) {
      u.ensureDir(blobsDir)
      fs.writeFileSync(path.join(blobsDir, blobName), git(['cat-file', 'blob', entry.oid], {
        encoding: null,
        env: snapshotEnv(taskId)
      }))
      written.add(blobName)
    }
    entry.blob = path.posix.join('blobs', blobName)
  })
}

function captureBaseline (taskId, limits) {
  const head = git(['rev-parse', 'HEAD']).trim()
  const changedPaths = changedPathsFromHead(head)
  const appliedLimits = Object.assign({}, defaultLimits, limits)
  const tree = createWorktreeTree(taskId, head, appliedLimits)
  const entries = treeEntries(taskId, tree, changedPaths)
  validateEntrySizes(taskId, entries, appliedLimits)
  captureBlobs(taskId, entries)
  const manifest = {
    version: 2,
    head: head,
    tree: tree,
    createdAt: new Date().toISOString(),
    limits: appliedLimits,
    entries: entries
  }
  u.writeJson(path.join(u.taskDir(taskId), 'runtime', 'baseline', 'manifest.json'), manifest)
  return manifest
}

function readBaseline (taskId) {
  const manifest = u.readJson(path.join(u.taskDir(taskId), 'runtime', 'baseline', 'manifest.json'))
  if (manifest.version < 2) {
    if (manifest.entries && manifest.entries.length) {
      u.fail('Baseline manifest has dirty entries but no reconstructable tree; initialize a new workspace')
    }
    git(['cat-file', '-e', manifest.head + '^{commit}'])
    const headTree = git(['rev-parse', '--verify', manifest.head + '^{tree}']).trim()
    if (manifest.tree) {
      if (git(['cat-file', '-t', manifest.tree]).trim() !== 'tree') {
        u.fail('Legacy baseline tree is not a tree object')
      }
      if (manifest.tree !== headTree) u.fail('Legacy baseline tree does not match baseline HEAD tree')
    } else {
      manifest.tree = headTree
    }
  }
  return manifest
}

function validateBaselineBlobs (taskId, baseline) {
  if (baseline.version < 2) return
  baseline.entries.forEach(function (entry) {
    if (!entry.exists) return
    if (!entry.blob) u.fail('Baseline entry is missing blob content: ' + entry.path)
    const blobFile = path.join(u.taskDir(taskId), 'runtime', 'baseline', entry.blob)
    let content
    try {
      content = fs.readFileSync(blobFile)
    } catch (err) {
      u.fail('Unable to read baseline blob for ' + entry.path + ': ' + err.message)
    }
    if (git(['hash-object', '--stdin'], { input: content, env: snapshotEnv(taskId) }).trim() !== entry.oid) {
      u.fail('Baseline blob content mismatch: ' + entry.path)
    }
  })
}

function createBaselineTree (taskId, baseline) {
  if (baseline.version < 2) return baseline.tree
  return withTemporaryIndex(taskId, function (env) {
    git(['read-tree', baseline.head], { env: env })
    baseline.entries.forEach(function (entry) {
      if (!entry.exists) {
        git(['update-index', '--force-remove', '--', entry.path], { env: env })
        return
      }
      const blobFile = path.join(u.taskDir(taskId), 'runtime', 'baseline', entry.blob)
      const oid = git(['hash-object', '-w', blobFile], { env: env }).trim()
      if (oid !== entry.oid) u.fail('Baseline blob content mismatch: ' + entry.path)
      git(['update-index', '--add', '--cacheinfo', entry.mode, oid, entry.path], { env: env })
    })
    const tree = git(['write-tree'], { env: env }).trim()
    if (tree !== baseline.tree) u.fail('Reconstructed baseline tree does not match manifest')
    return tree
  })
}

function diffPaths (taskId, fromTree, toTree) {
  return splitNull(git(['diff', '--name-only', '-z', fromTree, toTree, '--'], {
    env: snapshotEnv(taskId)
  })).sort()
}

function diffTrees (taskId, fromTree, toTree) {
  return git([
    'diff', '--binary', '--full-index', '--find-renames', '--no-ext-diff',
    '--no-textconv', fromTree, toTree, '--'
  ], { env: snapshotEnv(taskId) })
}

function arraysEqual (left, right) {
  return Array.isArray(left) && left.length === right.length && left.every(function (item, index) {
    return item === right[index]
  })
}

function validateStoredPaths (paths, expected, field) {
  const normalized = Array.from(validateRepoRelativePaths(paths, field))
  if (!arraysEqual(paths, normalized) || !arraysEqual(normalized, expected)) {
    u.fail(field + ' must exactly match the reconstructed Git paths')
  }
  return normalized
}

function validatePatch (file, expected, field) {
  if (!fs.readFileSync(file).equals(Buffer.from(expected))) {
    u.fail(field + ' must exactly match the reconstructed Git diff')
  }
}

function validateRoundSnapshot (taskId, round) {
  const dir = path.join(u.taskDir(taskId), 'diffs')
  const baseline = readBaseline(taskId)
  validateBaselineBlobs(taskId, baseline)
  const baselineTree = createBaselineTree(taskId, baseline)
  const scope = u.readJson(path.join(dir, 'code-scope-' + round + '.json'))
  const previousTree = round === 1
    ? baselineTree
    : u.readJson(path.join(dir, 'code-scope-' + (round - 1) + '.json')).currentTree
  if (scope.round !== round || scope.baselineHead !== baseline.head ||
    scope.baselineTree !== baselineTree || scope.previousTree !== previousTree) {
    u.fail('Code snapshot metadata does not match round ' + round)
  }
  if (typeof scope.currentTree !== 'string' || !scope.currentTree) {
    u.fail('Code snapshot currentTree must be a non-empty string')
  }
  validateTreeObject(taskId, scope.currentTree)
  const currentTree = createWorktreeTree(taskId, '', baseline.limits || defaultLimits)
  if (scope.currentTree !== currentTree) {
    u.fail('Code snapshot is stale for round ' + round + '; rerun snapshot-diff.js')
  }
  const cumulativePaths = diffPaths(taskId, baselineTree, currentTree)
  const roundPaths = diffPaths(taskId, previousTree, currentTree)
  validateStoredPaths(scope.cumulativePaths, cumulativePaths, 'code scope ' + round + ' cumulativePaths')
  validateStoredPaths(scope.roundPaths, roundPaths, 'code scope ' + round + ' roundPaths')
  const claimedPaths = Array.from(validateRepoRelativePaths(scope.claimedPaths, 'code scope ' + round + ' claimedPaths'))
  const unexpectedPaths = Array.from(validateRepoRelativePaths(scope.unexpectedPaths, 'code scope ' + round + ' unexpectedPaths'))
  const claimed = new Set(claimedPaths)
  if (!arraysEqual(scope.claimedPaths, claimedPaths) || !arraysEqual(scope.unexpectedPaths, unexpectedPaths) ||
    !arraysEqual(claimedPaths, roundPaths.filter(function (item) { return claimed.has(item) })) ||
    !arraysEqual(unexpectedPaths, roundPaths.filter(function (item) { return !claimed.has(item) }))) {
    u.fail('Code snapshot claimedPaths and unexpectedPaths must partition roundPaths')
  }
  validatePatch(
    path.join(dir, 'code-diff-' + round + '.patch'),
    diffTrees(taskId, baselineTree, currentTree),
    'code-diff-' + round + '.patch'
  )
  validatePatch(
    path.join(dir, 'code-round-' + round + '.patch'),
    diffTrees(taskId, previousTree, currentTree),
    'code-round-' + round + '.patch'
  )
  return scope
}

function snapshotDrift (taskId, reviewedTree) {
  validateTreeObject(taskId, reviewedTree)
  const baseline = readBaseline(taskId)
  const currentTree = createWorktreeTree(taskId, '', baseline.limits || defaultLimits)
  return {
    reviewedTree: reviewedTree,
    currentTree: currentTree,
    changedPaths: reviewedTree === currentTree ? [] : diffPaths(taskId, reviewedTree, currentTree)
  }
}

function validateRepoRelativePaths (paths, field) {
  const description = field || 'Paths'
  if (!Array.isArray(paths)) u.fail(description + ' must be an array of non-empty repo-relative paths')
  const validated = new Set()
  paths.forEach(function (item) {
    if (typeof item !== 'string' || !item.trim() || path.posix.isAbsolute(item) ||
      path.win32.isAbsolute(item) || /^[a-zA-Z]:/.test(item)) {
      u.fail(description + ' must be an array of non-empty repo-relative paths')
    }
    const normalized = path.posix.normalize(item.replace(/\\/g, '/')).replace(/^\.\//, '')
    if (normalized === '.' || normalized === '..' || normalized.startsWith('../')) {
      u.fail(description + ' must be an array of non-empty repo-relative paths')
    }
    validated.add(normalized)
  })
  return validated
}

function validateClaimedPaths (paths) {
  return validateRepoRelativePaths(paths, 'Changed-path manifest paths')
}

module.exports = {
  captureBaseline,
  changedPathsFromHead,
  createBaselineTree,
  createWorktreeTree,
  defaultLimits,
  diffPaths,
  diffTrees,
  readBaseline,
  snapshotDrift,
  validateBaselineBlobs,
  validateClaimedPaths,
  validateRoundSnapshot,
  validatePaths,
  validateRepoRelativePaths,
  validateTreeObject,
  validateTreePairPaths
}
