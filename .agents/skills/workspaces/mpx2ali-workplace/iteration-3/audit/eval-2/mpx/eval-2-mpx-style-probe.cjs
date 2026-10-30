const fs = require('fs')
const path = require('path')
const vm = require('vm')
const assert = require('assert')
const out = require('path').resolve(__dirname, '../../../eval-2-new-fixed-navigation-page/mpx/outputs')
const source = fs.readFileSync(path.join(out, 'fixed-page.mpx'), 'utf8')
const helper = fs.readFileSync(path.join(out, 'utils/window-info.js'), 'utf8').replace(/export /g, '')
const helperContext = vm.createContext({})
vm.runInContext(helper + '\nthis.api = { getWindowInfo, setWindowInfo }', helperContext)
let options
let reads = 0
vm.runInNewContext(source.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, ''), { createPage: value => { options = value }, getWindowInfo: () => { reads++; return helperContext.api.getWindowInfo() } })
const page = Object.assign({}, options.data, options.methods)
const generated = {}
;['wx', 'ali'].forEach(mode => {
  const dir = path.join(out, 'validation-artifacts', 'compiled-' + mode)
  const template = fs.readFileSync(path.join(dir, 'fixed-page.' + (mode === 'ali' ? 'axml' : 'wxml')), 'utf8')
  const helperFile = path.join(dir, mode === 'ali' ? 'sjs/stringify54a9db01.sjs' : 'wxs/stringify54a9db01.wxs')
  const context = { module: { exports: {} }, getRegExp: (pattern, flags) => new RegExp(pattern, flags) }
  vm.runInNewContext(fs.readFileSync(helperFile, 'utf8').replace(/^export default\s*/, 'module.exports = '), context)
  generated[mode] = { stringify: context.module.exports, expression: template.match(/style='\{\{([\s\S]*?)\}\}'/)[1] }
})
;[
  [{ windowHeight: 640, screenHeight: 800, statusBarHeight: 24, safeArea: { bottom: 776 } }, 640, 24, 'onShow'],
  [{ windowHeight: 640, screenHeight: 800, statusBarHeight: 24 }, 640, 0, 'onShow'],
  [{ windowHeight: 640, screenHeight: 800, statusBarHeight: 24, safeArea: { bottom: 810 } }, 640, 0, 'onShow'],
  [{ windowHeight: 480, screenHeight: 800, statusBarHeight: 24, safeArea: { bottom: 780 } }, 480, 20, 'onResize']
].forEach(([info, height, safeBottom, lifecycle]) => {
  helperContext.api.setWindowInfo(info)
  options[lifecycle].call(page, { size: { windowHeight: 999 } })
  assert.strictEqual(page.pageHeight, height)
  assert.strictEqual(page.safeBottom, safeBottom)
  Object.entries(generated).forEach(([mode, generated]) => {
    const context = Object.assign({}, page, { _s_: generated.stringify })
    const style = vm.runInNewContext(generated.expression, context)
    assert(style.includes('height:' + height + 'px'))
    assert(style.includes('padding-top:24px'))
    assert(style.includes('padding-bottom:' + safeBottom + 'px'))
    console.log(mode + '/' + lifecycle + ': ' + style)
  })
})
assert.strictEqual(reads, 4)
console.log('PASS: actual generated wx WXS/ali SJS style helpers render 640/640/640/480px roots with internal bottom padding 24/0/0/20px; 4 lifecycle calls freshly read public helper (VM, no host layout)')
