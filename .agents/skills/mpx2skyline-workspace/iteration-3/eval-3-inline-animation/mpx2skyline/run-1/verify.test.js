const fs = require('fs')
const vm = require('vm')
const path = require('path')
const repo = '/Users/hjw/project/mpx'
const compiler = require(repo + '/packages/webpack-plugin/lib/template-compiler/compiler')
const postcss = require(repo + '/node_modules/postcss')
const output = path.join(__dirname, '../outputs')
const source = fs.readFileSync(path.join(output, 'promo-card.mpx'), 'utf8')
const blocks = compiler.parseComponent(source, { mode: 'wx' })
let options
vm.runInNewContext(blocks.script.content.replace(/import[^\n]+/, ''), {
  createComponent (value) { options = value }
})
test('微信模板编译保留共同行内截断及所有触摸事件', () => {
  const warnings = []
  const errors = []
  const result = compiler.parse(blocks.template.content, {
    mode: 'wx', srcMode: 'wx', ctorType: 'component',
    warn: value => warnings.push(value), error: value => errors.push(value)
  })
  const wxml = compiler.serialize(result.root)
  fs.writeFileSync(path.join(__dirname, 'compiled.wxml'), wxml)
  fs.writeFileSync(path.join(__dirname, 'compiler-diagnostics.json'), JSON.stringify({ warnings, errors }, null, 2))
  expect(errors).toEqual([])
  expect(wxml).toMatch(/<span[^>]*max-lines="\{\{1\}\}"[^>]*overflow="ellipsis"[^>]*><image[^>]*\/><text>{{title}}<\/text><\/span>/)
  expect(wxml).toContain('bindtouchstart="press"')
  expect(wxml).toContain('bindtouchend="release"')
  expect(wxml).toContain('bindtouchcancel="release"')
  expect(wxml).not.toContain('mpxTagName')
})
test.each(['skyline', 'webview'])('%s 初始化与按下/松开/取消状态恢复', renderer => {
  const context = Object.assign({ renderer }, options.data)
  options.attached.call(context)
  expect(context.isSkyline).toBe(renderer === 'skyline')
  expect(context.pressed).toBe(false)
  options.methods.press.call(context)
  expect(context.pressed).toBe(true)
  options.methods.release.call(context)
  expect(context.pressed).toBe(false)
  options.methods.press.call(context)
  options.methods.release.call(context)
  expect(context.pressed).toBe(false)
})
test('CSS解析、周期与白名单过渡；SVG无损保留', () => {
  const css = postcss.parse(blocks.styles[0].content)
  const rules = {}
  css.walkRules(rule => { rules[rule.selector] = rule.toString() })
  expect(rules['.pulse-dot']).toContain('animation: promo-card-pulse 1s infinite')
  expect(rules['.pulse-dot']).toContain('animation-fill-mode: both')
  expect(rules['.button']).toContain('transition: transform 150ms linear, opacity 150ms linear')
  expect(rules['.button-pressed']).toContain('scale(0.96)')
  expect(rules['.button-pressed']).toContain('opacity: 0.7')
  expect(rules['.truncate']).toContain('text-overflow: ellipsis')
  expect(source).not.toMatch(/createAnimation|animationData|::before|backwards/)
  expect(JSON.parse(blocks.json.content)).toEqual({ component: true })
  expect(fs.readFileSync(path.join(output, 'logo.svg'), 'utf8')).toBe(fs.readFileSync(repo + '/.agents/skills/mpx2skyline-workspace/iteration-3/eval-3-inline-animation/input/logo.svg', 'utf8'))
})
fs.writeFileSync(path.join(__dirname, 'component-script.js'), blocks.script.content)
