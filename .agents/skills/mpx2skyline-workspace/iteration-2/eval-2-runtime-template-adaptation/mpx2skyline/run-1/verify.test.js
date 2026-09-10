const fs = require('fs')
const path = require('path')
const vm = require('vm')
const source = fs.readFileSync(path.join(__dirname, '../outputs/user-list.mpx'), 'utf8')
const row = fs.readFileSync(path.join(__dirname, '../outputs/row.wxml'), 'utf8')
let component
vm.runInNewContext(source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/import .*from '@mpxjs\/core'/, ''), {
  createComponent: value => { component = value }, String, Object
})

test('initial render and pending, null, empty and populated data preserve loop semantics', () => {
  expect(Array.isArray(component.initData.visibleItems)).toBe(true)
  const state = Object.assign({}, component.data)
  const list = () => component.computed.visibleItems.call(state)
  expect(list()).toEqual([])
  component.methods.setRows.call(state, { items: null })
  expect(list()).toEqual([])
  component.methods.setRows.call(state, { items: [] })
  expect(list()).toEqual([])
  const visible = { id: 1, name: '甲', visible: true }
  component.methods.setRows.call(state, { items: [visible, { id: 2, name: '乙', visible: false }] })
  expect(list()).toEqual([visible])
  expect(list()[0]).toBe(visible)
  component.methods.setRows.call(state, { items: null })
  expect(list()).toEqual([])
})

test('property defaults, String/Object payload contract and business config survive', () => {
  expect(component.properties.label.value).toBe('用户')
  expect(component.properties.payload.type).toBe(String)
  expect(component.properties.payload.optionalTypes).toEqual([Object])
  expect(component.properties.payload.value).toBe('')
  expect(component.data.config.default).toBe('keep')
})

test('top button queries its own enhanced scroll container in either renderer', () => {
  const tags = source.match(/<scroll-view\b[^>]*>/g)
  tags.forEach(tag => expect(tag).toMatch(/type="list"/))
  const target = tags.find(tag => tag.includes('id="users"'))
  expect(target).toMatch(/enhanced="\{\{true\}\}"/)
  expect(target).toMatch(/scroll-y="\{\{true\}\}"/)
  ;['webview', 'skyline'].forEach(renderer => {
    const scrollTo = jest.fn()
    const query = { select: jest.fn().mockReturnThis(), node: jest.fn().mockReturnThis(), exec: callback => callback([{ node: { scrollTo } }]) }
    component.methods.scrollTop.call({ renderer, createSelectorQuery: () => query })
    expect(query.select).toHaveBeenCalledWith('#users')
    expect(query.node).toHaveBeenCalled()
    expect(scrollTo).toHaveBeenCalledWith({ top: 0 })
  })
  expect(source).toContain('bindtap="scrollTop"')
})

test('imported row explicitly receives loop item and filtered index', () => {
  expect(source).toContain('<import src="./row.wxml"/>')
  expect(source).toContain('<template is="user-row" data="{{item, index}}"/>')
  expect(source).not.toContain('<include')
  expect(row).toContain('<template name="user-row">')
  expect(row).toContain('{{index}}:{{item.name}}')
  expect(source).toMatch(/scroll-y="\{\{true\}\}">\s*<view wx:for="\{\{visibleItems\}\}" wx:key="id">/)
})
