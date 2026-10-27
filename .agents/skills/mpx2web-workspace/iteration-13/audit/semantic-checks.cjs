const fs = require('fs')
const vm = require('vm')
const assert = require('assert')
const path = require('path')
const root = '/Users/didi/work/mpx/.agents/skills/mpx2web-workspace/iteration-13'
const evidence = []
function read (name) { return fs.readFileSync(path.join(root, name), 'utf8') }
const card = read('eval-1-new-profile-component/mpx/outputs/profile-card.mpx')
let options
const cardScript = card.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/import .* from ['"]@mpxjs\/core['"]/g, '')
vm.runInNewContext(cardScript, { createComponent: value => { options = value } })
assert.strictEqual(typeof options.data, 'function')
const first = Object.assign(options.data(), options.methods)
const second = Object.assign(options.data(), options.methods)
first.toggleExpanded()
assert.strictEqual(first.expanded, true)
assert.strictEqual(second.expanded, false)
first.toggleExpanded()
assert.strictEqual(first.expanded, false)
evidence.push({ case: 1, group: 'mpx', assertions: ['n0', 'n3'], verdict: 'static_false_negative', evidence: 'Complete SFC uses options createComponent with a data() factory. VM invocation verifies two independent data objects and toggling only the selected instance.' })
const configSource = read('eval-0-style-config-adaptation/mpx/outputs/mpx.config.js')
const paths = {}
for (const mode of ['web', 'wx']) {
 const context = { module: { exports: {} }, process: { env: { MPX_CLI_MODE: mode } } }
 vm.runInNewContext(configSource, context)
 paths[mode] = context.module.exports.publicPath
}
assert.strictEqual(paths.web, '/help-demo/')
assert.strictEqual(paths.wx, '/')
evidence.push({ case: 0, group: 'mpx', assertions: ['s5'], verdict: 'static_false_negative', evidence: 'Executing mpx.config.js gives publicPath /help-demo/ for web and / for wx; checker only accepts a string immediately after publicPath:. App has history/base and both main/subpackage registrations.', publicPath: paths })
const page = read('eval-2-api-component-adaptation/mpx/outputs/business-page.mpx')
const json = page.match(/<script name="json">([\s\S]*?)<\/script>/)[1]
const registrations = {}
for (const mode of ['web', 'wx']) {
 const context = { module: { exports: {} }, __mpx_mode__: mode }
 vm.runInNewContext(json, context)
 registrations[mode] = Object.keys(context.module.exports.usingComponents)
}
assert.deepStrictEqual(registrations.web, [])
assert.deepStrictEqual(registrations.wx, ['native-scanner', 'foo-card'])
assert.strictEqual(read('eval-2-api-component-adaptation/mpx/outputs/native-scanner.mpx'), read('eval-2-api-component-adaptation/input/native-scanner.mpx'))
evidence.push({ case: 2, group: 'mpx', assertions: ['c2', 'c5'], verdict: 'registration_check_false_negative', evidence: 'Executing JSON block confirms native-scanner/foo-card are registered only for wx; readonly dependency is byte-identical. Checker only recognizes if blocks, not the ternary used here. Template wx:if folding is supported separately by successful child compile logs.', registrations })
console.log(JSON.stringify(evidence, null, 2))
