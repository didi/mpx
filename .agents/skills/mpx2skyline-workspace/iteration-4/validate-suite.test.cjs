const fs = require('fs')
const path = require('path')
const repo = process.cwd()
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'))
const manifest = read(path.join(__dirname, 'evals.json'))
const legacy = read(path.join(repo, '.agents/skills/mpx2skyline-workspace/iteration-3/evals.json'))
const assertions = manifest.evals.flatMap(item => item.assertions)

test('four cases preserve all 31 adaptation assertions and add six creation assertions', () => {
  expect(manifest.evals.map(item => item.assertions.length)).toEqual([12, 11, 8, 6])
  expect(assertions).toHaveLength(37)
  expect(new Set(assertions.map(item => item.id)).size).toBe(37)
  const migration = read(path.join(__dirname, 'assertion-migration.json'))
  expect(migration.items).toHaveLength(31)
  expect(new Set(migration.items.map(item => item.assertion_id)).size).toBe(31)
  legacy.evals.forEach(item => item.assertions.forEach(old => {
    const current = assertions.find(value => value.id === old.id)
    expect(current.text).toBe(old.text)
    expect(current.verification).toBe(old.verification)
    const move = migration.items.find(value => value.assertion_id === old.id)
    expect(move.from_case).toBe(item.id)
    expect(manifest.evals[move.to_case].assertions).toContain(current)
  }))
})

test('metadata, shared inputs and rule references resolve', () => {
  const parse = require(path.join(repo, 'packages/webpack-plugin/lib/parser'))
  const babel = require(path.join(repo, 'node_modules/@babel/core'))
  manifest.evals.forEach(item => {
    const dir = path.join(__dirname, `eval-${item.id}-${item.name}`)
    const metadata = read(path.join(dir, 'eval_metadata.json'))
    expect(metadata.assertions).toEqual(item.assertions)
    expect(metadata.files).toEqual(item.files)
    item.files.forEach(file => {
      const target = path.join(dir, file)
      expect(fs.existsSync(target)).toBe(true)
      if (file.endsWith('.mpx')) {
        const sfc = parse(fs.readFileSync(target, 'utf8'), { filePath: target, mode: 'wx' })
        expect(sfc.template.content.length).toBeGreaterThan(0)
        expect(() => babel.parseSync(sfc.script.content, { configFile: false, babelrc: false, sourceType: 'module' })).not.toThrow()
        expect(() => JSON.parse(sfc.json.content)).not.toThrow()
      }
      if (file.endsWith('.json')) expect(() => read(target)).not.toThrow()
    })
    item.assertions.forEach(assertion => {
      expect(assertion.scope).toBe('skyline')
      expect(assertion.text).toContain('Skyline')
      expect(assertion.text).not.toMatch(/不得|禁止|不能|不依赖|不要|无Worklet|不引入/)
      const reference = fs.readFileSync(path.join(repo, '.agents/skills/mpx2skyline', assertion.source.file), 'utf8')
      expect(reference).toContain(assertion.source.section)
    })
  })
})

test('merged fixtures are intact and creation starts from requirements', () => {
  const expected = [[0], [1, 4], [2, 3]]
  expected.forEach((ids, index) => {
    const target = manifest.evals[index]
    ids.forEach(id => {
      const original = legacy.evals.find(item => item.id === id)
      original.files.filter(file => file !== 'input/task.md').forEach(file => {
        const source = path.join(repo, '.agents/skills/mpx2skyline-workspace/iteration-3', `eval-${id}-${original.name}`, file)
        const dest = path.join(__dirname, `eval-${index}-${target.name}`, file)
        expect(fs.readFileSync(dest).equals(fs.readFileSync(source))).toBe(true)
      })
    })
  })
  const creation = manifest.evals[3]
  expect(creation.task_type).toBe('creation')
  expect(creation.files).toEqual(['input/app.json', 'input/task.md'])
  creation.assertions.forEach(item => item.related_adaptation_assertions.forEach(id => {
    expect(assertions.some(assertion => assertion.id === id)).toBe(true)
  }))
  expect(manifest.status).toBe('cases-ready-not-run')
  expect(read(path.join(__dirname, 'run-metadata.json')).status).toBe('not_run')
  expect(fs.existsSync(path.join(__dirname, 'benchmark.json'))).toBe(false)
})
