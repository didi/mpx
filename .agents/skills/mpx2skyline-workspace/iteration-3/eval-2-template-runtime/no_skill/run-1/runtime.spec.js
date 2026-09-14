const fs = require('fs')
const path = require('path')
const vm = require('vm')
const source = fs.readFileSync(path.join(__dirname, '../outputs/user-list.mpx'), 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/import[^\n]+\n/, '')
let options
let wx
beforeEach(() => {
  wx = { navigateTo: jest.fn() }
  vm.runInNewContext(script, { createComponent: value => { options = value }, wx })
})
test('initial, null and filtered data states', () => {
  const state = options.data
  expect(options.computed.visibleItems.call(state)).toEqual([])
  options.methods.setRows.call(state, { items: null })
  expect(options.computed.visibleItems.call(state)).toEqual([])
  options.methods.setRows.call(state, { items: [
    { id: 'a', name: 'A', visible: true },
    { id: 'b', name: 'B', visible: false },
    { id: 'c', name: 'C', visible: true }
  ] })
  expect(options.computed.visibleItems.call(state).map(row => row.id)).toEqual(['a', 'c'])
})
test('scrolls the users node within this component', () => {
  const scrollTo = jest.fn()
  const query = {
    in: jest.fn(function () { return this }),
    select: jest.fn(function () { return this }),
    node: jest.fn(function () { return this }),
    exec: callback => callback([{ node: { scrollTo } }])
  }
  wx.createSelectorQuery = () => query
  const component = {}
  options.methods.scrollTop.call(component)
  expect(query.in).toHaveBeenCalledWith(component)
  expect(query.select).toHaveBeenCalledWith('#users')
  expect(scrollTo).toHaveBeenCalledWith({ top: 0 })
})
test('both detail entries invoke the detail navigation method', () => {
  expect(source.match(/bindtap="openDetail"/g)).toHaveLength(2)
  options.methods.openDetail()
  expect(wx.navigateTo).toHaveBeenCalledWith({ url: '/pages/detail' })
})
test('fragment uses the explicit loop bindings and component JSON parses', () => {
  const fragment = fs.readFileSync(path.join(__dirname, '../outputs/row.wxml'), 'utf8')
  expect(source).toContain('wx:for-item="user" wx:for-index="rowIndex"')
  expect(fragment).toContain('{{rowIndex}}:{{user.name}}')
  expect(JSON.parse(source.match(/<script type="application\/json">([\s\S]*?)<\/script>/)[1])).toEqual({ component: true })
})
