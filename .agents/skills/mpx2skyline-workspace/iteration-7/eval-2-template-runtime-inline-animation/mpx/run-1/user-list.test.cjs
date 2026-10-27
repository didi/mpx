const fs = require('fs')
const path = require('path')
const vm = require('vm')

const outputDir = path.resolve(__dirname, '../outputs')
const source = fs.readFileSync(path.join(outputDir, 'user-list.mpx'), 'utf8')
const row = fs.readFileSync(path.join(outputDir, 'row.wxml'), 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
const template = source.slice(0, source.indexOf('<script>'))
const style = source.match(/<style>([\s\S]*?)<\/style>/)[1]
let options
const navigateTo = jest.fn()
vm.runInNewContext(script.replace(/^import .*$/gm, ''), {
  createComponent (value) { options = value },
  navigateTo
})

function instance (renderer) {
  const value = Object.assign({ renderer }, JSON.parse(JSON.stringify(options.data)), options.methods)
  Object.defineProperty(value, 'visibleItems', {
    get () { return options.computed.visibleItems.call(value) }
  })
  return value
}

beforeEach(() => navigateTo.mockClear())

describe.each(['webview', 'skyline'])('%s script mock (no host renderer)', renderer => {
  test('initial render and pre-response list are empty', () => {
    expect(Array.isArray(options.initData.visibleItems)).toBe(true)
    expect(options.initData.visibleItems).toHaveLength(0)
    const component = instance(renderer)
    expect(component.items).toEqual([])
    expect(component.visibleItems).toEqual([])
  })

  test('null, filtered array, replacement array and null again', () => {
    const component = instance(renderer)
    component.setRows({ items: null })
    expect(component.visibleItems).toEqual([])
    const hidden = { id: 1, name: '隐藏', visible: false }
    const first = { id: 2, name: '甲', visible: true }
    const second = { id: 3, name: '乙', visible: true }
    const items = [hidden, first, second]
    component.setRows({ items })
    expect(component.visibleItems).toEqual([first, second])
    expect(component.visibleItems[0]).toBe(first)
    expect(items).toEqual([hidden, first, second])
    // Mock only: substitute the two explicitly passed WXML fields.
    const text = row.match(/<text>(.*?)<\/text>/)[1]
    expect(component.visibleItems.map((item, index) => text
      .replace('{{index}}', index).replace('{{item.name}}', item.name))).toEqual(['0:甲', '1:乙'])
    component.setRows({ items: [{ id: 4, name: '新', visible: true }] })
    expect(component.visibleItems.map(item => item.name)).toEqual(['新'])
    component.setRows({ items: [] })
    expect(component.visibleItems).toEqual([])
    component.setRows({ items: null })
    expect(component.visibleItems).toEqual([])
  })

  test('component-scoped query selects the enhanced users node and scrolls only it', () => {
    const component = instance(renderer)
    const users = { scrollTo: jest.fn() }
    const other = { scrollTo: jest.fn() }
    const nodes = { '#users': users, '#other': other }
    let selected
    const query = {
      select: jest.fn(selector => { selected = selector; return query }),
      node: jest.fn(() => query),
      exec: jest.fn(callback => callback([{ node: nodes[selected] }]))
    }
    component.createSelectorQuery = jest.fn(() => query)
    component.scrollTop()
    component.scrollTop()
    expect(component.createSelectorQuery).toHaveBeenCalledTimes(2)
    expect(query.select).toHaveBeenCalledWith('#users')
    expect(query.node).toHaveBeenCalledTimes(2)
    expect(users.scrollTo).toHaveBeenNthCalledWith(1, { top: 0 })
    expect(users.scrollTo).toHaveBeenNthCalledWith(2, { top: 0 })
    expect(other.scrollTo).not.toHaveBeenCalled()
    expect(template).toMatch(/<scroll-view id="users"[^>]*enhanced="{{true}}"/)
  })

  test('same control presses, releases, cancels and remains clickable', () => {
    const component = instance(renderer)
    const button = template.match(/<view class="button"([^>]*)>/)[1]
    const dispatch = event => component[button.match(new RegExp('bind' + event + '="([^"]+)"'))[1]]()
    component.scrollTop = jest.fn()
    expect(component.pressed).toBe(false)
    dispatch('touchstart')
    expect(component.pressed).toBe(true)
    dispatch('touchend')
    expect(component.pressed).toBe(false)
    dispatch('tap')
    expect(component.scrollTop).toHaveBeenCalledTimes(1)
    dispatch('touchstart')
    dispatch('touchcancel')
    expect(component.pressed).toBe(false)
  })

  test('detail text has native URL and card handler calls navigation API', () => {
    expect(template).toMatch(/<navigator url="\/pages\/detail"><text>详情<\/text><\/navigator>/)
    expect(template).toMatch(/<view bindtap="openDetail"><view>卡片详情<\/view><\/view>/)
    instance(renderer).openDetail()
    expect(navigateTo).toHaveBeenCalledWith({ url: '/pages/detail' })
  })
})

test('property interface and config values', () => {
  expect(options.properties.label.type.name).toBe('String')
  expect(options.properties.label.value).toBe('用户')
  expect(options.properties.payload.type.name).toBe('String')
  expect(options.properties.payload.optionalTypes.map(type => type.name)).toEqual(['Object'])
  expect(options.properties.payload.value).toBe('')
  expect(options.data.config.default).toBe('keep')
})

test('static title is a shared inline paragraph with whole-paragraph ellipsis', () => {
  expect(template).toMatch(/mpxTagName@wx="span" class="truncate" max-lines="\{\{1\}\}" overflow="ellipsis"><image[^>]*mode="aspectFit"[^>]*\/><text>{{label}}<\/text><\/view>/)
  expect(style).toMatch(/\.truncate\s*\{[^}]*width: 0;[^}]*white-space: nowrap;[^}]*overflow: hidden;[^}]*text-overflow: ellipsis;/)
})

test('named external row receives filtered index and item as direct list entries', () => {
  expect(template).toContain('<import src="./row.wxml"/>')
  expect(template).toMatch(/<scroll-view id="users"[^>]*>\s*<view wx:for="{{visibleItems}}" wx:key="id"><template is="user-row" data="{{index, item}}"\/><\/view>\s*<\/scroll-view>/)
  expect(row).toMatch(/<template name="user-row">\s*<text>{{index}}:{{item.name}}<\/text>/)
  expect(template).not.toContain('<include')
})

test('static pulse and press feedback preserve sizes, endpoints and timing', () => {
  expect(style).toMatch(/\.pulse\s*\{[^}]*width: 8px; height: 8px;[^}]*background: #f50; opacity: .3; animation: userListPulse 1s infinite; animation-fill-mode: both;/)
  expect(style).toContain('@keyframes userListPulse { from { opacity: .3; } to { opacity: 1; } }')
  expect(style).toMatch(/\.button\s*\{[^}]*transform: scale\(1\); opacity: 1; transition: transform 150ms linear, opacity 150ms linear;/)
  expect(style).toContain('.button.pressed { transform: scale(.96); opacity: .7; }')
  expect(source).not.toMatch(/createAnimation|animationData|::before|::after|backwards/)
})
