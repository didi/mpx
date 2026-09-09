'use strict'

const childProcess = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const snapshot = require('../git-snapshot')

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

test('captures a dirty baseline and computes its diff to the current worktree on demand', function () {
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
  const trees1 = snapshot.reviewTrees('task')
  expect(trees1.changedPaths).toEqual([
    'binary.bin',
    'delete.txt',
    'link',
    'mode.txt',
    'staged-current.txt',
    'unstaged.txt',
    'untracked.txt'
  ])
  expect(fs.existsSync(objectFile(snapshotObjects, trees1.currentTree))).toBe(true)
  expect(fs.existsSync(objectFile(path.join(repo, '.git', 'objects'), trees1.currentTree))).toBe(false)
  const diff1 = snapshot.diffTrees('task', trees1.baselineTree, trees1.currentTree)
  expect(diff1).toContain('GIT binary patch')
  expect(diff1).toContain('deleted file mode 100644')
  expect(diff1).toContain('old mode 100755')
  expect(diff1).toContain('baseline-target')
  expect(diff1).toContain('task-target')
  expect(diff1).not.toContain('baseline-untracked.txt')
  expect(diff1).not.toContain('baseline-delete.txt')
  expect(diff1).not.toContain('baseline staged')
  expect(fs.existsSync(path.join(repo, '.agent-workflows/review-loop/task/diffs'))).toBe(false)

  write('untracked.txt', 'round two\n')
  write('unexpected.txt', 'unexpected\n')
  const trees2 = snapshot.reviewTrees('task')
  expect(trees2.changedPaths).toContain('unexpected.txt')
  expect(trees2.changedPaths).toContain('untracked.txt')
  expect(fs.existsSync(objectFile(snapshotObjects, trees2.currentTree))).toBe(true)
  expect(fs.existsSync(objectFile(path.join(repo, '.git', 'objects'), trees2.currentTree))).toBe(false)
  const diff2 = snapshot.diffTrees('task', trees2.baselineTree, trees2.currentTree)
  expect(diff2).toContain('staged current')
  expect(diff2).toContain('unexpected')
  expect(fs.existsSync(path.join(repo, '.agent-workflows/review-loop/task/diffs'))).toBe(false)
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

test('rejects oversized worktree content before preparing a review tree', function () {
  snapshot.captureBaseline('task', { maxFileBytes: 64, maxTotalBytes: 1024 })
  write('large-current.txt', 'x'.repeat(65))
  const oid = git(['hash-object', 'large-current.txt']).trim()
  const objects = path.join(repo, '.agent-workflows/review-loop/task/runtime/snapshot-objects')

  expect(function () { snapshot.reviewTrees('task') }).toThrow('Snapshot file exceeds maxFileBytes: large-current.txt')
  expect(fs.existsSync(objectFile(objects, oid))).toBe(false)
})

test('applies snapshot limits to deleted baseline content', function () {
  snapshot.captureBaseline('task', { maxFileBytes: 3, maxTotalBytes: 10 })
  fs.rmSync(path.join(repo, 'delete.txt'))
  expect(function () { snapshot.reviewTrees('task') }).toThrow('Snapshot file exceeds maxFileBytes: delete.txt')
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

test('always compares the original baseline with the current worktree without round metadata', function () {
  snapshot.captureBaseline('task')
  write('unstaged.txt', 'first draft\n')
  const first = snapshot.reviewTrees('task')
  expect(snapshot.diffTrees('task', first.baselineTree, first.currentTree)).toContain('first draft')

  write('unstaged.txt', 'revised draft\n')
  const second = snapshot.reviewTrees('task')
  const revised = snapshot.diffTrees('task', second.baselineTree, second.currentTree)
  expect(revised).toContain('revised draft')
  expect(revised).toContain('initial unstaged.txt')
  expect(fs.existsSync(path.join(repo, '.agent-workflows/review-loop/task/diffs'))).toBe(false)
})
