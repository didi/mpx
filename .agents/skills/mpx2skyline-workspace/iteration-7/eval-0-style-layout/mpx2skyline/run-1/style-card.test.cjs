const fs = require('fs')
const path = require('path')
const vm = require('vm')
const postcss = require('postcss')

const source = fs.readFileSync(path.join(__dirname, '../outputs/style-card.mpx'), 'utf8')
const template = source.match(/<template>([\s\S]*?)<\/template>/)[1]
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
const css = postcss.parse(source.match(/<style>([\s\S]*?)<\/style>/)[1])
const classExpression = template.match(/wx:class="{{([\s\S]*?)}}"/)[1]

function declaration (selector, property) {
  let value
  css.walkRules(rule => {
    if (rule.selectors.includes(selector)) {
      rule.walkDecls(property, decl => { value = decl.value })
    }
  })
  return value
}

function mount (renderer, windowWidth) {
  let options
  const listeners = new Set()
  const wx = {
    getWindowInfo: jest.fn(() => ({ windowWidth })),
    onWindowResize: jest.fn(handler => listeners.add(handler)),
    offWindowResize: jest.fn(handler => listeners.delete(handler))
  }
  vm.runInNewContext(script.replace(/import[^\n]+\n/, ''), {
    wx,
    createComponent: value => { options = value }
  })
  const instance = Object.assign({ renderer }, options.data, options.methods)
  options.attached.call(instance)
  return {
    options, instance, wx, listeners,
    resize: width => listeners.forEach(handler => handler({ size: { windowWidth: width } })),
    detach: () => options.detached.call(instance)
  }
}

function classes (instance) {
  return vm.runInNewContext('(' + classExpression + ')', instance)
}

test.each([319, 320, 321, 375, 640])('Skyline initial window width %i uses the 320px inclusive boundary', width => {
  const mounted = mount('skyline', width)
  expect(mounted.instance.isSmall).toBe(width <= 320)
  expect(classes(mounted.instance)['card-small']).toBe(width <= 320)
  expect(classes(mounted.instance)['card-webview']).toBe(false)
  expect(mounted.listeners.size).toBe(1)
  mounted.detach()
  expect(mounted.listeners.size).toBe(0)
})

test('resize crosses both sides of the breakpoint; detach removes the same callback only', () => {
  const mounted = mount('skyline', 375)
  const unrelated = jest.fn()
  mounted.listeners.add(unrelated)
  ;[320, 321, 319, 640].forEach(width => {
    mounted.resize(width)
    expect(classes(mounted.instance)['card-small']).toBe(width <= 320)
  })
  const callback = mounted.wx.onWindowResize.mock.calls[0][0]
  mounted.detach()
  expect(mounted.wx.offWindowResize).toHaveBeenCalledWith(callback)
  expect(mounted.listeners.size).toBe(1)
  mounted.resize(300)
  expect(mounted.instance.isSmall).toBe(false)
  mounted.detach()
  expect(mounted.wx.offWindowResize).toHaveBeenCalledTimes(1)
})

test('two component instances own independent listeners and unmount independently', () => {
  const first = mount('skyline', 320)
  const second = mount('skyline', 375)
  first.detach()
  second.resize(300)
  expect(first.listeners.size).toBe(0)
  expect(second.instance.isSmall).toBe(true)
  second.detach()
})

test('WebView uses isolated native media queries without a runtime subscription', () => {
  const mounted = mount('webview', 320)
  expect(classes(mounted.instance)['card-webview']).toBe(true)
  expect(classes(mounted.instance)['card-small']).toBe(false)
  expect(mounted.wx.getWindowInfo).not.toHaveBeenCalled()
  expect(mounted.wx.onWindowResize).not.toHaveBeenCalled()
  mounted.detach()
  expect(mounted.wx.offWindowResize).not.toHaveBeenCalled()
  const media = []
  css.walkAtRules('media', rule => media.push(rule))
  expect(media).toHaveLength(1)
  expect(media[0].params).toBe('screen and (max-width: 320px)')
  media[0].walkRules(rule => expect(rule.selectors).toEqual(['.card-webview']))
  expect(declaration('.card', 'padding')).toBe('24rpx')
  expect(declaration('.card-webview', 'padding')).toBe('12rpx')
  expect(declaration('.card-small', 'padding')).toBe('12rpx')
})

test('title contract and dual renderer ellipsis are preserved', () => {
  const mounted = mount('webview', 375)
  expect(mounted.options.properties.title.type.name).toBe('String')
  expect(mounted.options.properties.title.value).toBe('本周精选商品')
  expect(template).toContain('<text class="title" max-lines="{{1}}" overflow="ellipsis">{{title}}</text>')
  expect(declaration('.title', 'text-overflow')).toBe('ellipsis')
  expect(declaration('.title', 'white-space')).toBe('nowrap')
  expect(declaration('.title', 'overflow')).toBe('hidden')
  expect(JSON.parse(source.match(/<script type="application\/json">([\s\S]*?)<\/script>/)[1])).toEqual({ component: true })
})

