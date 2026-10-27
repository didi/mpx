const fs = require('fs')
const vm = require('vm')
const path = require('path')
const assert = require('assert/strict')
const workspace = '/Users/didi/work/mpx/.agents/skills/mpx2web-workspace'
const compiler = require(workspace + '/node_modules/@mpxjs/webpack-plugin/lib/template-compiler/compiler')
const root = workspace + '/iteration-13'
function options (file, context) {
  let captured
  const script = fs.readFileSync(file, 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^\s*import .*$/gm, '')
  vm.runInNewContext(script, Object.assign({ createPage: o => { captured = o }, createComponent: o => { captured = o } }, context))
  return captured
}
for (const group of ['mpx', 'mpx2web']) {
  const output = root + '/eval-0-style-config-adaptation/' + group + '/outputs'
  let navigation, backCount = 0, hook
  const api = { navigateTo (opts) { navigation = opts }, navigateBack (opts) { assert.equal(opts.delta, 1); backCount++ }, getMenuButtonBoundingClientRect () { return { top: 24, height: 32 } } }
  const context = { mpx: api, wx: api, __mpx_mode__: 'wx', onLoad: fn => { hook = fn }, getCurrentInstance: () => ({ proxy: {} }) }
  const homeOptions = options(output + '/src/pages/home/index.mpx', context)
  const home = Object.assign({}, homeOptions.data, homeOptions.methods)
  homeOptions.onLoad.call(home)
  assert.equal(home.topInset, 24); assert.equal(home.headerHeight, 32)
  const channel = { emit (event, value) { if (navigation.events[event]) navigation.events[event](value) } }
  context.getCurrentPages = () => [home, {}]
  const choiceOptions = options(output + '/src/pages/choice/index.mpx', context)
  const choice = Object.assign({ getOpenerEventChannel: () => channel }, choiceOptions.data, choiceOptions.methods)
  if (choiceOptions.setup) Object.assign(choice, choiceOptions.setup({}, { getOpenerEventChannel: () => channel }))
  home.openChoice()
  assert.equal(navigation.url, '/pages/choice/index')
  if (choiceOptions.onLoad) choiceOptions.onLoad.call(choice, {})
  else hook({})
  assert.equal(home.selectedLabel, '正在选择')
  choice.confirm('选项 A')
  assert.equal(home.selectedLabel, '选项 A')
  // Native navigator supplies no listeners; original page-stack confirmation must still work.
  navigation = { events: {} }
  if (choiceOptions.onLoad) choiceOptions.onLoad.call(choice, { source: 'link' })
  else hook({ source: 'link' })
  assert.equal(home.selectedLabel, '选项 A')
  choice.confirm('选项 B')
  assert.equal(home.selectedLabel, '选项 B')
  assert.equal(backCount, 2)
  const project = group === 'mpx' ? fs.readFileSync('/tmp/mpx-options-verify-current', 'utf8') : '/tmp/mpx-options-validation'
  const app = JSON.parse(fs.readFileSync(project + '/dist/wx/app.json'))
  assert.equal(app.subPackages[0].independent, true)
  assert.deepEqual(app.pages, ['pages/home/index', 'pages/choice/index'])
  assert.equal(app.subPackages[0].root, 'packageA')
  assert.deepEqual(app.subPackages[0].pages, ['index'])
  const wxstyle = fs.readFileSync(project + '/dist/wx/pages/home/index.wxss', 'utf8')
  assert(wxstyle.includes('width:200rpx')); assert(wxstyle.includes('font-size:28rpx'))
  const wxml = fs.readFileSync(project + '/dist/wx/pages/home/index.wxml', 'utf8')
  assert(wxml.includes('<navigator url="/pages/choice/index?source=link"'))
  const cfg = require(output + '/mpx.config.js').pluginOptions.mpx.plugin
  assert.deepEqual(cfg.externalClasses, ['custom-class', 'i-class', 'tone-class'])
  assert.equal(cfg.webConfig.transRpxFn('200rpx', '200'), '100px')
  assert.equal(cfg.webConfig.transRpxFn('28rpx', '28'), '14px')
  assert(cfg.autoVirtualHostRules.include.test(path.resolve(output, 'src/components/layout-cell.mpx')))
  const file = root + '/eval-1-new-profile-component/' + group + '/outputs/profile-card.mpx'
  const source = fs.readFileSync(file, 'utf8')
  const profile = options(file, {})
  assert.equal(profile.properties.title.value, '')
  assert.equal(profile.properties.summary.value, '')
  assert.deepEqual(Array.from(profile.externalClasses).sort(), ['accent-class', 'custom-class'])
  assert.equal(JSON.parse(source.match(/<script type="application\/json">([\s\S]*?)<\/script>/)[1]).component, true)
  const template = source.match(/<template>([\s\S]*?)<\/template>/)[1]
  for (const mode of ['wx', 'web']) {
    const result = compiler.parse(template, { mode, srcMode: 'wx', ctorType: 'component', moduleId: 'profileCard', defs: {}, usingComponentsInfo: {}, externalClasses: ['custom-class', 'i-class', 'accent-class'], filePath: file, warn (msg) { throw Error(msg) }, error (msg) { throw Error(msg) } })
    const compiled = compiler.serialize(result.root)
    assert(compiled.includes('expanded')); assert(compiled.includes('toggleExpanded'))
    if (mode === 'web') { assert(compiled.includes('$attrs["accent-class"]')); assert(compiled.includes('$attrs["custom-class"]')) }
  }
  process.stdout.write('PASS ' + group + ': wx capsule, ordinary ready and two confirmations, navigator, independent subpackage, rpx, defaults, component JSON, compiler external classes\n')
}
