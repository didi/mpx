const fs = require('fs')
const path = require('path')
const root = __dirname
const repo = process.cwd()
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'evals.json'), 'utf8'))
const assertions = manifest.evals.flatMap(item => item.assertions)

test('five focused cases have 31 unique positive Skyline rules', () => {
  expect(manifest.evals).toHaveLength(5)
  expect(assertions).toHaveLength(31)
  expect(new Set(assertions.map(item => item.id)).size).toBe(31)
  expect(new Set(assertions.map(item => item.rule_id)).size).toBe(31)
  assertions.forEach(item => {
    expect(item.scope).toBe('skyline')
    expect(item.text).toMatch(/Skyline/)
    expect(item.text).not.toMatch(/不得|禁止|不能|不依赖|不要|无Worklet|不引入/)
    const reference = fs.readFileSync(path.join(repo, '.agents/skills/mpx2skyline', item.source.file), 'utf8')
    expect(reference).toContain(item.source.section)
    expect(item.verification.length).toBeGreaterThan(10)
  })
})

test('metadata and input files match and fixture scripts parse', () => {
  const parse = require(path.join(repo, 'packages/webpack-plugin/lib/parser'))
  const babel = require(path.join(repo, 'node_modules/@babel/core'))
  manifest.evals.forEach(item => {
    const dir = path.join(root, `eval-${item.id}-${item.name}`)
    const metadata = JSON.parse(fs.readFileSync(path.join(dir, 'eval_metadata.json'), 'utf8'))
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
    })
  })
})

test('all 90 legacy assertions are accounted for without attaching old scores', () => {
  const migration = JSON.parse(fs.readFileSync(path.join(root, 'assertion-migration.json'), 'utf8'))
  expect(migration.items).toHaveLength(90)
  expect(new Set(migration.items.map(item => item.old_id)).size).toBe(90)
  const ids = new Set(assertions.map(item => item.id))
  migration.items.forEach(item => item.new_ids.forEach(id => expect(ids.has(id)).toBe(true)))
  expect(manifest.status).toBe('cases-ready-not-run')
  expect(fs.existsSync(path.join(root, 'benchmark.json'))).toBe(false)
  const runtime = fs.readFileSync(path.join(root, 'eval-2-template-runtime/input/user-list.mpx'), 'utf8')
  expect(runtime).toContain('optionalTypes:[Object]')
  expect(runtime).toContain('<navigator url="/pages/detail"><view>')
})

test('legacy mappings are bidirectional and restored boundaries have fixtures', () => {
  const migration = JSON.parse(fs.readFileSync(path.join(root, 'assertion-migration.json'), 'utf8'))
  migration.items.forEach(item => {
    expect(item.new_ids.slice().sort()).toEqual(assertions.filter(assertion => assertion.source_assertions.includes(item.old_id)).map(assertion => assertion.id).sort())
  })
  const byOld = Object.fromEntries(migration.items.map(item => [item.old_id, item.new_ids]))
  expect(byOld.e0_05).toEqual([])
  expect(byOld.e5_01).toContain('s0_11')
  expect(byOld.e5_03).toContain('s0_09')
  expect(byOld.e5_05).toEqual(expect.arrayContaining(['s0_07', 's0_10']))
  expect(byOld.e8_03).toEqual(expect.arrayContaining(['s1_01', 's1_02']))
  expect(byOld.e8_08).toEqual(expect.arrayContaining(['s1_05', 's1_06']))
  const input = fs.readFileSync(path.join(root, 'eval-0-style-layout/input/style-card.mpx'), 'utf8')
  expect(input).toContain('box-shadow: 0 2px 4px rgba(0,0,0,.2)')
  expect(input).toContain('.single-filter { filter: blur(2px); }')
  expect(assertions.find(item => item.id === 's3_00').text).toMatch(/span.*max-lines=1、overflow=ellipsis/)
  expect(assertions.find(item => item.id === 's4_01').text).toMatch(/type=list\/custom.*直接子节点/)
})
