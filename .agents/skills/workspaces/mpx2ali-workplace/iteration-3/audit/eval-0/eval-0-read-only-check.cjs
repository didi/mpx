const fs = require('fs')
const path = require('path')
const assert = require('assert')
const vm = require('vm')
const { createRequire } = require('module')
const repo = require('path').resolve(__dirname, '../../..')
const { JSDOM } = require('jsdom')
const postcss = createRequire(require.resolve('@mpxjs/webpack-plugin/package.json'))('postcss')
const base = path.join(repo, 'iteration-3/eval-0-text-image-adaptation')
const input = fs.readFileSync(path.join(base, 'input/product-card.mpx'), 'utf8')
const script = source => source.match(/<script>([\s\S]*?)<\/script>/)[1]
const groups = { mpx: '/private/tmp/mpx-product-card-validation', mpx2ali: path.join(base, 'mpx2ali/.validation') }
Object.entries(groups).forEach(([group, evidenceRoot]) => {
  const component = path.join(base, group, 'outputs/product-card.mpx')
  const output = fs.readFileSync(component, 'utf8')
  assert(output.includes('<style scoped>'))
  assert.strictEqual(script(output), script(input))
  let options
  vm.runInNewContext(script(output).replace("import { createComponent } from '@mpxjs/core'", ''), { createComponent: value => { options = value } })
  const calls = []
  const instance = { title: '证据验证标题', disabled: true, triggerEvent: (name, detail) => calls.push([name, detail.title]) }
  options.methods.select.call(instance)
  assert.strictEqual(calls.length, 0)
  instance.disabled = false
  options.methods.select.call(instance)
  assert.deepStrictEqual(calls, [['select', instance.title]])
  ;['wx', 'ali'].forEach(mode => {
    const stats = JSON.parse(fs.readFileSync(path.join(evidenceRoot, `stats-${mode}.json`), 'utf8'))
    assert.strictEqual(stats.errors.length, 0)
    assert.strictEqual(stats.warnings.length, 0)
    const module = stats.modules.find(item => item.nameForCondition === component)
    assert(module && module.identifier.includes('@mpxjs/webpack-plugin/lib/loader.js'))
    const dist = path.join(evidenceRoot, 'dist', mode)
    const cardName = fs.readdirSync(path.join(dist, 'components')).find(name => name.startsWith('product-card'))
    const siblingName = fs.readdirSync(path.join(dist, 'components')).find(name => name.startsWith('sibling'))
    const ext = mode === 'ali' ? 'axml' : 'wxml'
    const styleExt = mode === 'ali' ? 'acss' : 'wxss'
    const cardRoot = path.join(dist, 'components', cardName)
    const markup = fs.readFileSync(path.join(cardRoot, `index.${ext}`), 'utf8')
    const css = postcss.parse(fs.readFileSync(path.join(cardRoot, `index.${styleExt}`), 'utf8'))
    const document = new JSDOM(`<section id="card">${markup.replace(/<image([^>]*)\/>/g, '<img$1>')}</section><section id="host"><view class="title"></view><text class="price"></text></section><section id="sibling">${fs.readFileSync(path.join(dist, 'components', siblingName, `index.${ext}`), 'utf8')}</section>`).window.document
    const root = document.querySelector('#card').firstElementChild
    assert.strictEqual(root.id, 'summary-root')
    assert.strictEqual(document.querySelectorAll('#summary-root').length, 1)
    assert.strictEqual(root.getAttribute(mode === 'ali' ? 'ontap' : 'bindtap'), 'select')
    assert.strictEqual(root.children.length, 3)
    assert.strictEqual(root.children[0].tagName.toLowerCase(), 'view')
    assert.strictEqual(root.children[0].children[0].tagName.toLowerCase(), 'text')
    assert.strictEqual(root.children[0].textContent, '{{title}}')
    const declarations = selector => {
      const rule = css.nodes.find(node => node.selector === selector || (node.selector && node.selector.startsWith(selector + '.')))
      assert(rule, selector)
      return Object.fromEntries(rule.nodes.map(node => [node.prop, node.value]))
    }
    assert.deepStrictEqual(declarations('.product-card-title'), { width: '240rpx', overflow: 'hidden', 'white-space': 'nowrap', 'text-overflow': 'ellipsis' })
    const image = root.children[1].children[0]
    assert.strictEqual(image.tagName.toLowerCase(), 'img')
    assert.strictEqual(image.getAttribute('src'), '{{imageUrl}}')
    assert.strictEqual(image.getAttribute('mode'), 'aspectFit')
    const wrapperClass = Array.from(root.children[1].classList).find(name => name.startsWith('product-card-cover'))
    const wrapperStyle = declarations(`.${wrapperClass}`)
    assert.strictEqual(wrapperStyle.width, '240rpx')
    assert.strictEqual(wrapperStyle.padding, '24rpx')
    assert.deepStrictEqual(declarations('.product-card-cover'), { display: 'block', width: '240rpx', height: '80rpx' })
    assert.strictEqual(JSON.parse(fs.readFileSync(path.join(cardRoot, 'index.json'), 'utf8')).component, true)
    if (mode === 'ali') {
      const scope = Array.from(root.classList).find(name => /^_[a-f0-9]+$/.test(name))
      assert(scope)
      css.walkRules(rule => {
        assert(rule.selector.includes(`.${scope}`))
        assert.strictEqual(document.querySelectorAll(`#host ${rule.selector}, #sibling ${rule.selector}`).length, 0)
      })
      ;[path.join(dist, 'page.acss'), path.join(dist, 'components', siblingName, 'index.acss')].forEach(file => {
        postcss.parse(fs.readFileSync(file, 'utf8')).walkRules(rule => assert.strictEqual(document.querySelectorAll(`#card ${rule.selector}`).length, 0))
      })
      assert.strictEqual(fs.readFileSync(path.join(dist, 'app.acss'), 'utf8').trim(), '@import "./mpx-ali-compat.acss";')
      assert(/text\s*\{\s*white-space:\s*inherit;/.test(fs.readFileSync(path.join(dist, 'mpx-ali-compat.acss'), 'utf8')))
      console.log(`${group}/ali: scoped=${scope}; host/sibling selectors cannot match card; card scoped selectors cannot match host/sibling; complete App imports text white-space inheritance`)
    }
    console.log(`${group}/${mode}: source maps to compiled module; errors=0 warnings=0; title width/nowrap/overflow/ellipsis; image 240x80rpx wrapper padding 24rpx; original root id and event preserved`)
  })
  console.log(`${group}: script identical; disabled suppresses event; enabled emits select/title; PASS 4/4 assertions (structural/compiler evidence, not host visual validation)`)
})
