const fs = require('fs')
const vm = require('vm')
const postcss = require('/Users/hjw/project/mpx/node_modules/postcss')
const source = fs.readFileSync('/private/tmp/skyline-v4-baseline/eval-0/no_skill/outputs/style-card.mpx', 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/m, '')
const css = source.match(/<style>([\s\S]*?)<\/style>/)[1]

test('uses inclusive screen width boundary through both host APIs', () => {
  ;[true, false].forEach((modern) => {
    ;[319, 320, 321, 375].forEach((screenWidth) => {
      let options
      const api = modern ? 'getWindowInfo' : 'getSystemInfoSync'
      vm.runInNewContext(script, { createComponent: (value) => { options = value }, wx: { [api]: () => ({ screenWidth }) } })
      expect(options.properties.title.value).toBe('本周精选商品')
      const setData = jest.fn()
      options.attached.call({ setData })
      expect(setData).toHaveBeenCalledWith({ compact: screenWidth <= 320 })
    })
  })
})

test('explicit geometry and single-effect layers parse', () => {
  const rules = {}
  postcss.parse(css).walkRules((rule) => {
    rules[rule.selector] = {}
    rule.walkDecls((decl) => { rules[rule.selector][decl.prop] = decl.value })
  })
  expect(rules['.outer']['padding-top']).toBe('20px')
  expect(rules['.child']).toEqual({ width: '100px', padding: '10px', 'box-sizing': 'content-box' })
  expect(rules['.first']['margin-bottom']).toBe('16px')
  expect(rules['.second']['margin-top']).toBe('0')
  expect(rules['.labels'].display).toBe('flex')
  expect(rules['.label'].flex).toBe('1')
  expect(rules['.badge-sale'].color).toBe('#d00')
  expect(rules['.single-shadow']['box-shadow']).toBe('0 2px 4px rgba(0,0,0,.2)')
  expect(rules['.single-filter'].filter).toBe('blur(2px)')
  expect(rules['.filters-brightness'].filter).toBe('brightness(.8)')
})
