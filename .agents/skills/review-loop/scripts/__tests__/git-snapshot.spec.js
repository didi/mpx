'use strict'

const childProcess = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const snapshot = require('../git-snapshot')

const snapshotScript = path.resolve(__dirname, '..', 'snapshot-diff.js')
const originalCwd = process.cwd()
let repo
let mainObjectDirs

function git (args) {
  return childProcess.execFileSync('git', args, { cwd: repo, encoding: 'utf8' })
}

function write (relativePath, content) {
  const file = path.join(repo, relativePath)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}

function readJson (relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repo, relativePath), 'utf8'))
}

function objectFile (dir, oid) {
  return path.join(dir, oid.slice(0, 2), oid.slice(2))
}

function collectDirectories (dir, result) {
  result.push(dir)
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
    if (entry.isDirectory()) collectDirectories(path.join(dir, entry.name), result)
  })
}

function setMainObjectsMode (mode) {
  if (!mainObjectDirs) {
    mainObjectDirs = []
    collectDirectories(path.join(repo, '.git', 'objects'), mainObjectDirs)
  }
  mainObjectDirs.forEach(function (dir) { fs.chmodSync(dir, mode) })
}

function initRepo () {
  repo = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loop-test-'))
  git(['init', '-q'])
  git(['config', 'user.email', 'review-loop@example.com'])
  git(['config', 'user.name', 'Review Loop'])
  git(['config', 'core.filemode', 'true'])
  write('.gitignore', '.agent-workflows/\nignored.txt\n')
  ;['staged.txt', 'unstaged.txt', 'delete.txt', 'baseline-delete.txt', 'mode.txt'].forEach(function (file) {
    write(file, 'initial ' + file + '\n')
  })
  write('binary.bin', Buffer.from([0, 1, 2, 3]))
  fs.symlinkSync('initial-target', path.join(repo, 'link'))
  git(['add', '-A'])
  git(['commit', '-qm', 'initial'])
}

function writeStateAndPaths (round, paths) {
  write('.agent-workflows/review-loop/task/state.json', JSON.stringify({
    protocolVersion: '2.0.0',
    phase: 'code_drafting',
    codeRound: round - 1
  }))
  write('.agent-workflows/review-loop/task/runtime/code-round-' + round + '-paths.json', JSON.stringify({
    round: round,
    paths: paths
  }))
}

function runSnapshot (round) {
  return childProcess.execFileSync(process.execPath, [snapshotScript, '--task-id', 'task', '--round', String(round)], {
    cwd: repo,
    encoding: 'utf8'
  })
}

beforeEach(function () {
  initRepo()
  mainObjectDirs = null
  process.chdir(repo)
})

afterEach(function () {
  if (mainObjectDirs) setMainObjectsMode(0o755)
  process.chdir(originalCwd)
  fs.rmSync(repo, { recursive: true, force: true })
})

