const fs = require('fs')
const path = require('path')
const vm = require('vm')
const { parseDocument } = require('htmlparser2')

const outputDir = path.resolve(__dirname, '../outputs')
const source = fs.readFileSync(path.join(outputDir, 'user-list.mpx'), 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
const markup = source.match(/<template>([\s\S]*?)<\/template>/)[1]
const style = source.match(/<style>([\s\S]*?)<\/style>/)[1]
const row = fs.readFileSync(path.join(outputDir, 'row.wxml'), 'utf8')
const doc = parseDocument(markup, { xmlMode: true })
const elements = []
function walk (node) {
  if (node.attribs) elements.push(node)
  ;(node.children || []).forEach(walk)
}
walk(doc)
const byId = id => elements.find(node => node.attribs.id === id)
const byClass = name => elements.find(node => (node.attribs.class || '').split(' ').includes(name))
const expression = (value, context) => vm.runInNewContext('(' + value.slice(2, -2) + ')', context)
const css = selector => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return style.match(new RegExp(escaped + '\\s*\\{([^}]+)\\}'))[1]
}

function mount (renderer) {
  let options
  const wx = { navigateTo: jest.fn() }
  vm.runInNewContext(script.replace(/^import .*$/m, ''), {
    createComponent: value => { options = value }, wx
  })
  const component = Object.assign({ renderer }, options.data)
  Object.keys(options.methods).forEach(name => { component[name] = options.methods[name].bind(component) })
  Object.keys(options.computed).forEach(name => {
    Object.defineProperty(component, name, { get: () => options.computed[name].call(component) })
  })
  const contexts = { users: { scrollTo: jest.fn() }, other: { scrollTo: jest.fn() } }
  const selectors = []
  component.createSelectorQuery = () => {
    let selected
    const query = {
      select (selector) { selectors.push(selector); selected = byId(selector.slice(1)); return query },
      node () { return query },
      exec (callback) {
        if (!selected) throw new Error('No matching scroll-view')
        const enhanced = expression(selected.attribs.enhanced, {})
        callback([{ node: enhanced ? contexts[selected.attribs.id] : {} }])
      }
    }
    return query
  }
  const fire = event => component[byClass('button').attribs['bind' + event]]()
  return { component, options, wx, contexts, selectors, fire }
}

describe.each(['webview', 'skyline'])('%s runtime mocks', renderer => {
  test('initialization, null, filtered rows and later array updates', () => {
    const { component, options } = mount(renderer)
    expect(options.initData.visibleItems).toEqual([])
    expect(component.visibleItems).toEqual([])
    component.setRows({ items: null })
    expect(component.items).toEqual([])
    expect(component.visibleItems).toEqual([])
    const items = [
      { id: 'a', visible: true, name: '甲' },
      { id: 'b', visible: false, name: '隐藏' },
      { id: 'c', visible: true, name: '丙' }
    ]
    component.setRows({ items })
    expect(component.visibleItems).toEqual([items[0], items[2]])
    const rowCall = elements.find(node => node.name === 'template' && node.attribs.is)
    expect(rowCall.attribs.is).toBe('user-row')
    expect(row).toMatch(/<template name="user-row">/)
    const rows = component.visibleItems.map((item, index) => {
      const data = vm.runInNewContext('({' + rowCall.attribs.data.slice(2, -2) + '})', { item, index })
      return row.match(/<text>(.*?)<\/text>/)[1].replace(/{{(.*?)}}/g, (_, value) => vm.runInNewContext(value, data))
    })
    expect(rows).toEqual(['0:甲', '1:丙'])
    component.setRows({ items: [{ id: 'd', name: '替换', visible: true }] })
    expect(component.visibleItems.map(item => item.name)).toEqual(['替换'])
    component.setRows({ items: null })
    expect(component.visibleItems).toEqual([])
  })

  test('the same button handles press, release, cancellation and actual selected target', () => {
    const { component, contexts, selectors, fire } = mount(renderer)
    const button = byClass('button')
    const isPressed = () => expression(button.attribs['wx:class'], component).pressed
    expect(isPressed()).toBe(false)
    fire('touchstart')
    expect(isPressed()).toBe(true)
    fire('touchend')
    expect(isPressed()).toBe(false)
    fire('tap')
    expect(selectors).toEqual(['#users'])
    expect(byId('users').name).toBe('scroll-view')
    expect(expression(byId('users').attribs['scroll-y'], {})).toBe(true)
    expect(contexts.users.scrollTo).toHaveBeenCalledWith({ top: 0 })
    expect(contexts.other.scrollTo).not.toHaveBeenCalled()
    fire('touchstart')
    fire('touchcancel')
    expect(isPressed()).toBe(false)
  })

  test('text and card detail entrances target the same route', () => {
    const { component, wx } = mount(renderer)
    const navigator = elements.find(node => node.name === 'navigator')
    expect(navigator.attribs.url).toBe('/pages/detail')
    expect(navigator.children.filter(node => node.attribs).map(node => node.name)).toEqual(['text'])
    const card = elements.find(node => node.attribs.bindtap === 'openDetail')
    expect(card.name).toBe('view')
    component[card.attribs.bindtap]()
    expect(wx.navigateTo).toHaveBeenCalledWith({ url: navigator.attribs.url })
  })

  test('short and long labels share one shrinkable inline container with renderer-specific classes', () => {
    const title = byClass('title')
    expect(title.attribs['mpxTagName@wx']).toBe('span')
    expect(expression(title.attribs['max-lines'], {})).toBe(1)
    expect(title.attribs.overflow).toBe('ellipsis')
    expect(css('.title')).toMatch(/width:\s*0/)
    expect(css('.title')).toMatch(/min-width:\s*0/)
    expect(css('.title')).toMatch(/flex:\s*1/)
    const image = title.children.find(node => node.name === 'image')
    const text = title.children.find(node => node.name === 'text')
    expect(image.attribs.mode).toBe('aspectFit')
    expect(text.children[0].data).toBe('{{label}}')
    ;['用户', '这是用于验证共同截断的很长用户列表标题'.repeat(20)].forEach(label => {
      expect(expression(text.children[0].data, { label })).toBe(label)
    })
    expect(expression(image.attribs['wx:class'], { renderer })['skyline-inline']).toBe(renderer === 'skyline')
    const classes = expression(title.attribs['wx:class'], { renderer })
    expect(classes.truncate).toBe(renderer === 'webview')
    expect(classes['skyline-nowrap']).toBe(renderer === 'skyline')
    expect(css('.skyline-inline')).toMatch(/display:\s*inline-block/)
    expect(css('.truncate')).toMatch(/text-overflow:\s*ellipsis/)
    expect(css('.truncate')).toMatch(/overflow:\s*hidden/)
    expect(css('.skyline-nowrap')).toMatch(/white-space:\s*nowrap/)
  })
})

