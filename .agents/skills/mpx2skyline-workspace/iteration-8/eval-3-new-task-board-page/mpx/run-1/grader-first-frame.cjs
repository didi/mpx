const fs = require('fs')
const path = require('path')
const assert = require('assert')
const crypto = require('crypto')
const run = __dirname
const artifact = path.join(run, 'build-wx/components/segmented-control5f952533/index.js')
const wxml = fs.readFileSync(artifact.replace(/\.js$/, '.wxml'), 'utf8')
const sourceMap = JSON.parse(fs.readFileSync(artifact + '.map', 'utf8'))
let nativeOptions
let registrations = 0
global.wx = { getSystemInfoSync: () => ({ platform: 'devtools' }), canIUse: () => true }
global.Component = options => { nativeOptions = options; registrations++ }
global.Page = () => {}
global.App = () => {}
require(artifact)
assert.equal(registrations, 1)
assert(Array.isArray(nativeOptions.data.safeOptions))
assert.equal(nativeOptions.data.safeOptions.length, 0)
assert(wxml.includes('wx:for="{{safeOptions}}"'))
const runtimeSources = sourceMap.sources.filter(source => source.includes('/iteration-8/runtime-core/'))
assert(runtimeSources.some(source => source.endsWith('/src/index.js')))
const data = {
  status: 'pass',
  method: 'Execute unmodified real wx compiled component entry and intercept native Component registration before invoking any lifecycle or setup.',
  firstFrame: { data: nativeOptions.data, loopExpression: 'safeOptions', consumedValueIsArray: true, consumedLength: nativeOptions.data.safeOptions.length },
  properties: Object.keys(nativeOptions.properties),
  setupOrComputedManuallyInvoked: false,
  hostMocks: ['wx.getSystemInfoSync', 'wx.canIUse', 'Component registration callback', 'Page/App no-op'],
  runtimeAlias: { sourceMapMatch: true, sourceCount: runtimeSources.length, entry: runtimeSources.find(source => source.endsWith('/src/index.js')) },
  artifact: 'build-wx/components/segmented-control5f952533/index.js',
  artifactSha256: crypto.createHash('sha256').update(fs.readFileSync(artifact)).digest('hex'),
  boundary: 'Native registration-data boundary in Node; no real glass-easel mounting, layout or prop coercion.'
}
fs.writeFileSync(path.join(run, 'grader-first-frame.json'), JSON.stringify(data, null, 2) + '\n')
console.log(JSON.stringify(data))