test('captures dirty baseline and snapshots cumulative and round diffs', function () {
  write('staged.txt', 'baseline staged\n')
  git(['add', 'staged.txt'])
  write('unstaged.txt', 'baseline unstaged\n')
  write('baseline-untracked.txt', 'baseline untracked\n')
  write('ignored.txt', 'ignored\n')
  write('binary.bin', Buffer.from([0, 4, 5, 6]))
  fs.rmSync(path.join(repo, 'baseline-delete.txt'))
  fs.unlinkSync(path.join(repo, 'link'))
  fs.symlinkSync('baseline-target', path.join(repo, 'link'))
  fs.chmodSync(path.join(repo, 'mode.txt'), 0o755)
  setMainObjectsMode(0o555)
  const baseline = snapshot.captureBaseline('task')
  const baselinePaths = baseline.entries.map(function (entry) { return entry.path })

  expect(baselinePaths).toEqual([
    'baseline-delete.txt',
    'baseline-untracked.txt',
    'binary.bin',
    'link',
    'mode.txt',
    'staged.txt',
    'unstaged.txt'
  ])
  baseline.entries.filter(function (entry) { return entry.exists }).forEach(function (entry) {
    expect(fs.existsSync(path.join(repo, '.agent-workflows/review-loop/task/runtime/baseline', entry.blob))).toBe(true)
  })
  const snapshotObjects = path.join(repo, '.agent-workflows/review-loop/task/runtime/snapshot-objects')
  expect(fs.existsSync(objectFile(snapshotObjects, baseline.tree))).toBe(true)
  expect(fs.existsSync(objectFile(path.join(repo, '.git', 'objects'), baseline.tree))).toBe(false)
  fs.rmSync(objectFile(snapshotObjects, baseline.tree))

  setMainObjectsMode(0o755)
  write('staged-current.txt', 'staged current\n')
  git(['add', 'staged-current.txt'])
  setMainObjectsMode(0o555)
  write('unstaged.txt', 'task unstaged\n')
  write('untracked.txt', 'task untracked\n')
  fs.rmSync(path.join(repo, 'delete.txt'))
  fs.chmodSync(path.join(repo, 'mode.txt'), 0o644)
  write('binary.bin', Buffer.from([0, 9, 8, 7]))
  fs.unlinkSync(path.join(repo, 'link'))
  fs.symlinkSync('task-target', path.join(repo, 'link'))
  writeStateAndPaths(1, ['staged-current.txt', 'unstaged.txt', 'untracked.txt', 'delete.txt', 'mode.txt', 'binary.bin'])
  runSnapshot(1)

  const scope1 = readJson('.agent-workflows/review-loop/task/diffs/code-scope-1.json')
  expect(scope1.cumulativePaths).toEqual([
    'binary.bin',
    'delete.txt',
    'link',
    'mode.txt',
    'staged-current.txt',
    'unstaged.txt',
    'untracked.txt'
  ])
  expect(scope1.claimedPaths).toEqual([
    'binary.bin',
    'delete.txt',
    'mode.txt',
    'staged-current.txt',
    'unstaged.txt',
    'untracked.txt'
  ])
  expect(scope1.unexpectedPaths).toEqual(['link'])
  expect(fs.existsSync(objectFile(snapshotObjects, scope1.currentTree))).toBe(true)
  expect(fs.existsSync(objectFile(path.join(repo, '.git', 'objects'), scope1.currentTree))).toBe(false)
  const cumulativePatch = fs.readFileSync(path.join(repo, '.agent-workflows/review-loop/task/diffs/code-diff-1.patch'), 'utf8')
  expect(cumulativePatch).toContain('GIT binary patch')
  expect(cumulativePatch).toContain('deleted file mode 100644')
  expect(cumulativePatch).toContain('old mode 100755')
  expect(cumulativePatch).toContain('baseline-target')
  expect(cumulativePatch).toContain('task-target')
  expect(cumulativePatch).not.toContain('baseline-untracked.txt')
  expect(cumulativePatch).not.toContain('baseline-delete.txt')
  expect(cumulativePatch).not.toContain('baseline staged')

  write('untracked.txt', 'round two\n')
  write('unexpected.txt', 'unexpected\n')
  writeStateAndPaths(2, ['./untracked.txt'])
  runSnapshot(2)
  const scope2 = readJson('.agent-workflows/review-loop/task/diffs/code-scope-2.json')
  expect(scope2.roundPaths).toEqual(['unexpected.txt', 'untracked.txt'])
  expect(scope2.claimedPaths).toEqual(['untracked.txt'])
  expect(scope2.unexpectedPaths).toEqual(['unexpected.txt'])
  expect(fs.existsSync(objectFile(snapshotObjects, scope2.currentTree))).toBe(true)
  expect(fs.existsSync(objectFile(path.join(repo, '.git', 'objects'), scope2.currentTree))).toBe(false)
  expect(fs.readFileSync(path.join(repo, '.agent-workflows/review-loop/task/diffs/code-round-2.patch'), 'utf8')).toContain('round two')
  expect(fs.readFileSync(path.join(repo, '.agent-workflows/review-loop/task/diffs/code-diff-2.patch'), 'utf8')).toContain('staged current')
})

