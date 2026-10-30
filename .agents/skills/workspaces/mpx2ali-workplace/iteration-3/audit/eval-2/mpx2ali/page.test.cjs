const fs = require('fs')
const path = require('path')
const vm = require('vm')
const babel = require('@babel/core')
const pagePath = path.resolve(__dirname, '../fixed-page.mpx')
const source = fs.readFileSync(pagePath, 'utf8')
function evaluate (source, requireModule) {
  const { code } = babel.transformSync(source, {
    configFile: false,
    babelrc: false,
    presets: [[require.resolve('@babel/preset-env'), { targets: { node: 'current' }, modules: 'commonjs' }]]
  })
  const exports = {}
  vm.runInNewContext(code, { exports, require: requireModule })
  return exports
}
function setup () {
  const windowInfo = evaluate(fs.readFileSync(path.resolve(__dirname, '../utils/window-info.js'), 'utf8'))
  const getWindowInfo = jest.fn(windowInfo.getWindowInfo)
  let options
  evaluate(source.match(/<script>\s*([\s\S]*?)<\/script>/)[1], name => {
    if (name === '@mpxjs/core') return { createPage: value => { options = value } }
    if (name === './utils/window-info') return { getWindowInfo }
    throw new Error(`Unexpected dependency ${name}`)
  })
  const page = Object.assign({}, options.data)
  Object.keys(options.methods).forEach(name => { page[name] = options.methods[name].bind(page) })
  return { page, options, windowInfo, getWindowInfo }
}
test.each([
  ['normal', { bottom: 776 }, 24],
  ['absent', undefined, 0],
  ['out of screen', { bottom: 810 }, 0]
])('onShow reads public dimensions: %s', (_, safeArea, expected) => {
  const { page, options, windowInfo, getWindowInfo } = setup()
  windowInfo.setWindowInfo({ windowHeight: 640, screenHeight: 800, statusBarHeight: 24, safeArea })
  options.onShow.call(page)
  expect(getWindowInfo).toHaveBeenCalledTimes(1)
  expect([page.pageHeight, page.statusBarHeight, page.safeBottom]).toEqual([640, 24, expected])
})
test('resize re-reads injected dimensions, subsequent show refreshes again', () => {
  const { page, options, windowInfo, getWindowInfo } = setup()
  options.onShow.call(page)
  windowInfo.setWindowInfo({ windowHeight: 480, screenHeight: 800, statusBarHeight: 24, safeArea: { bottom: 780 } })
  options.onResize.call(page, { size: { windowHeight: 999 } })
  expect([page.pageHeight, page.statusBarHeight, page.safeBottom]).toEqual([480, 24, 20])
  expect(getWindowInfo).toHaveBeenCalledTimes(2)
  windowInfo.setWindowInfo({ windowHeight: 640, screenHeight: 800, statusBarHeight: 24 })
  options.onShow.call(page)
  expect([page.pageHeight, page.safeBottom]).toEqual([640, 0])
  expect(getWindowInfo).toHaveBeenCalledTimes(3)
})
test('40 unique order rows and completion state', () => {
  const { page } = setup()
  expect(Array.from(page.orders)).toEqual(Array.from({ length: 40 }, (_, index) => index + 1))
  expect(page.completed).toBe(false)
  page.complete()
  expect(page.completed).toBe(true)
})
test.each(['wx', 'ali'])('%s compiled JSON, template and style contract', mode => {
  const dir = path.join(__dirname, 'dist', mode)
  const json = JSON.parse(fs.readFileSync(path.join(dir, 'fixed-page.json'), 'utf8'))
  const component = json.usingComponents['info-badge']
  expect(component).toBeTruthy()
  expect(fs.existsSync(path.join(dir, component + '.json'))).toBe(true)
  expect(json).toEqual(mode === 'wx'
    ? { navigationStyle: 'custom', enablePullDownRefresh: false, disableScroll: true, usingComponents: { 'info-badge': component } }
    : { defaultTitle: '', transparentTitle: 'always', titlePenetrate: 'YES', pullRefresh: false, allowsBounceVertical: 'NO', usingComponents: { 'info-badge': component } })
  const template = fs.readFileSync(path.join(dir, `fixed-page.${mode === 'wx' ? 'wxml' : 'axml'}`), 'utf8')
  expect(template).toContain('<info-badge')
  expect(template).toContain('<scroll-view')
  expect(template).toContain('scroll-y="{{true}}"')
  expect(template).toContain(mode === 'wx' ? 'wx:for="{{orders}}"' : 'a:for="{{orders}}"')
  expect(template).toContain('height: {{pageHeight}}px; padding-top: {{statusBarHeight}}px; padding-bottom: {{safeBottom}}px;')
  const css = fs.readFileSync(path.join(dir, `fixed-page.${mode === 'wx' ? 'wxss' : 'acss'}`), 'utf8')
  expect(css).toContain('box-sizing: border-box')
  expect(css).toContain('flex: 1')
  expect(css).toContain('min-height: 0')
  expect(css.includes('position: fixed')).toBe(mode === 'ali')
})
