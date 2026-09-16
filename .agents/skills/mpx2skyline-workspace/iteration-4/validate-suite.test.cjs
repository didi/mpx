const fs = require('fs')
const path = require('path')
const repo = process.cwd()
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'))
const manifest = read(path.join(__dirname, 'evals.json'))
const assertions = manifest.evals.flatMap(item => item.assertions)

test('four cases preserve all 31 adaptation assertions and add six creation assertions', () => {
  expect(manifest.evals.map(item => item.assertions.length)).toEqual([12, 11, 8, 6])
  expect(assertions).toHaveLength(37)
  expect(new Set(assertions.map(item => item.id)).size).toBe(37)
  const migration = read(path.join(__dirname, 'assertion-migration.json'))
  expect(migration.items).toHaveLength(31)
  expect(new Set(migration.items.map(item => item.assertion_id)).size).toBe(31)
  migration.items.forEach(move => {
    const current = assertions.find(value => value.id === move.assertion_id)
    expect(current).toBeDefined()
    expect(manifest.evals[move.to_case].assertions).toContain(current)
    if (move.disposition !== 'preserved') {
      expect(move.previous_text.length).toBeGreaterThan(0)
      expect(move.previous_verification.length).toBeGreaterThan(0)
      expect([1, 2]).toContain(move.to_case)
    } else {
      expect(current.text).toBe(move.previous_text)
      expect(current.verification).toBe(move.previous_verification)
    }
  })
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
  const crypto = require('crypto')
  const provenance = read(path.join(__dirname, 'fixture-provenance.json'))
  Object.entries(provenance.files).forEach(([file, digest]) => {
    expect(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, file))).digest('hex')).toBe(digest)
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


test('unified orders fixture appends grouped pages and retains data on refresh failure', async () => {
  const vm = require('vm')
  const dir = path.join(__dirname, 'eval-1-page-scroll-sticky-layer-config/input')
  expect(fs.readdirSync(dir).sort()).toEqual(['app.json', 'orders.mpx', 'service.js', 'task.md'])
  const service = fs.readFileSync(path.join(dir, 'service.js'), 'utf8')
  const fetchOrders = vm.runInNewContext(service.replace('export function', 'function') + '; fetchOrders')
  const parse = require(path.join(repo, 'packages/webpack-plugin/lib/parser'))
  const file = path.join(dir, 'orders.mpx')
  const sfc = parse(fs.readFileSync(file, 'utf8'), { filePath: file, mode: 'wx' })
  let options
  const stop = jest.fn()
  vm.runInNewContext(sfc.script.content.replace(/^import .*$/gm, ''), {
    createPage: value => { options = value },
    fetchOrders,
    wx: { stopPullDownRefresh: stop }
  })
  const state = Object.assign({}, options.data, options.methods)
  await state.reload()
  expect(state.sections).toHaveLength(4)
  expect(state.sections.every(section => section.items.length === 8)).toBe(true)
  await state.loadMore()
  await state.loadMore()
  expect(state.sections).toHaveLength(12)
  expect(state.pageNo).toBe(3)
  expect(new Set(state.sections.map(section => section.id)).size).toBe(12)
  const orders = state.sections.flatMap(section => section.items)
  expect(new Set(orders.map(order => order.id)).size).toBe(96)
  const previous = state.sections
  await expect(state.reload(true)).rejects.toThrow('订单加载失败')
  expect(state.sections).toBe(previous)
  expect(stop).toHaveBeenCalledTimes(2)
  state.open()
  expect(state.opened).toBe(true)
  state.close()
  expect(state.opened).toBe(false)
  const byId = Object.fromEntries(manifest.evals[1].assertions.map(item => [item.id, item]))
  expect(byId.s4_00.text).toContain('type=custom')
  expect(byId.s1_00.text).not.toContain('type=list')
  ;['s1_01', 's1_02', 's1_03'].forEach(id => expect(byId[id].text).toContain('主订单纵向scroll-view'))
})


test('unified user-list connects heading, external rows and feedback to the same component', () => {
  const vm = require('vm')
  const dir = path.join(__dirname, 'eval-2-template-runtime-inline-animation/input')
  expect(fs.readdirSync(dir).sort()).toEqual(['logo.svg', 'row.wxml', 'task.md', 'user-list.mpx'])
  const file = path.join(dir, 'user-list.mpx')
  const parse = require(path.join(repo, 'packages/webpack-plugin/lib/parser'))
  const sfc = parse(fs.readFileSync(file, 'utf8'), { filePath: file, mode: 'wx' })
  let options
  let selected
  const scrollTo = jest.fn()
  const query = { in () { return this }, select (id) { selected = id; return this }, node () { return this }, exec (cb) { cb([{ node: { scrollTo } }]) } }
  const createAnimation = config => {
    const result = { duration: config.duration }
    return { scale (value) { result.scale = value; return this }, opacity (value) { result.opacity = value; return this }, step () { return this }, export () { return result } }
  }
  vm.runInNewContext(sfc.script.content.replace(/^import .*$/gm, ''), {
    createComponent: value => { options = value },
    wx: { createSelectorQuery: () => query, createAnimation }
  })
  const state = Object.assign({}, options.data, options.methods)
  state.setRows({ items: [{ id: 'a', name: '甲', visible: true }, { id: 'b', name: '乙', visible: false }] })
  expect(options.computed.visibleItems.call(state).map(item => item.id)).toEqual(['a'])
  state.scrollTop()
  expect(selected).toBe('#1users')
  expect(scrollTo).toHaveBeenCalledWith({ top: 0 })
  state.press()
  expect(state.animationData).toEqual({ duration: 150, scale: 0.96, opacity: 0.7 })
  state.release()
  expect(state.animationData).toEqual({ duration: 150, scale: 1, opacity: 1 })
  expect(sfc.template.content).toMatch(/<image[^>]*logo.svg[^>]*\/><text>{{label}}<\/text>/)
  expect(sfc.template.content).toContain('<include src="./row.wxml"/>')
  expect(sfc.template.content).toMatch(/<view[^>]*bindtap="scrollTop"[^>]*bindtouchstart="press"[^>]*bindtouchend="release"[^>]*bindtouchcancel="release"/)
})
