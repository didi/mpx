const fs = require('fs')
const path = require('path')
const vm = require('vm')
const postcss = require('postcss')
const { parseDocument } = require('htmlparser2')

const source = fs.readFileSync(path.join(__dirname, '../outputs/style-card.mpx'), 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
const css = postcss.parse(source.match(/<style>([\s\S]*?)<\/style>/)[1])
const template = parseDocument(source.match(/<template>([\s\S]*?)<\/template>/)[1], { xmlMode: true })
const nodes = []
function visit (node) {
  if (node.type === 'tag') nodes.push(node)
  ;(node.children || []).forEach(visit)
}
visit(template)
const nodeFor = (name) => nodes.find(node => (node.attribs.class || '').split(' ').includes(name))
function declarations (selector) {
  const result = {}
  css.walkRules(selector, rule => rule.walkDecls(decl => { result[decl.prop] = decl.value }))
  return result
}

function mount (renderer, windowWidth, listeners = new Set()) {
  let options
  const api = {
    getWindowInfo: jest.fn(() => ({ windowWidth, screenWidth: 999 })),
    onWindowResize: jest.fn(callback => listeners.add(callback)),
    offWindowResize: jest.fn(callback => listeners.delete(callback))
  }
  vm.runInNewContext(script.replace(/^import .+$/gm, ''), Object.assign({
    String,
    createComponent: value => { options = value }
  }, api))
  const instance = Object.assign({ renderer }, options.data)
  Object.entries(options.methods).forEach(([key, value]) => { instance[key] = value.bind(instance) })
  options.attached.call(instance)
  return { options, instance, api, listeners }
}

// Mock verifies application logic, not Mpx binding or a native renderer.
describe.each(['webview', 'skyline'])('%s resize lifecycle', renderer => {
  test.each([[319, true], [320, true], [321, false], [375, false]])('initial width %i', (width, expected) => {
    const { instance } = mount(renderer, width)
    expect(instance.isSmall).toBe(expected)
  })
  test('resize crosses inclusive boundary and detach removes exactly its callback', () => {
    const listeners = new Set()
    const first = mount(renderer, 375, listeners)
    const second = mount(renderer, 320, listeners)
    ;[320, 321, 319, 375].forEach(width => {
      listeners.forEach(callback => callback({ size: { windowWidth: width } }))
      expect(first.instance.isSmall).toBe(width <= 320)
      expect(second.instance.isSmall).toBe(width <= 320)
    })
    first.options.detached.call(first.instance)
    expect(first.api.offWindowResize).toHaveBeenCalledWith(first.api.onWindowResize.mock.calls[0][0])
    expect(listeners.size).toBe(1)
    listeners.forEach(callback => callback({ size: { windowWidth: 320 } }))
    expect(first.instance.isSmall).toBe(false)
    expect(second.instance.isSmall).toBe(true)
    second.options.detached.call(second.instance)
    expect(listeners.size).toBe(0)
  })
})

test('static: original component API and single-line ellipsis', () => {
  const { options } = mount('skyline', 320)
  expect(options.properties.title.type).toBe(String)
  expect(options.properties.title.value).toBe('本周精选商品')
  expect(nodeFor('title').attribs['max-lines']).toBe('{{1}}')
  expect(nodeFor('title').attribs.overflow).toBe('ellipsis')
  expect(declarations('.title')).toMatchObject({ 'white-space': 'nowrap', overflow: 'hidden', 'text-overflow': 'ellipsis' })
  expect(JSON.parse(source.match(/<script type="application\/json">([\s\S]*?)<\/script>/)[1])).toEqual({ component: true })
})

test('static: media rules cannot select Skyline card', () => {
  expect(nodeFor('card').attribs['wx:class']).toContain("'card-webview': renderer !== 'skyline'")
  expect(nodeFor('card').attribs['wx:class']).toContain("'card-small': renderer === 'skyline' && isSmall")
  css.walkAtRules('media', rule => {
    expect(rule.params).toBe('screen and (max-width: 320px)')
    rule.walkRules(inner => expect(inner.selector).toBe('.card-webview'))
  })
  expect(declarations('.card-small').padding).toBe('12rpx')
  expect(declarations('.card').padding).toBe('24rpx')
})

test('static: equal columns, sale class and exact content-box dimensions', () => {
  expect(declarations('.labels')).toMatchObject({ display: 'flex', 'flex-direction': 'row' })
  expect(declarations('.label').width).toBe('50%')
  expect(nodeFor('badge').attribs.class).toContain('sale')
  expect(declarations('.sale').color).toBe('#d00')
  expect(declarations('.outer')['padding-top']).toBe('20px')
  expect(declarations('.child')).toEqual({ width: '100px', padding: '10px', 'box-sizing': 'content-box' })
  expect(declarations('.first')['margin-bottom']).toBe('16px')
  expect(declarations('.second')['margin-top']).toBeUndefined()
})

test('static: preserve negative-margin chain and leave ordinary pullback alone', () => {
  expect(declarations('.overlap-host, .tips-wrapper')).toMatchObject({ display: 'flex', 'flex-direction': 'column' })
  expect(declarations('.tips-bar')).toMatchObject({ height: '92rpx', 'padding-bottom': '92rpx', 'margin-bottom': '-28rpx' })
  expect(declarations('.content-card')['margin-top']).toBe('-92rpx')
  expect(declarations('.simple-next')['margin-top']).toBe('-8rpx')
  expect(declarations('.simple-overlap').display).toBeUndefined()
})

test('static: horizontal direct content fills viewport without reverse sizing', () => {
  const scroll = nodeFor('fit-scroll')
  expect(scroll.name).toBe('scroll-view')
  expect(scroll.attribs).toMatchObject({ type: 'custom', 'enable-flex': '{{true}}', 'scroll-x': '{{true}}' })
  expect(nodeFor('fit-content').parent).toBe(scroll)
  expect(declarations('.fit-scroll')).toMatchObject({ width: '320px', height: '38px', 'flex-direction': 'row' })
  expect(declarations('.fit-content')).toMatchObject({ width: '100%', display: 'flex', 'flex-direction': 'row', background: '#eef2f8' })
  expect(declarations('.fit-item')).toMatchObject({ flex: '1 1 0', 'min-width': '0' })
})

test('static: preserve rgba shadow; split double shadow and ordered filters', () => {
  expect(declarations('.single-shadow')['box-shadow']).toBe('0 2px 4px rgba(0,0,0,.2)')
  expect(declarations('.single-filter').filter).toBe('blur(2px)')
  expect(nodeFor('many-front').parent).toBe(nodeFor('many'))
  expect(declarations('.many')['box-shadow']).toBe('0 4px 8px #333')
  expect(declarations('.many-front')['box-shadow']).toBe('0 2px 4px #000')
  expect(nodeFor('filters-blur').parent).toBe(nodeFor('filters'))
  expect(declarations('.filters').filter).toBe('brightness(.8)')
  expect(declarations('.filters-blur').filter).toBe('blur(2px)')
  expect(declarations('.font-a')).toMatchObject({ 'font-family': "'City-Semibold'", 'font-weight': '600' })
  expect(declarations('.font-b')).toMatchObject({ 'font-family': "'Trip-Medium'", 'font-weight': '500' })
})
