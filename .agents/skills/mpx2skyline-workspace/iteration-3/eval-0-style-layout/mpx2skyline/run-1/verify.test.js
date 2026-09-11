const fs = require('fs')
const vm = require('vm')
const compiler = require('/Users/hjw/project/mpx/packages/webpack-plugin/lib/template-compiler/compiler')
const postcss = require('/Users/hjw/project/mpx/node_modules/postcss')
const path = require('path')
const file = path.resolve(__dirname, '../outputs/style-card.mpx')
const source = fs.readFileSync(file, 'utf8')
const sfc = compiler.parseComponent(source, { mode: 'wx', filePath: file })
const css = postcss.parse(sfc.styles[0].content)
function declaration (selector, prop) {
  let result
  css.walkRules(selector, rule => rule.walkDecls(prop, decl => { result = decl.value }))
  return result
}
test('Mpx SFC and wx template compile with no errors', () => {
  const errors = []
  compiler.parse(sfc.template.content, { mode: 'wx', srcMode: 'wx', filePath: file, error: message => errors.push(message) })
  expect(errors).toEqual([])
  expect(JSON.parse(sfc.json.content).component).toBe(true)
})
test.each([319, 320, 321, 375])('renderer gating and screen threshold at %s px', width => {
  let options
  const script = sfc.script.content.replace(/import[^\n]+\n/, '')
  for (const renderer of ['webview', 'skyline']) {
    const getWindowInfo = jest.fn(() => ({ screenWidth: width }))
    vm.runInNewContext(script, { createComponent: value => { options = value }, wx: { getWindowInfo } })
    const instance = Object.assign({ renderer }, options.data)
    options.attached.call(instance)
    expect(instance.isSkyline).toBe(renderer === 'skyline')
    expect(instance.isSmall).toBe(renderer === 'skyline' && width <= 320)
    expect(getWindowInfo).toHaveBeenCalledTimes(renderer === 'skyline' ? 1 : 0)
  }
})
test('explicit content offset, outer width and one-sided sibling spacing', () => {
  expect(parseFloat(declaration('.outer', 'padding-top')) + parseFloat(declaration('.child', 'padding'))).toBe(20)
  expect(parseFloat(declaration('.child', 'width')) + 2 * parseFloat(declaration('.child', 'padding'))).toBe(120)
  expect(declaration('.child', 'box-sizing')).toBe('content-box')
  expect(declaration('.first', 'margin-bottom')).toBe('16px')
  expect(declaration('.second', 'margin-top')).toBeUndefined()
})
test('single rgba shadow is preserved and each filter/shadow is one layer', () => {
  expect(declaration('.single-shadow', 'box-shadow')).toBe('0 2px 4px rgba(0,0,0,.2)')
  css.walkDecls('box-shadow', decl => {
    expect(postcss.list.comma(decl.value)).toHaveLength(1)
  })
  css.walkDecls('filter', decl => expect(decl.value.match(/[a-z]+\(/g)).toHaveLength(1))
  expect(declaration('.many', 'box-shadow')).toBe('0 2px 4px #000')
  expect(declaration('.many-back', 'box-shadow')).toBe('0 4px 8px #333')
})
