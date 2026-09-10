const fs = require('fs')
const vm = require('vm')
const compiler = require('/Users/hjw/project/mpx/packages/webpack-plugin/lib/template-compiler/compiler')
const postcss = require('/Users/hjw/project/mpx/node_modules/postcss')
const source = fs.readFileSync(require('path').join(__dirname, '../outputs/category-panel.mpx'), 'utf8')

test('component selects renderer and preserves modal state transitions', () => {
  let options
  const script = source.split('<script>')[1].split('</script>')[0].replace(/import .* from '@mpxjs\/core'/, '')
  vm.runInNewContext(script, { createComponent: value => { options = value } })
  expect(options.properties.sections.type.name).toBe('Array')
  expect(options.properties.sections.value).toEqual([])
  ;['webview', 'skyline'].forEach(renderer => {
    const instance = Object.assign({}, options.data, { renderer })
    options.attached.call(instance)
    expect(instance.isSkyline).toBe(renderer === 'skyline')
    options.methods.open.call(instance)
    expect(instance.opened).toBe(true)
    options.methods.close.call(instance)
    expect(instance.opened).toBe(false)
  })
})

test('Mpx wx template and style parse without errors', () => {
  const errors = []
  const warnings = []
  const template = source.split('<template>')[1].split('</template>')[0]
  const result = compiler.parse(template, {
    mode: 'wx', srcMode: 'wx', env: '', defs: {},
    usingComponentsInfo: {}, externalClasses: [],
    warn: value => warnings.push(value), error: value => errors.push(value)
  })
  expect(result.root).toBeTruthy()
  expect(errors).toEqual([])
  expect(warnings).toEqual([])
  const css = postcss.parse(source.split('<style>')[1].split('</style>')[0])
  const declarations = {}
  css.walkRules(rule => {
    declarations[rule.selector] = {}
    rule.walkDecls(decl => { declarations[rule.selector][decl.prop] = decl.value })
  })
  expect(declarations['.modal'].position).toBe('fixed')
  expect(Number(declarations['.modal']['z-index'])).toBeGreaterThan(Number(declarations['.fab']['z-index']))
  expect(JSON.parse(source.split('<script type="application/json">')[1].split('</script>')[0])).toEqual({ component: true })
})