test('interfaces, default data and direct list rows remain intact', () => {
  const { options, component } = mount('skyline')
  expect(options.properties.label.type.name).toBe('String')
  expect(options.properties.label.value).toBe('用户')
  expect(options.properties.payload.type.name).toBe('String')
  expect(options.properties.payload.optionalTypes.map(type => type.name)).toEqual(['Object'])
  expect(options.properties.payload.value).toBe('')
  expect(component.config.default).toBe('keep')
  const list = byId('users')
  expect(list.attribs.type).toBe('list')
  const directRows = list.children.filter(node => node.attribs)
  expect(directRows).toHaveLength(1)
  expect(directRows[0].attribs['wx:for']).toBe('{{visibleItems}}')
  expect(directRows[0].attribs['wx:key']).toBe('id')
  expect(elements.some(node => node.name === 'include')).toBe(false)
  expect(elements.find(node => node.name === 'import').attribs.src).toBe('./row.wxml')
  expect(JSON.parse(source.match(/<script type="application\/json">([\s\S]*?)<\/script>/)[1])).toEqual({ component: true })
})

test('pulse and button CSS preserve timing, dimensions and both states', () => {
  const pulse = byClass('pulse')
  expect(pulse.parent).toBe(byClass('heading'))
  expect(css('.pulse')).toMatch(/width:\s*8px/)
  expect(css('.pulse')).toMatch(/height:\s*8px/)
  expect(css('.pulse')).toMatch(/background:\s*#f50/)
  expect(css('.pulse')).toMatch(/animation:\s*user-list-pulse 1s infinite/)
  expect(css('.pulse')).toMatch(/animation-fill-mode:\s*both/)
  expect(style).toMatch(/@keyframes user-list-pulse\s*\{\s*from\s*\{\s*opacity:\s*\.3;\s*\}\s*to\s*\{\s*opacity:\s*1;/)
  expect(css('.button')).toMatch(/transform:\s*scale\(1\)/)
  expect(css('.button')).toMatch(/opacity:\s*1/)
  expect(css('.button')).toMatch(/transition:\s*transform 150ms ease, opacity 150ms ease/)
  expect(css('.button.pressed')).toMatch(/transform:\s*scale\(\.96\)/)
  expect(css('.button.pressed')).toMatch(/opacity:\s*\.7/)
  expect(source).not.toMatch(/createAnimation|animationData|::before|::after|animation="/)
})

test('SVG stays self-contained with explicit dimensions and inline fill', () => {
  const svg = fs.readFileSync(path.join(outputDir, 'logo.svg'), 'utf8')
  expect(svg).toMatch(/width="24" height="24"/)
  expect(svg).toMatch(/fill="#f50"/)
  expect(svg).not.toMatch(/<style|%|rgba\(/)
})