test('explicit geometry model: outer/child offsets, content width, and sibling gap', () => {
  const top = parseFloat(declaration('.outer', 'padding-top'))
  const padding = parseFloat(declaration('.child', 'padding'))
  expect(top).toBe(20)
  expect(top + padding).toBe(30)
  expect(declaration('.child', 'box-sizing')).toBe('content-box')
  expect(parseFloat(declaration('.child', 'width'))).toBe(100)
  expect(parseFloat(declaration('.child', 'width')) + 2 * padding).toBe(120)
  expect(declaration('.child', 'margin-top')).toBeUndefined()
  expect(parseFloat(declaration('.first', 'margin-bottom')) + parseFloat(declaration('.second', 'margin-top'))).toBe(16)
})

test('negative margin chain model preserves original collapsed WebView positions', () => {
  expect(declaration('.overlap-host', 'display')).toBe('flex')
  expect(declaration('.overlap-host', 'flex-direction')).toBe('column')
  expect(declaration('.tips-wrapper', 'display')).toBe('flex')
  const barHeight = parseFloat(declaration('.tips-bar', 'height'))
  const bottomPadding = parseFloat(declaration('.tips-bar', 'padding-bottom'))
  const negativeBottom = parseFloat(declaration('.tips-bar', 'margin-bottom'))
  const contentTop = parseFloat(declaration('.content-card', 'margin-top'))
  const originalWebViewTop = barHeight + bottomPadding + Math.min(negativeBottom, contentTop)
  const newFlexTop = barHeight + bottomPadding + negativeBottom + parseFloat(declaration('.tips-wrapper', 'margin-bottom')) + contentTop
  expect(originalWebViewTop).toBe(92)
  expect(newFlexTop).toBe(originalWebViewTop)
  expect(declaration('.simple-overlap', 'display')).toBeUndefined()
  expect(declaration('.simple-next', 'margin-top')).toBe('-8rpx')
})

test('two labels are equal width and horizontal scroll content explicitly fills its viewport', () => {
  expect(declaration('.labels', 'display')).toBe('flex')
  expect(declaration('.label', 'width')).toBe('50%')
  expect(declaration('.badge-sale', 'color')).toBe('#d00')
  expect(template).toContain('class="badge badge-sale"')
  expect(template).toMatch(/<scroll-view[^>]*scroll-x="{{true}}"[^>]*enable-flex="{{true}}"[^>]*type="custom">\s*<view class="fit-content">/)
  expect(declaration('.fit-scroll', 'width')).toBe('320px')
  expect(declaration('.fit-scroll', 'flex-direction')).toBe('row')
  expect(declaration('.fit-content', 'width')).toBe('100%')
  expect(declaration('.fit-item', 'flex')).toBe('1 0 0')
  expect(declaration('.fit-item', 'min-width')).toBe('0')
})

test('shadow count ignores rgba commas, layered shadows retain front-to-back order, filters retain composition order', () => {
  css.walkDecls('box-shadow', decl => expect(postcss.list.comma(decl.value)).toHaveLength(1))
  expect(declaration('.single-shadow', 'box-shadow')).toBe('0 2px 4px rgba(0,0,0,.2)')
  expect(template).toContain('<view class="many"><view class="many-front">双阴影</view></view>')
  expect(declaration('.many', 'box-shadow')).toBe('0 4px 8px #333')
  expect(declaration('.many-front', 'box-shadow')).toBe('0 2px 4px #000')
  expect(declaration('.single-filter', 'filter')).toBe('blur(2px)')
  expect(template).toContain('<view class="filters"><view class="filters-blur">复合滤镜</view></view>')
  expect(declaration('.filters-blur', 'filter')).toBe('blur(2px)')
  expect(declaration('.filters', 'filter')).toBe('brightness(.8)')
  css.walkDecls('filter', decl => expect(decl.value.match(/[a-z-]+\(/g)).toHaveLength(1))
})

test('font mapping and agreed weights remain intact without fabricated binary assets', () => {
  expect(source).toContain("@font-face { font-family: 'City-Semibold'; src: url('./city.woff2'); }")
  expect(declaration('.font-a', 'font-family')).toBe("'City-Semibold'")
  expect(declaration('.font-a', 'font-weight')).toBe('600')
  expect(declaration('.font-b', 'font-family')).toBe("'Trip-Medium'")
  expect(declaration('.font-b', 'font-weight')).toBe('500')
})
