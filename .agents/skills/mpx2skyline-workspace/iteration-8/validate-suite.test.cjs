const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const skill = path.join(__dirname, 'skill-snapshots/mpx2skyline')
const read = file => JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8'))
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
const manifest = read('evals.json')
const assertions = manifest.evals.flatMap(item => item.assertions)

test('preserves 38 capability IDs and adds two case0 regressions', () => {
  expect(manifest.evals.map(item => item.assertions.length)).toEqual([14, 11, 8, 7])
  expect(new Set(assertions.map(item => item.id)).size).toBe(40)
  const changes = read('assertion-migration.json').items
  expect(changes).toHaveLength(40)
  expect(assertions.map(item => item.id)).toEqual(changes.map(item => item.assertion_id))
  expect(changes.filter(item => item.previous)).toHaveLength(38)
  expect(changes.filter(item => item.disposition === 'added').map(item => item.assertion_id)).toEqual(['s0_12', 's0_13'])
  expect(changes.filter(item => item.disposition === 'added').every(item => item.previous === null)).toBe(true)
  assertions.forEach(a => expect(changes.find(item => item.assertion_id === a.id).current).toEqual(a))
})

test('metadata, inputs and exact source headings resolve', () => {
  manifest.evals.forEach(item => {
    const dir = `eval-${item.id}-${item.name}`
    const metadata = read(`${dir}/eval_metadata.json`)
    expect(metadata.assertions).toEqual(item.assertions)
    expect(metadata.files).toEqual(item.files)
    expect(metadata.prompt).toBe(item.prompt)
    expect(metadata.outputs).toEqual(item.outputs)
    expect(metadata.eval_id).toBe(item.id)
    expect(metadata.eval_name).toBe(item.name)
    item.files.forEach(file => expect(fs.existsSync(path.join(__dirname, dir, file))).toBe(true))
    item.assertions.forEach(a => {
      const source = fs.readFileSync(path.join(skill, a.source.file), 'utf8')
      const headings = source.split('\n').filter(line => /^#{1,6} /.test(line)).map(line => line.replace(/^#+ /, ''))
      expect(headings).toContain(a.source.section)
    })
    if (item.validation_contract) expect(fs.existsSync(path.join(__dirname, item.validation_contract))).toBe(true)
  })
})

test('two isolated groups use the RN execution protocol', () => {
  const templates = read('prompt_templates.json')
  expect(manifest.comparison.groups.map(group => group.id)).toEqual(['mpx', 'mpx2skyline'])
  expect(Object.keys(templates.templates)).toEqual(['mpx', 'mpx2skyline'])
  expect(templates.agent_config.fork_turns).toBe('none')
  expect(manifest.runner.subagent_config).toEqual({ model: 'gpt-6.1-sol', reasoning_effort: 'high', fork_turns: 'none' })
  Object.entries(templates.templates).forEach(([group, template]) => {
    expect(template.prompt).toContain(`/${group}/SKILL.md`)
    expect(template.prompt).toContain('{{WORKDIR}}')
    expect(template.prompt).toContain('{{INPUT_DIR}}/task.md')
    expect(template.prompt).toContain('{{REQUIRED_OUTPUTS}}')
    expect(template.prompt).toContain('不得自动加载其他 Skill')
    expect(template.prompt).toContain('WebView / Skyline')
  })
})

test('environment dependency declarations match RN and target wx explicitly', () => {
  const skyline = read('../package.json')
  const rn = read('../../mpx2rn-workspace/package.json')
  expect(skyline.dependencies).toEqual(rn.dependencies)
  expect(skyline.devDependencies).toEqual(rn.devDependencies)
  expect(skyline.scripts['compile-validate']).toContain('--target=wx')
  ;['babel.config.json', 'eslint.config.mjs'].forEach(file => {
    expect(fs.readFileSync(path.join(__dirname, '..', file), 'utf8')).toBe(
      fs.readFileSync(path.join(__dirname, '../../mpx2rn-workspace', file), 'utf8'))
  })
  expect(require('../mpx.config.js').pluginOptions.mpx.plugin).toEqual({ srcMode: 'wx' })
})

test('new semantics and common contracts cover the changed requirements', () => {
  const media = assertions.find(item => item.id === 's0_03')
  expect(media.text).toContain('媒体查询专用类')
  expect(media.verification).toContain('监听清理')
  expect(media.text).not.toContain('覆盖位于媒体查询之后')
  const negative = assertions.find(item => item.id === 's0_12')
  const horizontal = assertions.find(item => item.id === 's0_13')
  expect(negative.source.section).toBe('Block 与 Inline 布局下子节点的垂直负 margin 失效问题')
  expect(horizontal.source.section).toBe('横向 scroll-view 内 Flex 子节点无法自动撑满')
  const styleCard = fs.readFileSync(path.join(__dirname, 'eval-0-style-layout/input/style-card.mpx'), 'utf8')
  expect(styleCard).toContain('margin-bottom: -28rpx')
  expect(styleCard).toContain('margin-top: -92rpx')
  expect(styleCard).toContain('simple-next')
  expect(styleCard).toContain('scroll-x="{{true}}"')
  expect(styleCard).toContain('type="custom"')
  expect(styleCard).toContain('class="fit-content"')
  expect(styleCard).not.toMatch(/\.fit-content\s*\{[^}]*\bwidth\s*:/)
  const common = read('common-validation.json')
  expect(common.checks.map(item => item.id)).toEqual(['mpx-bindings', 'renderer-exposure', 'component-config', 'delivery-scope', 'evidence'])
  expect(read('creation-validation.json').extends).toBe('common-validation.json')
})

test('fixture and definition fingerprints match their recorded sources', () => {
  Object.entries(read('fixture-provenance.json').files).forEach(([file, digest]) => expect(hash(path.join(__dirname, file))).toBe(digest))
  Object.entries(read('source-snapshot.json').files).forEach(([file, digest]) => expect(hash(path.join(__dirname, file))).toBe(digest))
  Object.entries(read('skill-source.json').files).forEach(([file, digest]) => expect(hash(path.join(skill, file))).toBe(digest))
  expect(['cases-ready-not-run', 'completed']).toContain(manifest.status)
  expect(read('run-metadata.json').status).toBe(manifest.status === 'completed' ? 'completed' : 'not_run')
  if (manifest.status === 'completed') {
    const results = read('execution-results.json')
    expect(results).toHaveLength(manifest.evals.length * manifest.comparison.groups.length)
    expect(results.every(result => result.returncode === 0 && result.output_exists && result.sources_unchanged)).toBe(true)
  }
})

test('case directories and input fingerprints cover exactly the retained cases', () => {
  const dirs = manifest.evals.map(item => `eval-${item.id}-${item.name}`)
  expect(fs.readdirSync(__dirname).filter(name => name.startsWith('eval-')).sort()).toEqual(dirs.sort())
  const inputs = manifest.evals.flatMap(item => item.files.map(file => `eval-${item.id}-${item.name}/${file}`))
  expect(Object.keys(read('fixture-provenance.json').files).sort()).toEqual(inputs.sort())
})
