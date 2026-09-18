const fs = require('fs')
const vm = require('vm')
const postcss = require('/Users/hjw/project/mpx/node_modules/postcss')
const source = fs.readFileSync('/private/tmp/skyline-v4-baseline/eval-0/mpx2skyline/outputs/style-card.mpx', 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
const css = postcss.parse(source.match(/<style>([\s\S]*?)<\/style>/)[1])
function declarations (selector) {
  const values = {}
  css.walkRules(selector, rule => rule.walkDecls(d => { values[d.prop] = d.value }))
  return values
}
test.each([['skyline', 320, true], ['skyline', 321, false], ['skyline', 300, true], ['webview', 320, false]])('renderer %s at width %i', (renderer, screenWidth, expected) => {
  let component
  let calls = 0
  vm.runInNewContext(script.replace(/import[^\n]+/, ''), {
    createComponent: value => { component = value },
    wx: { getWindowInfo: () => { calls++; return { screenWidth } } }
  })
  const instance = Object.assign({ renderer }, component.data)
  component.attached.call(instance)
  expect(instance.isSkyline).toBe(renderer === 'skyline')
  expect(instance.isSmall).toBe(expected)
  expect(calls).toBe(renderer === 'skyline' ? 1 : 0)
  expect(component.properties.title.value).toBe('本周精选商品')
})
test('explicit geometry and equal label allocation', () => {
  expect(declarations('.outer')['padding-top']).toBe('20px')
  const child = declarations('.child')
  expect(child).toEqual({ width: '100px', padding: '10px', 'box-sizing': 'content-box' })
  expect(parseFloat(child.width) + 2 * parseFloat(child.padding)).toBe(120)
  expect(20 + parseFloat(child.padding)).toBe(30)
  expect(parseFloat(declarations('.first')['margin-bottom']) + parseFloat(declarations('.second')['margin-top'])).toBe(16)
  expect(declarations('.label')).toEqual({ flex: '1', width: '0', 'min-width': '0' })
  expect(declarations('.badge-sale').color).toBe('#d00')
})
test('effect layers preserve values and application order', () => {
  expect(declarations('.single-shadow')['box-shadow']).toBe('0 2px 4px rgba(0,0,0,.2)')
  expect(declarations('.single-filter').filter).toBe('blur(2px)')
  expect(declarations('.many')['box-shadow']).toBe('0 4px 8px #333')
  expect(declarations('.many-front')['box-shadow']).toBe('0 2px 4px #000')
  expect(source).toContain('<view class="filters"><view class="filters-blur">')
  expect(declarations('.filters').filter).toBe('brightness(.8)')
  expect(declarations('.filters-blur').filter).toBe('blur(2px)')
})
test('dual renderer truncation and media override order', () => {
  expect(source).toContain('max-lines="{{1}}" overflow="ellipsis">{{title}}</text>')
  expect(declarations('.title')['text-overflow']).toBe('ellipsis')
  expect(source.indexOf('.card-skyline {')).toBeGreaterThan(source.indexOf('@media screen'))
  expect(declarations('.card-skyline').padding).toBe('24rpx')
  expect(declarations('.card-skyline.card-small').padding).toBe('12rpx')
  expect(declarations('.font-a')['font-weight']).toBe('600')
  expect(declarations('.font-b')['font-weight']).toBe('500')
})
