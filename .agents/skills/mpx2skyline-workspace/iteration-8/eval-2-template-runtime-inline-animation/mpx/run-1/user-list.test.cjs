const fs = require('fs')
const path = require('path')
const vm = require('vm')

const source = fs.readFileSync(path.join(__dirname, '../outputs/user-list.mpx'), 'utf8')
const row = fs.readFileSync(path.join(__dirname, '../outputs/row.wxml'), 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/import[^\n]+\n/, '')
let options
const navigateTo = jest.fn()
vm.runInNewContext(script, { Array, String, Object, wx: { navigateTo }, createComponent: value => { options = value } })

const visible = instance => options.computed.visibleItems.call(instance)
const mount = renderer => Object.assign({ renderer }, JSON.parse(JSON.stringify(options.data)), options.methods)

beforeEach(() => navigateTo.mockClear())

describe.each(['webview', 'skyline'])('%s script with mocked host', renderer => {
  test('initial and pre-response list are arrays', () => {
    const instance = mount(renderer)
    expect(Array.isArray(options.initData.visibleItems)).toBe(true)
    expect(options.initData.visibleItems).toHaveLength(0)
    expect(visible(instance)).toEqual([])
    expect(visible(instance)).toEqual([])
  })

  test('null, visible filtering, replacement and empty updates', () => {
    const instance = mount(renderer)
    instance.setRows({ items: null })
    expect(visible(instance)).toEqual([])
    const items = [{ id: 1, name: 'hidden', visible: false }, { id: 2, name: '甲', visible: true }, { id: 3, name: '乙', visible: true }]
    instance.setRows({ items })
    expect(visible(instance).map((item, index) => `${index}:${item.name}`)).toEqual(['0:甲', '1:乙'])
    expect(items).toHaveLength(3)
    instance.setRows({ items: [{ id: 4, name: '丙', visible: true }] })
    expect(visible(instance).map(item => item.id)).toEqual([4])
    instance.setRows({ items: [] })
    expect(visible(instance)).toEqual([])
    instance.setRows({ items: null })
    expect(visible(instance)).toEqual([])
  })

  test('query resolves actual enhanced list and calls its context only', () => {
    const instance = mount(renderer)
    const users = { scrollTo: jest.fn() }
    const other = { scrollTo: jest.fn() }
    const nodes = { users, other }
    let selected
    const query = {
      select: jest.fn(selector => {
        const id = selector.slice(1)
        const tag = source.match(new RegExp('<scroll-view[^>]*id="' + id + '"[^>]*>'))
        expect(tag).not.toBeNull()
        expect(tag[0]).toContain('enhanced="{{true}}"')
        expect(tag[0]).toContain('scroll-y="{{true}}"')
        selected = nodes[id]
        return query
      }),
      node: jest.fn(() => query),
      exec: callback => callback([{ node: selected }])
    }
    instance.createSelectorQuery = jest.fn(() => query)
    instance.scrollTop()
    expect(instance.createSelectorQuery).toHaveBeenCalledTimes(1)
    expect(query.select).toHaveBeenCalledWith('#users')
    expect(query.node).toHaveBeenCalledTimes(1)
    expect(users.scrollTo).toHaveBeenCalledWith({ top: 0 })
    expect(other.scrollTo).not.toHaveBeenCalled()
  })

  test('same button press, release and cancel restore state', () => {
    const instance = mount(renderer)
    expect(instance.pressed).toBe(false)
    instance.press()
    expect(instance.pressed).toBe(true)
    instance.release()
    expect(instance.pressed).toBe(false)
    instance.press()
    instance.release()
    expect(instance.pressed).toBe(false)
    const button = source.match(/<view class="button"[^>]*>/)[0]
    expect(button).toContain('bindtouchstart="press"')
    expect(button).toContain('bindtouchend="release"')
    expect(button).toContain('bindtouchcancel="release"')
    expect(button).toContain('bindtap="scrollTop"')
    expect(button).toContain("'button-pressed': pressed")
    expect(source).toMatch(/transition: transform 150ms ease, opacity 150ms ease/)
    expect(source).toMatch(/\.button-pressed \{ transform: scale\(0\.96\); opacity: \.7;/)
  })

  test('both detail routes retain their triggers', () => {
    const instance = mount(renderer)
    expect(source).toContain('<navigator url="/pages/detail"><text>详情</text></navigator>')
    expect(source).toContain('<view bindtap="openDetail"><view>卡片详情</view></view>')
    instance.openDetail()
    expect(navigateTo).toHaveBeenCalledWith({ url: '/pages/detail' })
  })
})

test('row import passes filtered index and item explicitly', () => {
  expect(source).toContain('<import src="./row.wxml"/>')
  expect(source).not.toContain('<include')
  expect(source).toContain('<view wx:for="{{visibleItems}}" wx:key="id"><template is="user-row" data="{{item: item, index: index}}"/></view>')
  expect(row.trim()).toBe('<template name="user-row"><text>{{index}}:{{item.name}}</text></template>')
})

test('title structure supports shared truncation; this is not rendered geometry', () => {
  expect(source).toContain('mpxTagName@wx="span" class="title" max-lines="{{1}}" overflow="ellipsis"')
  expect(source).toMatch(/<image[^>]+class="logo"[^>]+\/><text>\{\{label\}\}<\/text><\/view>/)
  expect(source).toContain("'logo-inline': renderer === 'skyline'")
  expect(source).toContain('.logo-inline { display: inline-block; }')
  expect(source).toContain('.title { flex: 1; width: 0; min-width: 0; }')
  expect(source).toContain('.truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }')
})

test('pulse is real node with original one second opacity cycle', () => {
  expect(source).toContain('<view class="pulse"/>')
  expect(source).not.toContain('::before')
  expect(source).not.toContain('createAnimation')
  expect(source).toMatch(/width: 8px; height: 8px; border-radius: 4px; background: #f50/)
  expect(source).toContain('animation: user-list-pulse 1s ease infinite; animation-fill-mode: both;')
  expect(source).toContain('@keyframes user-list-pulse { from { opacity: .3; } to { opacity: 1; } }')
})

test('public properties and config.default are preserved', () => {
  expect(options.properties.label.type).toBe(String)
  expect(options.properties.label.value).toBe('用户')
  expect(options.properties.payload.type).toBe(String)
  expect(options.properties.payload.optionalTypes).toEqual([Object])
  expect(options.properties.payload.value).toBe('')
  expect(options.data.config.default).toBe('keep')
})
