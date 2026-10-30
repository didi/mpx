const fs = require('fs')
const path = require('path')
const assert = require('assert')
const vm = require('vm')
const { createRequire } = require('module')
const { JSDOM } = require('jsdom')
const postcss = createRequire(require.resolve('@mpxjs/webpack-plugin'))('postcss')
const base = __dirname
const output = fs.readFileSync(path.resolve(base, '../outputs/product-card.mpx'), 'utf8')
const input = fs.readFileSync(path.resolve(base, '../../input/product-card.mpx'), 'utf8')
const script = source => source.match(/<script>([\s\S]*?)<\/script>/)[1]
assert.strictEqual(script(output), script(input))
let options
vm.runInNewContext(script(output).replace(/import .* from '@mpxjs\/core'/, ''), {
  createComponent (value) { options = value }, String, Number, Boolean
})
assert.deepStrictEqual(Object.keys(options.properties), ['title', 'imageUrl', 'price', 'disabled'])
assert.strictEqual(options.properties.title.type, String)
assert.strictEqual(options.properties.title.value, '一段需要单行省略的商品标题')
assert.strictEqual(options.properties.imageUrl.type, String)
assert.strictEqual(options.properties.imageUrl.value, '')
assert.strictEqual(options.properties.price.type, Number)
assert.strictEqual(options.properties.price.value, 99)
assert.strictEqual(options.properties.disabled.type, Boolean)
assert.strictEqual(options.properties.disabled.value, false)
const events = []
const instance = { title: '长标题商品', disabled: true, triggerEvent (name, detail) { events.push([name, detail.title]) } }
options.methods.select.call(instance)
assert.strictEqual(events.length, 0)
instance.disabled = false
options.methods.select.call(instance)
assert.deepStrictEqual(events, [['select', '长标题商品']])
console.log('PASS: script identical to input; four property types/defaults; disabled blocks select; enabled emits select with title (VM stub, not host event integration)')
for (const mode of ['wx', 'ali']) {
  const dist = path.join(base, 'dist', mode)
  const components = fs.readdirSync(path.join(dist, 'components'))
  const cardDir = path.join(dist, 'components', components.find(name => name.startsWith('product-card')))
  const siblingDir = path.join(dist, 'components', components.find(name => name.startsWith('sibling')))
  const templateExt = mode === 'ali' ? 'axml' : 'wxml'
  const styleExt = mode === 'ali' ? 'acss' : 'wxss'
  const template = fs.readFileSync(path.join(cardDir, `index.${templateExt}`), 'utf8')
  const styles = fs.readFileSync(path.join(cardDir, `index.${styleExt}`), 'utf8')
  assert(template.startsWith('<view id="summary-root"'))
  assert.strictEqual((template.match(/id="summary-root"/g) || []).length, 1)
  assert(template.includes(`${mode === 'ali' ? 'onTap' : 'bindtap'}="select"`))
  assert(template.includes('<text'))
  assert(template.includes('{{title}}</text></view>'))
  assert(template.includes('src="{{imageUrl}}" mode="aspectFit"'))
  assert.strictEqual(JSON.parse(fs.readFileSync(path.join(cardDir, 'index.json'), 'utf8')).component, true)
  const css = postcss.parse(styles)
  const rule = selector => css.nodes.find(node => node.selector === selector || (node.selector && node.selector.startsWith(selector + '.')))
  const declarations = node => Object.fromEntries(node.nodes.map(decl => [decl.prop, decl.value]))
  assert.deepStrictEqual(declarations(rule('.product-card-title')), { width: '240rpx', overflow: 'hidden', 'white-space': 'nowrap', 'text-overflow': 'ellipsis' })
  assert.deepStrictEqual(declarations(rule('.product-card-cover-wrapper')), { width: '240rpx', padding: '24rpx' })
  assert.deepStrictEqual(declarations(rule('.product-card-cover')), { display: 'block', width: '240rpx', height: '80rpx' })
  assert(!/class="[^"]*\b(?:title|price)\b/.test(template.replace(/product-card-title|product-card-price/g, '')))
  if (mode === 'ali') {
    const scope = template.match(/product-card (_[a-f0-9]+)/)[1]
    css.walkRules(rule => assert(rule.selector.includes(`.${scope}`)))
    const dom = new JSDOM(`<section id="host"><view class="title"></view><text class="price"></text></section><section id="card">${template.replace(/<image([^>]*)\/>/g, '<img$1>')}</section><section id="sibling">${fs.readFileSync(path.join(siblingDir, 'index.axml'), 'utf8')}</section>`)
    const document = dom.window.document
    const foreignCss = [fs.readFileSync(path.join(dist, 'page.acss'), 'utf8'), fs.readFileSync(path.join(siblingDir, 'index.acss'), 'utf8')]
    foreignCss.forEach(content => postcss.parse(content).walkRules(rule => assert.strictEqual(document.querySelectorAll(`#card ${rule.selector}`).length, 0)))
    css.walkRules(rule => assert.strictEqual(document.querySelectorAll(`#host ${rule.selector}, #sibling ${rule.selector}`).length, 0))
    assert(fs.readFileSync(path.join(dist, 'app.acss'), 'utf8').startsWith('@import "./mpx-ali-compat.acss";'))
    assert(/text\s*\{\s*white-space:\s*inherit;/.test(fs.readFileSync(path.join(dist, 'mpx-ali-compat.acss'), 'utf8')))
    console.log(`PASS: ali scoped ${scope}; host/sibling .title/.price and component selectors do not match each other (DOM selector check only); App imports text inheritance compatibility`)
  } else {
    assert(!fs.existsSync(path.join(dist, 'mpx-ali-compat.acss')))
  }
  console.log(`PASS: ${mode} template/event/JSON; title ellipsis declarations; image dimensions and wrapper padding; original root id`)
}
