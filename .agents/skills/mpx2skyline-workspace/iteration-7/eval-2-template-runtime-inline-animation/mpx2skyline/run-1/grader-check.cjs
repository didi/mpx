const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { parseDocument } = require('htmlparser2')
const postcss = require('postcss')
const source = fs.readFileSync(path.resolve(__dirname, '../outputs/user-list.mpx'), 'utf8')
const compiled = fs.readFileSync(path.join(__dirname, 'grader-compiled/__validate_0.wxml'), 'utf8')
const style = postcss.parse(fs.readFileSync(path.join(__dirname, 'grader-compiled/__validate_0.wxss'), 'utf8'))
const row = fs.readFileSync(path.join(__dirname, 'grader-compiled/template/row366d1826.wxml'), 'utf8')
const doc = parseDocument(compiled, { xmlMode: true, decodeEntities: false })
const nodes = []
const visit = node => { if (node.type === 'tag') nodes.push(node); (node.children || []).forEach(visit) }
visit(doc)
const button = nodes.find(n => n.attribs.bindtap === 'scrollTop')
const target = nodes.find(n => n.attribs.id === 'users')
const span = nodes.find(n => n.name === 'span')
assert.ok(span)
assert.equal(span.attribs['max-lines'], '{{1}}')
assert.equal(span.attribs.overflow, 'ellipsis')
assert.deepEqual(span.children.filter(n => n.type === 'tag').map(n => n.name), ['image', 'text'])
assert.equal(target.attribs.enhanced, '{{true}}')
assert.ok(button.attribs.class.includes('_s_.c("button", {pressed:pressed})'))
assert.equal(nodes.find(n => n.name === 'template').attribs.is, 'user-row')
assert.equal(nodes.find(n => n.name === 'template').attribs.data, '{{index, item}}')
assert.ok(row.includes('<template name="user-row">'))
const declarations = selector => {
  const values = {}
  style.walkRules(selector, rule => rule.walkDecls(decl => { values[decl.prop] = decl.value }))
  return values
}
const evidence = []
;['skyline', 'webview'].forEach(renderer => {
  let options
  const navigations = []
  const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
  vm.runInNewContext(script, { createComponent: value => { options = value }, wx: { navigateTo: value => navigations.push(value) } })
  const instance = Object.assign({ renderer }, JSON.parse(JSON.stringify(options.data)))
  Object.keys(options.methods).forEach(key => { instance[key] = options.methods[key].bind(instance) })
  const list = () => options.computed.visibleItems.call(instance)
  assert.ok(Array.isArray(options.initData.visibleItems))
  assert.equal(options.initData.visibleItems.length, 0)
  assert.equal(list().length, 0)
  ;[undefined, null, []].forEach(items => { instance.setRows({ items }); assert.ok(Array.isArray(list())); assert.equal(list().length, 0) })
  const rows = [{ id: 'a', name: '甲', visible: true }, { id: 'hidden', name: '隐藏', visible: false }, { id: 'b', name: '乙', visible: true }]
  instance.setRows({ items: rows })
  const renderedRows = Array.from(list(), (item, index) => row.replace(/\{\{index\}\}/g, index).replace(/\{\{item.name\}\}/g, item.name))
  assert.ok(renderedRows[0].includes('0:甲'))
  assert.ok(renderedRows[1].includes('1:乙'))
  assert.equal(renderedRows.length, 2)
  const calls = []
  const otherCalls = []
  instance.createSelectorQuery = function () {
    assert.equal(this, instance)
    return { select: selector => {
      calls.push({ selector })
      const match = nodes.find(node => '#' + node.attribs.id === selector)
      assert.equal(match, target)
      return { node: () => ({ exec: callback => callback([{ node: { scrollTo: value => (match.attribs.id === 'users' ? calls : otherCalls).push({ scrollTo: value }) } }]) }) }
    } }
  }
  instance[button.attribs.bindtouchstart]()
  assert.equal(instance.pressed, true)
  instance[button.attribs.bindtouchend]()
  assert.equal(instance.pressed, false)
  instance[button.attribs.bindtouchstart]()
  instance[button.attribs.bindtouchcancel]()
  assert.equal(instance.pressed, false)
  instance[button.attribs.bindtap]()
  assert.equal(calls[0].selector, '#users')
  assert.equal(calls[1].scrollTo.top, 0)
  assert.equal(otherCalls.length, 0)
  const navigator = nodes.find(n => n.name === 'navigator')
  assert.equal(navigator.attribs.url, '/pages/detail')
  assert.deepEqual(navigator.children.filter(n => n.type === 'tag').map(n => n.name), ['text'])
  instance[nodes.find(n => n.attribs.bindtap === 'openDetail').attribs.bindtap]()
  assert.equal(navigations[0].url, '/pages/detail')
  evidence.push({ renderer, initialArray: true, undefinedNullEmptyNormalized: true, filteredRows: ['0:甲', '1:乙'], scopedQueryCalls: calls, otherContextCalled: false, buttonTouchAndTapFromCompiledBindings: true, detailTarget: navigations[0].url })
})
const result = { status: 'passed', kind: 'grader-static-compiled-and-mock', evidence, compiledTemplate: { actualInlineTag: span.name, maxLines: span.attribs['max-lines'], overflow: span.attribs.overflow, logoDisplayDeclaration: declarations('.logo').display || null, inlineBlockEvidence: declarations('.logo').display === 'inline-block', titleWidth: declarations('.truncate').width, titleFlex: declarations('.truncate').flex, dynamicButtonClass: button.attribs.class }, boundary: 'VM options and parsed actual wx compilation; no WeChat rendering, default image display or geometric measurement', device: 'not_run' }
fs.writeFileSync(path.join(__dirname, 'grader-evidence.json'), JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
