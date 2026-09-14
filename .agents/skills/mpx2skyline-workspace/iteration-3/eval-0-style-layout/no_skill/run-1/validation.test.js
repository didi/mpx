const fs = require('fs')
const vm = require('vm')
const parse = require('/Users/hjw/project/mpx/packages/webpack-plugin/lib/parser')
const filePath = '/private/tmp/skyline-v3-baseline-20260911/eval-0-style-layout/no_skill/outputs/style-card.mpx'
const source = fs.readFileSync(filePath, 'utf8')
const parsed = parse(source, { filePath, mode: 'wx', env: '' })

test('complete Mpx component parses', () => {
  expect(parsed.template.content).toContain('{{title}}')
  expect(parsed.styles.length).toBe(1)
  expect(JSON.parse(parsed.json.content).component).toBe(true)
})

test.each([[319, 12], [320, 12], [321, 24], [375, 24]])('padding at %s px is %s rpx', (windowWidth, padding) => {
  let options
  vm.runInNewContext(parsed.script.content.replace(/import[^\n]+\n/, ''), {
    createComponent: value => { options = value },
    wx: { getWindowInfo: () => ({ windowWidth }) }
  })
  const instance = Object.assign({}, options.data)
  options.attached.call(instance)
  expect(instance.cardPadding).toBe(padding)
})
