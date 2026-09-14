const fs = require('fs')
const path = require('path')
const vm = require('vm')
const compiler = require('/Users/hjw/project/mpx/packages/webpack-plugin/lib/template-compiler/compiler')
const output = path.resolve(__dirname, '../outputs')
const source = fs.readFileSync(path.join(output, 'user-list.mpx'), 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
let options
vm.runInNewContext(script.replace(/import[^\n]+/, ''), { createComponent: value => { options = value } })

test('empty initialization and null responses; visible rows retain order', () => {
  expect(Array.isArray(options.initData.visibleItems)).toBe(true)
  const context = Object.assign({}, options.data)
  const visible = () => options.computed.visibleItems.call(context)
  expect(visible()).toEqual([])
  options.methods.setRows.call(context, { items: null })
  expect(visible()).toEqual([])
  options.methods.setRows.call(context, { items: [{ id: 1, visible: false }, { id: 2, name: 'A', visible: true }, { id: 3, name: 'B', visible: true }] })
  expect(visible().map(item => item.id)).toEqual([2, 3])
  options.methods.setRows.call(context, { items: null })
  expect(visible()).toEqual([])
})

test('scroll method selects actual enhanced list and scrolls to zero', () => {
  const scrollTo = jest.fn()
  const query = { select: jest.fn(() => query), node: jest.fn(() => query), exec: cb => cb([{ node: { scrollTo } }]) }
  options.methods.scrollTop.call({ createSelectorQuery: () => query })
  expect(query.select).toHaveBeenCalledWith('#users')
  expect(scrollTo).toHaveBeenCalledWith({ top: 0 })
  expect(source).toMatch(/<scroll-view\s+id="users"[^>]*enhanced="\{\{true\}\}"/)
})

test('wx parser accepts both templates and preserves external row context and navigation', () => {
  const main = compiler.parseComponent(source, { mode: 'wx' }).template.content
  const row = fs.readFileSync(path.join(output, 'row.wxml'), 'utf8')
  const errors = []
  const warnings = []
  ;[main, row].forEach((template, index) => {
    const parsed = compiler.parse(template, { mode: 'wx', srcMode: 'wx', warn: message => warnings.push(message), error: message => errors.push(message) })
    fs.writeFileSync(path.join(__dirname, `compiled-${index}.wxml`), compiler.serialize(parsed.root))
  })
  fs.writeFileSync(path.join(__dirname, 'compiler-diagnostics.json'), JSON.stringify({ errors, warnings }, null, 2))
  expect(errors).toEqual([])
  expect(main).toContain('data="{{item,index}}"')
  expect(row).toContain('<template name="user-row">')
  expect(row).toContain('{{index}}:{{item.name}}')
  expect(main).not.toContain('<include')
  expect(main.match(/url="\/pages\/detail"/g)).toHaveLength(2)
  expect(main).not.toMatch(/<navigator[^>]*>\s*<view/)
  expect(options.properties.payload.optionalTypes[0].name).toBe('Object')
  expect(options.data.config.default).toBe('keep')
})