test('fails explicitly when baseline content exceeds its limit', function () {
  write('large.txt', '1234')
  expect(function () {
    snapshot.captureBaseline('task', { maxFileBytes: 3, maxTotalBytes: 10 })
  }).toThrow('Snapshot file exceeds maxFileBytes: large.txt')
  expect(fs.existsSync(path.join(repo, '.agent-workflows/review-loop/task/runtime/baseline/manifest.json'))).toBe(false)
  expect(function () {
    snapshot.captureBaseline('task', { maxFileBytes: 10, maxTotalBytes: 3 })
  }).toThrow('Snapshot content exceeds maxTotalBytes')
})

test('rejects oversized worktree content before writing Git objects', function () {
  snapshot.captureBaseline('task', { maxFileBytes: 64, maxTotalBytes: 1024 })
  write('large-current.txt', 'x'.repeat(65))
  writeStateAndPaths(1, ['large-current.txt'])
  const oid = git(['hash-object', 'large-current.txt']).trim()
  const objects = path.join(repo, '.agent-workflows/review-loop/task/runtime/snapshot-objects')

  expect(function () { runSnapshot(1) }).toThrow('Snapshot file exceeds maxFileBytes: large-current.txt')
  expect(fs.existsSync(objectFile(objects, oid))).toBe(false)
})

test('applies snapshot limits to deleted baseline content', function () {
  snapshot.captureBaseline('task', { maxFileBytes: 3, maxTotalBytes: 10 })
  fs.rmSync(path.join(repo, 'delete.txt'))
  writeStateAndPaths(1, ['delete.txt'])
  expect(function () { runSnapshot(1) }).toThrow('Snapshot file exceeds maxFileBytes: delete.txt')
})

test('validates Git paths with platform-independent slash semantics', function () {
  expect(Array.from(snapshot.validateRepoRelativePaths([
    'src/example.js',
    'test\\example.spec.js',
    'nested\\..\\src/other.js'
  ]))).toEqual(['src/example.js', 'test/example.spec.js', 'src/other.js'])
  ;[
    '',
    '  ',
    '/tmp/outside.js',
    'C:\\outside.js',
    'C:/outside.js',
    'C:outside.js',
    '\\rooted.js',
    '\\\\server\\share\\outside.js',
    '\\\\?\\C:\\outside.js',
    '\\\\.\\pipe\\outside',
    '..',
    '../outside.js',
    'src/../../outside.js',
    'src\\..\\..\\outside.js'
  ].forEach(function (invalidPath) {
    expect(function () {
      snapshot.validateRepoRelativePaths([invalidPath])
    }).toThrow('must be an array of non-empty repo-relative paths')
  })
})

test('normalizes backslash claims to match Git slash paths', function () {
  const claimed = snapshot.validateClaimedPaths(['src\\example.js'])
  expect(Array.from(claimed)).toEqual(['src/example.js'])
  expect(['src/example.js'].filter(function (item) { return claimed.has(item) })).toEqual(['src/example.js'])
})

test('supports legacy clean baseline manifests only', function () {
  const head = git(['rev-parse', 'HEAD']).trim()
  const tree = git(['rev-parse', head + '^{tree}']).trim()
  write('.agent-workflows/review-loop/clean/runtime/baseline/manifest.json', JSON.stringify({
    version: 1,
    head: head,
    entries: []
  }))
  expect(snapshot.readBaseline('clean').tree).toBe(tree)

  write('.agent-workflows/review-loop/declared/runtime/baseline/manifest.json', JSON.stringify({
    version: 1,
    head: head,
    tree: tree,
    entries: []
  }))
  expect(snapshot.readBaseline('declared').tree).toBe(tree)

  write('.agent-workflows/review-loop/dirty/runtime/baseline/manifest.json', JSON.stringify({
    version: 1,
    head: head,
    tree: tree,
    entries: [{ path: 'dirty.txt', exists: true }]
  }))
  expect(function () { snapshot.readBaseline('dirty') }).toThrow('dirty entries but no reconstructable tree')
})

