const fs = require('fs')
const vm = require('vm')
const compiler = require('/Users/hjw/project/mpx/packages/webpack-plugin/lib/template-compiler/compiler')
const source = fs.readFileSync('/private/tmp/skyline-v3-baseline-20260911/eval-4-nested-sticky-layer/mpx2skyline/outputs/category-panel.mpx', 'utf8')
const sfc = compiler.parseComponent(source, { mode: 'wx' })

test('SFC and wx template compile without diagnostics', () => {
  const errors = []
  const result = compiler.parse(sfc.template.content, { mode: 'wx', srcMode: 'wx', ctorType: 'component', warn: msg => errors.push(msg), error: msg => errors.push(msg) })
  expect(result).toBeTruthy()
  expect(errors).toEqual([])
  expect(JSON.parse(sfc.json.content).component).toBe(true)
})

test('renderer detection and modal open/close use actual component options', () => {
  let options
  vm.runInNewContext(sfc.script.content.replace(/import[^\n]+\n/, ''), { createComponent: value => { options = value } })
  ;['skyline', 'webview'].forEach(renderer => {
    const instance = Object.assign({}, options.data, { renderer })
    options.attached.call(instance)
    expect(instance.isSkyline).toBe(renderer === 'skyline')
    expect(instance.opened).toBe(false)
    options.methods.open.call(instance)
    expect(instance.opened).toBe(true)
    options.methods.close.call(instance)
    expect(instance.opened).toBe(false)
  })
})
