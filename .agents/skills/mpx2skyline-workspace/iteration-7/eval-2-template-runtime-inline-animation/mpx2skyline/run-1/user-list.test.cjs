const fs = require('fs')
const path = require('path')
const vm = require('vm')
const { parseDocument } = require('htmlparser2')
const postcss = require('postcss')

const outputs = path.resolve(__dirname, '../outputs')
const source = fs.readFileSync(path.join(outputs, 'user-list.mpx'), 'utf8')
const row = fs.readFileSync(path.join(outputs, 'row.wxml'), 'utf8')
const template = source.slice(source.indexOf('<template>') + 10, source.indexOf('</template>'))
const document = parseDocument(template, { xmlMode: true })
const allNodes = []
function visit (node) {
  if (node.type === 'tag') allNodes.push(node)
  ;(node.children || []).forEach(visit)
}
visit(document)
const style = postcss.parse(source.match(/<style>([\s\S]*?)<\/style>/)[1])
function declarations (selector) {
  const values = {}
  style.walkRules(selector, rule => rule.walkDecls(decl => { values[decl.prop] = decl.value }))
  return values
}
function load (renderer) {
  let options
  const wx = { navigateTo: jest.fn() }
  const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace(/import[^\n]+from '@mpxjs\/core'/, '')
  vm.runInNewContext(script, { createComponent: value => { options = value }, wx })
  const instance = Object.assign({ renderer }, options.data)
  Object.keys(options.methods).forEach(key => { instance[key] = options.methods[key].bind(instance) })
  Object.defineProperty(instance, 'visibleItems', {
    get: () => options.computed.visibleItems.call(instance)
  })
  return { options, instance, wx }
}

describe.each(['webview', 'skyline'])('%s runtime contract (mock, no renderer)', renderer => {
  test('initial render and pending request are empty, including initData before computed', () => {
    const { options, instance } = load(renderer)
    expect(Array.isArray(options.initData.visibleItems)).toBe(true)
    expect(options.initData.visibleItems).toHaveLength(0)
    expect(instance.items).toHaveLength(0)
    expect(instance.visibleItems).toHaveLength(0)
    expect(instance.config.default).toBe('keep')
  })

  test('null, array, replacement and empty updates preserve filtered order and row indices', () => {
    const { instance } = load(renderer)
    instance.setRows({ items: null })
    expect(instance.visibleItems).toHaveLength(0)
    const items = [
      { id: 1, name: '隐藏', visible: false },
      { id: 2, name: '甲', visible: true },
      { id: 3, name: '乙', visible: true }
    ]
    instance.setRows({ items })
    expect(instance.visibleItems.map((item, index) => `${index}:${item.name}`)).toEqual(['0:甲', '1:乙'])
    expect(items).toHaveLength(3)
    instance.setRows({ items: [{ id: 4, name: '丙', visible: true }] })
    expect(instance.visibleItems.map(item => item.id)).toEqual([4])
    instance.setRows({ items: [] })
    expect(instance.visibleItems).toHaveLength(0)
    instance.setRows({ items: null })
    expect(instance.visibleItems).toHaveLength(0)
  })

  test('component-scoped query selects actual enhanced user list rather than other', () => {
    const { instance } = load(renderer)
    const userContext = { scrollTo: jest.fn() }
    const otherContext = { scrollTo: jest.fn() }
    const contexts = { users: userContext, other: otherContext }
    const select = jest.fn(selector => {
      const target = allNodes.find(node => node.attribs.id === selector.slice(1))
      expect(target.name).toBe('scroll-view')
      expect(target.attribs.enhanced).toBe('{{true}}')
      expect(target.attribs['scroll-y']).toBe('{{true}}')
      return { node: () => ({ exec: callback => callback([{ node: contexts[target.attribs.id] }]) }) }
    })
    instance.createSelectorQuery = jest.fn(() => ({ select }))
    instance.scrollTop()
    expect(instance.createSelectorQuery).toHaveBeenCalledTimes(1)
    expect(select).toHaveBeenCalledWith('#users')
    expect(userContext.scrollTo).toHaveBeenCalledWith({ top: 0 })
    expect(otherContext.scrollTo).not.toHaveBeenCalled()
  })

  test('same button dispatches press, release, cancel and tap', () => {
    const { instance } = load(renderer)
    const button = allNodes.find(node => node.attribs.class === 'button')
    expect(button.attribs['wx:class']).toContain('pressed')
    expect(instance.pressed).toBe(false)
    instance[button.attribs.bindtouchstart]()
    expect(instance.pressed).toBe(true)
    instance[button.attribs.bindtouchend]()
    expect(instance.pressed).toBe(false)
    instance[button.attribs.bindtouchstart]()
    instance[button.attribs.bindtouchcancel]()
    expect(instance.pressed).toBe(false)
    expect(button.attribs.bindtap).toBe('scrollTop')
  })

  test('text navigator and card tap both target detail', () => {
    const { instance, wx } = load(renderer)
    const navigator = allNodes.find(node => node.name === 'navigator')
    expect(navigator.attribs.url).toBe('/pages/detail')
    expect(navigator.children.filter(node => node.type === 'tag').map(node => node.name)).toEqual(['text'])
    const card = allNodes.find(node => node.attribs.bindtap === 'openDetail')
    expect(card.name).toBe('view')
    instance[card.attribs.bindtap]()
    expect(wx.navigateTo).toHaveBeenCalledWith({ url: navigator.attribs.url })
  })
})

