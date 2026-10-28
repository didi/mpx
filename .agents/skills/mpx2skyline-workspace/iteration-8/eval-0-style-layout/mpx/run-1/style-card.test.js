const fs = require('fs')
const path = require('path')
const vm = require('vm')
const postcss = require('postcss')

const source = fs.readFileSync(path.join(__dirname, '../outputs/style-card.mpx'), 'utf8')
const original = fs.readFileSync(path.join(__dirname, '../../input/style-card.mpx'), 'utf8')
const script = source.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
const styles = postcss.parse(source.match(/<style>([\s\S]*?)<\/style>/)[1])
const originalStyles = postcss.parse(original.match(/<style>([\s\S]*?)<\/style>/)[1])
const classExpression = source.match(/wx:class="\{\{([\s\S]*?)\}\}"/)[1]

function declarations (selector, root = styles) {
  const values = {}
  root.walkRules(rule => {
    if (rule.selector === selector) rule.walkDecls(decl => { values[decl.prop] = decl.value })
  })
  return values
}

function load (width) {
  let options
  const listeners = new Set()
  const api = {
    createComponent: value => { options = value },
    getWindowInfo: () => ({ windowWidth: width, screenWidth: 999 }),
    onWindowResize: jest.fn(callback => listeners.add(callback)),
    offWindowResize: jest.fn(callback => listeners.delete(callback))
  }
  vm.runInNewContext(script, api)
  function mount (renderer) {
    const instance = Object.assign({ renderer }, options.data)
    options.attached.call(instance)
    return instance
  }
  return { api, listeners, mount, options }
}

function classes (instance) {
  return vm.runInNewContext(`(${classExpression})`, instance)
}

test.each(['webview', 'skyline'])('%s initializes at the inclusive window breakpoint, updates and cleans its own listener', renderer => {
  const { api, listeners, mount, options } = load(320)
  const instance = mount(renderer)
  expect(instance.isSmall).toBe(true)
  const callback = api.onWindowResize.mock.calls[0][0]
  ;[321, 319, 320, 375].forEach(width => {
    callback({ size: { windowWidth: width, windowHeight: 700 } })
    expect(instance.isSmall).toBe(width <= 320)
    expect(classes(instance)['card-small']).toBe(renderer === 'skyline' && width <= 320)
    expect(classes(instance)['card-webview']).toBe(renderer === 'webview')
  })
  options.detached.call(instance)
  expect(api.offWindowResize).toHaveBeenCalledWith(callback)
  expect(listeners.size).toBe(0)
})

test('separate component subscriptions survive another component unmount', () => {
  const { listeners, mount, options } = load(375)
  const first = mount('skyline')
  const second = mount('skyline')
  expect(first.isSmall).toBe(false)
  expect(listeners.size).toBe(2)
  options.detached.call(first)
  listeners.forEach(callback => callback({ size: { windowWidth: 320 } }))
  expect(first.isSmall).toBe(false)
  expect(second.isSmall).toBe(true)
  options.detached.call(second)
  expect(listeners.size).toBe(0)
})

test('media rules cannot leak to Skyline; both modes have the same padding values', () => {
  expect(declarations('.card').padding).toBe('24rpx')
  expect(declarations('.card-small').padding).toBe('12rpx')
  styles.walkAtRules('media', rule => {
    expect(rule.params).toBe('screen and (max-width: 320px)')
    rule.walkRules(child => {
      child.selectors.forEach(selector => expect(selector).toBe('.card-webview'))
      expect(child.nodes.find(decl => decl.prop === 'padding').value).toBe('12rpx')
    })
  })
})

test('outer provides 20px before the child border and preserves its 100px content / 120px outer width', () => {
  const outer = declarations('.outer')
  const child = declarations('.child')
  expect(parseFloat(outer['padding-top'])).toBe(20)
  expect(child['margin-top']).toBeUndefined()
  expect(parseFloat(outer['padding-top']) + parseFloat(child.padding)).toBe(30)
  expect(parseFloat(child.width)).toBe(100)
  expect(parseFloat(child.width) + 2 * parseFloat(child.padding)).toBe(120)
  expect(parseFloat(declarations('.first')['margin-bottom']) + parseFloat(declarations('.second')['margin-top'])).toBe(16)
})