test('validates legacy clean baseline Git objects and tree identity', function () {
  const head = git(['rev-parse', 'HEAD']).trim()
  const tree = git(['rev-parse', head + '^{tree}']).trim()
  const missing = '0000000000000000000000000000000000000000'
  write('.agent-workflows/review-loop/invalid-head/runtime/baseline/manifest.json', JSON.stringify({
    version: 1,
    head: missing,
    tree: tree,
    entries: []
  }))
  expect(function () { snapshot.readBaseline('invalid-head') }).toThrow()

  write('.agent-workflows/review-loop/invalid-tree/runtime/baseline/manifest.json', JSON.stringify({
    version: 1,
    head: head,
    tree: missing,
    entries: []
  }))
  expect(function () { snapshot.readBaseline('invalid-tree') }).toThrow()

  write('mismatched.txt', 'mismatched\n')
  git(['add', 'mismatched.txt'])
  git(['commit', '-qm', 'mismatched tree'])
  const mismatchedTree = git(['rev-parse', 'HEAD^{tree}']).trim()
  write('.agent-workflows/review-loop/mismatched/runtime/baseline/manifest.json', JSON.stringify({
    version: 1,
    head: head,
    tree: mismatchedTree,
    entries: []
  }))
  expect(function () { snapshot.readBaseline('mismatched') }).toThrow('does not match baseline HEAD tree')
})

test('reruns only the current unreviewed code round', function () {
  snapshot.captureBaseline('task')
  write('unstaged.txt', 'first draft\n')
  writeStateAndPaths(1, ['unstaged.txt'])
  runSnapshot(1)
  const diffFile = path.join(repo, '.agent-workflows/review-loop/task/diffs/code-diff-1.patch')

  write('unstaged.txt', 'revised draft\n')
  runSnapshot(1)
  const revised = fs.readFileSync(diffFile, 'utf8')
  expect(revised).toContain('revised draft')

  write('.agent-workflows/review-loop/task/state.json', JSON.stringify({
    protocolVersion: '2.0.0',
    phase: 'code_reviewing',
    codeRound: 0
  }))
  write('unstaged.txt', 'recovered review draft\n')
  runSnapshot(1)
  const recovered = fs.readFileSync(diffFile, 'utf8')
  expect(recovered).toContain('recovered review draft')

  const runFile = path.join(repo, '.agent-workflows/review-loop/task/runtime/reviewer-runs/code-review-1.json')
  write('.agent-workflows/review-loop/task/runtime/reviewer-runs/code-review-1.json', '{}')
  write('unstaged.txt', 'must not replace reviewer-run draft\n')
  expect(function () { runSnapshot(1) }).toThrow(/cannot replace artifacts after the current reviewer run starts/)
  expect(fs.readFileSync(diffFile, 'utf8')).toBe(recovered)
  fs.rmSync(runFile)

  write('.agent-workflows/review-loop/task/reviews/code-review-1.json', '{}')
  write('unstaged.txt', 'must not replace reviewed draft\n')
  expect(function () { runSnapshot(1) }).toThrow(/cannot replace artifacts after the current reviewer run starts/)
  expect(fs.readFileSync(diffFile, 'utf8')).toBe(recovered)

  writeStateAndPaths(2, [])
  expect(function () { runSnapshot(1) }).toThrow(/state-derived next round 2/)
  expect(fs.readFileSync(diffFile, 'utf8')).toBe(recovered)
})
