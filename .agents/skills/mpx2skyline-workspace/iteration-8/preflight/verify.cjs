const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')
const vm = require('vm')
const assert = require('assert')
const compile = require('../skill-snapshots/mpx/scripts/compile-validate.js')
async function main () {
  const input = path.join(__dirname, 'init-data.mpx')
  const result = await compile(input, { target: 'wx', type: 'component', cleanup: false })
  assert.strictEqual(result.success, true, JSON.stringify(result))
  const output = path.join(os.tmpdir(), 'mpx-compile-validate', crypto.createHash('md5').update(input + '|wx|' + process.pid).digest('hex'))
  let nativeOptions
  const context = vm.createContext({
    console,
module: { exports: {} },
Component: options => { nativeOptions = options },
    wx: { getSystemInfoSync: () => ({ platform: 'devtools', SDKVersion: '3.0.0' }) },
    setTimeout,
clearTimeout
  })
  vm.runInContext(fs.readFileSync(path.join(output, 'bundle.js'), 'utf8'), context)
  const runtime = context.module.exports
  context.require = () => runtime
  const entry = fs.readFileSync(path.join(output, '__validate_0.js'), 'utf8')
  vm.runInContext(entry, context)
  assert.ok(nativeOptions)
  assert.ok(Array.isArray(nativeOptions.data.safeOptions))
  assert.strictEqual(nativeOptions.data.safeOptions.length, 0)
  assert.strictEqual(Object.prototype.hasOwnProperty.call(nativeOptions, 'initData'), false)
  const evidence = { compile: result, nativeData: JSON.parse(JSON.stringify(nativeOptions.data)), rawInitDataForwarded: false, rendererValidation: 'not_run', scope: 'real wx compilation and native registration capture; no setup/attached invocation' }
  fs.writeFileSync(path.join(__dirname, 'result.json'), JSON.stringify(evidence, null, 2) + '\n')
  fs.rmSync(output, { recursive: true, force: true })
  console.log(JSON.stringify(evidence))
}
main().catch(error => { console.error(error); process.exitCode = 1 })