describe('static template and style checks (no visual assertions)', () => {
  test('named external row template receives filtered index and item explicitly', () => {
    expect(allNodes.find(node => node.name === 'import').attribs.src).toBe('./row.wxml')
    const list = allNodes.find(node => node.attribs.id === 'users')
    const loop = list.children.find(node => node.type === 'tag')
    expect(loop.attribs['wx:for']).toBe('{{visibleItems}}')
    expect(loop.attribs['wx:key']).toBe('id')
    const call = loop.children.find(node => node.type === 'tag')
    expect(call.attribs).toEqual({ is: 'user-row', data: '{{index, item}}' })
    expect(row).toContain('<template name="user-row">')
    expect(row).toContain('<text>{{index}}:{{item.name}}</text>')
    expect(source).not.toContain('<include')
  })

  test('long labels and image share one constrained inline truncation container', () => {
    const mixed = allNodes.find(node => node.attribs['mpxTagName@wx'] === 'span')
    expect(mixed.attribs['max-lines']).toBe('{{1}}')
    expect(mixed.attribs.overflow).toBe('ellipsis')
    expect(mixed.children.filter(node => node.type === 'tag').map(node => node.name)).toEqual(['image', 'text'])
    expect(mixed.children.find(node => node.name === 'text').children[0].data).toBe('{{label}}')
    expect(declarations('.truncate')).toMatchObject({ width: '0', flex: '1', 'min-width': '0', 'white-space': 'nowrap', overflow: 'hidden', 'text-overflow': 'ellipsis' })
    expect(allNodes.find(node => node.name === 'image').attribs.mode).toBe('aspectFit')
  })

  test('real pulse beside title retains original size, color, keyframe direction and one-second period', () => {
    const pulse = allNodes.find(node => node.attribs.class === 'pulse')
    expect(pulse.parent.attribs.class).toBe('heading')
    expect(declarations('.pulse')).toMatchObject({ width: '8px', height: '8px', background: '#f50', animation: 'pulse 1s infinite', 'animation-fill-mode': 'both' })
    const keyframes = style.nodes.find(node => node.type === 'atrule' && node.name === 'keyframes')
    expect(keyframes.params).toBe('pulse')
    expect(keyframes.nodes.map(rule => [rule.selector, rule.nodes[0].value])).toEqual([['from', '.3'], ['to', '1']])
    expect(source).not.toMatch(/::before|::after|createAnimation|animationData/)
  })

  test('press and recovery have explicit scale/opacity and 150ms transitions', () => {
    expect(declarations('.button')).toMatchObject({ transform: 'scale(1)', opacity: '1', transition: 'transform 150ms, opacity 150ms' })
    expect(declarations('.button.pressed')).toEqual({ transform: 'scale(0.96)', opacity: '.7' })
  })

  test('public properties, component declaration and compatible SVG remain intact', () => {
    const { options } = load('skyline')
    expect(options.properties.label.type.name).toBe('String')
    expect(options.properties.label.value).toBe('用户')
    expect(options.properties.payload.type.name).toBe('String')
    expect(options.properties.payload.optionalTypes[0].name).toBe('Object')
    expect(options.properties.payload.value).toBe('')
    expect(JSON.parse(source.match(/<script type="application\/json">([\s\S]*?)<\/script>/)[1])).toEqual({ component: true })
    const svg = fs.readFileSync(path.join(outputs, 'logo.svg'), 'utf8')
    expect(svg).not.toMatch(/<style|%|rgba\(/)
    expect(svg.trim()).toBe(fs.readFileSync(path.resolve(outputs, '../../input/logo.svg'), 'utf8').trim())
  })
})
