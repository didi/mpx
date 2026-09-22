const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const repo = process.cwd()
const skill = path.join(repo, '.agents/skills/mpx2skyline')
const read = file => JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8'))
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
const manifest = read('evals.json')
const assertions = manifest.evals.flatMap(item => item.assertions)

test('preserves 38 capability IDs across four cases', () => {
  expect(manifest.evals.map(item => item.assertions.length)).toEqual([12, 11, 8, 7])
  expect(new Set(assertions.map(item => item.id)).size).toBe(38)
  const changes = read('assertion-migration.json').items
  expect(changes).toHaveLength(38)
  expect(assertions.map(item => item.id)).toEqual(changes.map(item => item.previous.id))
  assertions.forEach(a => expect(changes.find(item => item.assertion_id === a.id).current).toEqual(a))
})

test('metadata, inputs and exact source headings resolve', () => {
  manifest.evals.forEach(item => {
    const dir = `eval-${item.id}-${item.name}`
    const metadata = read(`${dir}/eval_metadata.json`)
    expect(metadata.assertions).toEqual(item.assertions)
    expect(metadata.files).toEqual(item.files)
    expect(metadata.prompt_template).toBe(item.prompt_template)
    item.files.forEach(file => expect(fs.existsSync(path.join(__dirname, dir, file))).toBe(true))
    item.assertions.forEach(a => {
      const source = fs.readFileSync(path.join(skill, a.source.file), 'utf8')
      const headings = source.split('\n').filter(line => /^#{1,6} /.test(line)).map(line => line.replace(/^#+ /, ''))
      expect(headings).toContain(a.source.section)
    })
    if (item.validation_contract) expect(fs.existsSync(path.join(__dirname, item.validation_contract))).toBe(true)
  })
})

test('all cases use the implementation template', () => {
  const templates = read('prompt_templates.json')
  expect(Object.keys(templates.templates)).toEqual(['implementation'])
  expect(templates.templates.implementation).toContain('按task.md实施')
  expect(manifest.evals.every(item => item.prompt_template === 'implementation')).toBe(true)
  expect(templates.skill_instructions.no_skill).toContain('不读取任何Skill')
  expect(templates.templates.implementation).toContain('{{SKILL_INSTRUCTION}}')
})

test('new semantics and common contracts cover the changed requirements', () => {
  const media = assertions.find(item => item.id === 's0_03')
  expect(media.text).toContain('媒体查询专用类')
  expect(media.verification).toContain('监听清理')
  expect(media.text).not.toContain('覆盖位于媒体查询之后')
  const common = read('common-validation.json')
  expect(common.checks.map(item => item.id)).toEqual(['mpx-bindings', 'renderer-exposure', 'component-config', 'delivery-scope', 'evidence'])
  expect(read('creation-validation.json').extends).toBe('common-validation.json')
})

test('fixture and definition fingerprints match, including the latest skill', () => {
  Object.entries(read('fixture-provenance.json').files).forEach(([file, digest]) => expect(hash(path.join(__dirname, file))).toBe(digest))
  Object.entries(read('source-snapshot.json').files).forEach(([file, digest]) => expect(hash(path.join(__dirname, file))).toBe(digest))
  Object.entries(read('skill-source.json').files).forEach(([file, digest]) => expect(hash(path.join(skill, file))).toBe(digest))
  expect(manifest.status).toBe('cases-ready-not-run')
  expect(read('run-metadata.json').status).toBe('not_run')
  expect(fs.existsSync(path.join(__dirname, 'benchmark.json'))).toBe(false)
})

test('case directories and input fingerprints cover exactly the retained cases', () => {
  const dirs = manifest.evals.map(item => `eval-${item.id}-${item.name}`)
  expect(fs.readdirSync(__dirname).filter(name => name.startsWith('eval-')).sort()).toEqual(dirs.sort())
  const inputs = manifest.evals.flatMap(item => item.files.map(file => `eval-${item.id}-${item.name}/${file}`))
  expect(Object.keys(read('fixture-provenance.json').files).sort()).toEqual(inputs.sort())
})