test('negative margin chain preserves original WebView content origin, overlap and following position', () => {
  const before = declarations('.tips-bar', originalStyles)
  const after = declarations('.tips-bar')
  const originalHeight = parseFloat(before.height) + parseFloat(before['padding-bottom'])
  const originalStart = originalHeight + Math.min(parseFloat(before['margin-bottom']), parseFloat(declarations('.content-card', originalStyles)['margin-top']))
  const newHeight = parseFloat(after.height) + parseFloat(after['padding-bottom'])
  const wrapperOccupancy = newHeight + parseFloat(after['margin-bottom'])
  const newStart = wrapperOccupancy + parseFloat(declarations('.content-card')['margin-top'])
  expect(originalStart).toBe(92)
  expect(newStart).toBe(originalStart)
  expect(newHeight - newStart).toBe(92)
  expect(newStart + parseFloat(declarations('.content-card').height)).toBe(212)
  expect(declarations('.overlap-host, .tips-wrapper')).toMatchObject({ display: 'flex', 'flex-direction': 'column' })
  expect(declarations('.simple-next')['margin-top']).toBe('-8rpx')
  expect(declarations('.simple-overlap').display).toBeUndefined()
})

test('horizontal content fills the 320px viewport with two equal items and a full background', () => {
  expect(source).toMatch(/<scroll-view[^>]*scroll-x="\{\{true\}\}"[^>]*enable-flex="\{\{true\}\}"[^>]*type="custom"/)
  expect(source).toMatch(/<scroll-view[^>]*>\s*<view class="fit-content">/)
  expect(declarations('.fit-scroll')).toMatchObject({ width: '320px', 'flex-direction': 'row' })
  expect(declarations('.fit-content')).toMatchObject({ width: '100%', display: 'flex', 'flex-direction': 'row', background: '#eef2f8' })
  expect(declarations('.fit-item')).toMatchObject({ flex: '1', 'min-width': '0' })
  expect(declarations('.labels').display).toBe('flex')
  expect(declarations('.label').flex).toBe('1')
})

test('text, sale color, single effects and brand font contracts remain', () => {
  expect(source).toMatch(/<text class="title" max-lines="\{\{1\}\}" overflow="ellipsis">\{\{title\}\}<\/text>/)
  expect(declarations('.title')).toMatchObject({ 'white-space': 'nowrap', overflow: 'hidden', 'text-overflow': 'ellipsis' })
  expect(declarations('.sale').color).toBe('#d00')
  expect(declarations('.single-shadow')['box-shadow']).toBe(declarations('.single-shadow', originalStyles)['box-shadow'])
  expect(declarations('.single-filter').filter).toBe('blur(2px)')
  expect(source).toContain('<view class="many-shadow"><view class="many">双阴影</view></view>')
  expect(declarations('.many-shadow')['box-shadow']).toBe('0 4px 8px #333')
  expect(declarations('.many')['box-shadow']).toBe('0 2px 4px #000')
  expect(source).toContain('<view class="filters"><view class="filter-blur">复合滤镜</view></view>')
  expect(declarations('.filters').filter).toBe('brightness(.8)')
  expect(declarations('.filter-blur').filter).toBe('blur(2px)')
  expect(declarations('.font-a')).toEqual(declarations('.font-a', originalStyles))
  expect(declarations('.font-b')).toEqual(declarations('.font-b', originalStyles))
  const config = JSON.parse(source.match(/<script type="application\/json">([\s\S]*?)<\/script>/)[1])
  expect(config).toEqual({ component: true })
  expect(load(375).options.properties.title.value).toBe('本周精选商品')
})
