const fs = require('fs')
const path = require('path')
const vm = require('vm')
const assert = require('assert/strict')
const output = path.join(__dirname, 'grader-compiled')
const registrations = []
const context = vm.createContext({
  console, module: { exports: {} },
  Component: options => registrations.push(options),
  Page: options => registrations.push(options),
  wx: { getSystemInfoSync: () => ({ platform: 'devtools', SDKVersion: '3.0.0' }) },
  setTimeout, clearTimeout
})
vm.runInContext(fs.readFileSync(path.join(output, 'bundle.js'), 'utf8'), context)
const runtime = context.module.exports
context.require = () => runtime
const entries = ['__validate_0.js', 'components/rating-selector911d75c6/index.js', 'components/segmented-control45aa4970/index.js']
entries.forEach(entry => vm.runInContext(fs.readFileSync(path.join(output, entry), 'utf8'), context))
const segmented = registrations.find(options => options.properties && options.properties.controlKey)
assert(segmented)
assert(Array.isArray(segmented.data.safeOptions))
assert.equal(segmented.data.safeOptions.length, 0)
assert.equal(Object.prototype.hasOwnProperty.call(segmented, 'initData'), false)
console.log(JSON.stringify({ safeOptions: segmented.data.safeOptions, rawInitDataForwarded: false, scope: 'actual compiled native registration; setup/attached not invoked' }))
