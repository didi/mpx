const fs = require('fs')
const vm = require('vm')
const postcss = require('/Users/hjw/project/mpx/node_modules/postcss')
const { Linter } = require('/Users/hjw/project/mpx/node_modules/eslint')
const source = fs.readFileSync(require('path').join(__dirname, '../outputs/product-card.mpx'), 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
const style = postcss.parse(source.match(/<style>([\s\S]*?)<\/style>/)[1])
let options
vm.runInNewContext(script.replace(/import[^\n]+/, ''), { createComponent: value => { options = value } })
test('script ESLint and CSS parsing', () => {
  const messages = new Linter().verify(script, { parserOptions: { ecmaVersion: 2020, sourceType: 'module' }, env: { es6: true }, globals: { wx: 'readonly' }, rules: { 'no-undef': 'error', 'no-unused-vars': 'error' } })
  expect(messages).toEqual([])
  expect(style.nodes.length).toBeGreaterThan(0)
})
test.each(['webview', 'skyline'].flatMap(renderer => [319, 320, 321, 375].map(width => [renderer, width])))('%s at %i px preserves padding', (renderer, width) => {
  const state = Object.assign({ renderer }, options.data)
  let reads = 0
  const context = { createComponent: value => { options = value }, wx: { getWindowInfo: () => { reads++; return { windowWidth: width } } } }
  vm.runInNewContext(script.replace(/import[^\n]+/, ''), context)
  options.attached.call(state)
  expect(reads).toBe(renderer === 'skyline' ? 1 : 0)
  const classes = ['card']
  if (state.isSkyline) classes.push('card-skyline')
  if (state.isSkyline && state.isSmall) classes.push('card-small')
  let padding
  style.walkRules(rule => {
    if (rule.parent.type === 'atrule' && renderer === 'webview' && width > 320) return
    if (!rule.selector.split('.').filter(Boolean).every(name => classes.includes(name))) return
    rule.walkDecls('padding', decl => { padding = decl.value })
  })
  expect(padding).toBe(width <= 320 ? '12rpx' : '24rpx')
})
test('title property and core template semantics', () => {
  expect(options.properties.title.value).toBe('本周精选商品')
  expect(source).toContain('max-lines="{{1}}" overflow="ellipsis">{{title}}</text>')
  expect(source).toContain('<text class="tag">包邮</text>')
  expect(source).toContain('<text class="tag">次日达</text>')
  expect(source).toContain('<text class="badge-dot">•</text><text>活动</text>')
  expect(source).toContain('flex: 1;')
  expect(source).not.toContain('display: grid')
})
