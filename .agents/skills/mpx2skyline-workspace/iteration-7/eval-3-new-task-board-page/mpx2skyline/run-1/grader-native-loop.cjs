const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const assert = require('node:assert/strict')
const base = path.join(__dirname, 'compiled')
const config = JSON.parse(fs.readFileSync(path.join(base, '__validate_0.json'), 'utf8'))
const relative = config.usingComponents['segmented-control'].replace(/^\//, '')
const componentFile = path.join(base, relative + '.js')
const template = fs.readFileSync(path.join(base, relative + '.wxml'), 'utf8')
const loopBinding = template.match(/wx:for="([^"]+)"/)[1]
let nativeOptions
const errors = []
const hostConsole = { log: () => {}, warn: value => errors.push(String(value)), error: value => errors.push(String(value)) }
const context = vm.createContext({
  console: hostConsole,
  module: { exports: {} },
  Component: options => { nativeOptions = options },
  wx: { getSystemInfoSync: () => ({ platform: 'devtools', SDKVersion: '3.0.0' }) },
  setTimeout, clearTimeout
})
vm.runInContext(fs.readFileSync(path.join(base, 'bundle.js'), 'utf8'), context, { filename: 'compiled/bundle.js' })
const runtime = context.module.exports
context.require = () => runtime
vm.runInContext(fs.readFileSync(componentFile, 'utf8'), context, { filename: relative + '.js' })
assert.ok(nativeOptions)
const copy = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value))
const defaults = {}
Object.keys(nativeOptions.properties).forEach(key => { defaults[key] = copy(nativeOptions.properties[key].value) })
const initialData = Object.assign({}, defaults, copy(nativeOptions.data))
const atRegistration = {
  nativeKeys: Object.keys(nativeOptions),
  hasNativeData: Object.prototype.hasOwnProperty.call(nativeOptions, 'data'),
  nativeData: copy(nativeOptions.data) || null,
  defaultOptions: copy(defaults.options),
  loopBinding,
  safeOptionsBeforeLifecycleType: typeof initialData.safeOptions,
  loopFallbackOrGuard: /wx:for="\{\{safeOptions\s*\|\|/.test(template) || /wx:if="[^\"]*safeOptions/.test(template)
}
const renders = []
const instance = Object.assign({
  renderer: 'skyline', data: initialData,
  setData: (data, callback) => { renders.push(copy(data)); Object.assign(initialData, data); if (callback) callback() },
  triggerEvent: () => {}, selectComponent: () => null, selectAllComponents: () => [],
  createSelectorQuery: () => ({}), createIntersectionObserver: () => ({}), getPageId: () => 1
}, nativeOptions.methods)
nativeOptions.attached.call(instance)
assert.ok(Array.isArray(instance.data.safeOptions))
const afterManualAttached = { safeOptions: copy(instance.data.safeOptions), renders: copy(renders) }
async function main () {
  const updates = []
  const values = [null, [], [{ label: '甲', value: 'a' }, { label: '乙', value: 'b' }], null]
  for (const value of values) {
    instance.data.options = value
    nativeOptions.properties.options.observer.call(instance, value)
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.ok(Array.isArray(instance.data.safeOptions))
    assert.equal(instance.data.safeOptions.length, Array.isArray(value) ? value.length : 0)
    updates.push({ input: copy(value), nativeLoopData: copy(instance.data.safeOptions) })
  }
  const result = {
    kind: 'actual-compiled-runtime-native-constructor-capture-in-VM',
    runtimeFiles: ['compiled/bundle.js', 'compiled/' + relative + '.js'],
    atRegistration, afterManualAttached, updates,
    runtimeConsoleMessages: errors,
    conclusion: 'Registration provides no safeOptions data or WXML fallback; attached initializes it and subsequent native-property observer updates supply arrays. Relative timing of host first WXML consumption versus attached/setData is not established.',
    hostLifecycleTiming: 'not_run', device: 'not_run'
  }
  fs.writeFileSync(path.join(__dirname, 'grader-native-loop.json'), JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify(result, null, 2))
}
main().catch(error => { console.error(error); process.exitCode = 1 })
