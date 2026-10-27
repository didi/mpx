const fs = require('fs')
const vm = require('vm')
const assert = require('assert')
const path = require('path')
const base = '/Users/didi/work/mpx/.agents/skills/mpx2web-workspace'
const deps = base + '/node_modules'
const compiler = require(deps + '/@mpxjs/webpack-plugin/lib/template-compiler/compiler')
const VueRouter = require(deps + '/vue-router')
const router = new VueRouter({ mode: 'abstract', routes: [{ path: '/pages/business/index' }] })
const url = 'https://media.example/video%2Fpart.mp4?signature=a%2Fb%25&next=%3Fv%3D1'
const query = router.resolve('/pages/business/index?videoUrl=' + encodeURIComponent(url)).route.query
assert.equal(query.videoUrl, url)
const results = []
function read (p) { return fs.readFileSync(p, 'utf8') }
const mixinCode = read(deps + '/@mpxjs/core/src/platform/builtInMixins/pageStatusMixin.web.js').replace(/import\s+[\s\S]*?from ['"][^'"]+['"]\s*/g, '').replace('export default function', 'function') + '\nthis.mixin = pageStatusMixin("page")'
const mixinContext = { isBrowser: false, CREATED: '__created__', BEFORECREATE: 'beforeCreate', ONHIDE: 'onHide', ONSHOW: 'onShow', ONLOAD: 'onLoad', ONRESIZE: 'onResize' }
vm.runInNewContext(mixinCode, mixinContext)
for (const group of ['mpx', 'mpx2web']) {
 const root = base + '/iteration-13/eval-2-api-component-adaptation/' + group + '/outputs'
 const source = read(root + '/business-page.mpx')
 const template = source.match(/<template>([\s\S]*?)<\/template>/)[1]
 const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
 const jsonCode = source.match(/<script name="json">([\s\S]*?)<\/script>/)[1]
 for (const mode of ['wx', 'web']) {
  let opts, modal, locationCalls = 0
  const implemented = {}
  const context = { __mpx_mode__: mode, createPage: value => { opts = value }, implement: (name, config) => { if (config.modes.includes(mode)) implemented[name] = config }, showModal: x => { modal = x }, chooseLocation: x => { locationCalls++; x.success({ name: '真实地点' }) } }
  context.wx = { showModal: context.showModal, chooseLocation: context.chooseLocation }
  vm.runInNewContext(script, context)
  const page = JSON.parse(JSON.stringify(opts.data))
  Object.keys(opts.methods).forEach(key => { page[key] = opts.methods[key].bind(page) })
  Object.keys(opts.computed).forEach(key => Object.defineProperty(page, key, { get: opts.computed[key].bind(page) }))
  const jsonContext = { __mpx_mode__: mode, module: { exports: {} } }
  vm.runInNewContext(jsonCode, jsonContext)
  const config = jsonContext.module.exports
  const warnings = [], errors = []
  const parsed = compiler.parse(template, { mode, srcMode: 'wx', env: '', usingComponents: Object.keys(config.usingComponents), usingComponentsInfo: {}, externalClasses: [], defs: { __mpx_mode__: mode }, warn: x => warnings.push(x), error: x => errors.push(x), proxyComponentEventsRules: [] })
  const compiled = compiler.serialize(parsed.root)
  fs.writeFileSync('/tmp/case2-' + group + '-' + mode + '.template', compiled)
  const checks = []
  function check (id, name, fn) { try { fn(); checks.push({ id, name, passed: true }) } catch (error) { checks.push({ id, name, passed: false, error: error.message }) } }
  check('c0', 'scan result and error handlers', () => { page.onScanResult({ detail: { result: '真实扫码结果' } }); assert.equal(page.scanResult, '真实扫码结果'); assert.equal(page.scanning, false); page.onScanError(); assert.equal(page.scanError, '相机不可用'); assert(!/this\.setData\s*\(/.test(script)) })
  check('c1', 'rename draft/cancel/confirm and original wx modal', () => { page.rename(); if (mode === 'web') { page.onNameInput({ detail: { value: '草稿' } }); assert.equal(page.displayName, '默认名称'); page.cancelRename(); assert.equal(page.displayName, '默认名称'); page.rename(); page.onNameInput({ detail: { value: '提交名称' } }); page.confirmRename(); assert.equal(page.displayName, '提交名称'); assert.equal(page.renameVisible, false); assert(/@input=.{0,100}onNameInput/.test(compiled)); assert(compiled.includes('renameVisible')); } else { assert(modal.editable); modal.success({ confirm: false, content: '取消' }); assert.equal(page.displayName, '默认名称'); modal.success({ confirm: true, content: '提交名称' }); assert.equal(page.displayName, '提交名称') } })
  check('c2', 'scanner registration/template and readonly dependency', () => { assert.equal(read(root + '/native-scanner.mpx'), read(base + '/iteration-13/eval-2-api-component-adaptation/input/native-scanner.mpx')); assert.equal(compiled.includes('<native-scanner'), mode === 'wx'); assert.equal(Boolean(config.usingComponents['native-scanner']), mode === 'wx'); page.startScan(); assert.equal(page.scanning, mode === 'wx') })
  check('c3', 'video complete URL through actual Web mixin and Vue Router', () => { if (mode === 'web') { mixinContext.mixin.created.call({ $root: { $options: { router: { currentRoute: { query } } } }, __mpxProxy: { callHook: (hook, args) => opts.onLoad.apply(page, args) } }) } else { opts.onLoad.call(page, { videoUrl: encodeURIComponent(url) }, { videoUrl: url }) } assert.equal(page.src, url) })
  check('c3', 'video target fallback, detail priority, zero and empty fields', () => { page.onTimeUpdate({ detail: {}, target: { currentTime: 8, duration: 99 }, currentTarget: { currentTime: 55 } }); assert.equal(page.currentTime, 8); assert.equal(page.duration, 99); page.onTimeUpdate({ detail: { currentTime: 0, duration: 0 }, target: { currentTime: 5, duration: 10 } }); assert.equal(page.currentTime, 0); assert.equal(page.duration, 0); page.onMetadata({ target: { videoWidth: 1920, videoHeight: 1080, duration: 99 } }); assert.equal(page.videoWidth, 1920); assert.equal(page.videoHeight, 1080); page.onMetadata({ detail: { width: 0, height: 0 }, target: { videoWidth: 1920, videoHeight: 1080 } }); assert.equal(page.videoWidth, 0); assert.equal(page.videoHeight, 0); page.onTimeUpdate({}); page.onMetadata({}); assert.equal(page.currentTime, 0); assert.equal(page.videoWidth, 0); assert(compiled.includes(mode === 'web' ? '@timeupdate=' : 'bindtimeupdate=')); assert(compiled.includes(mode === 'web' ? '@loadedmetadata=' : 'bindloadedmetadata=')) })
  check('c4', 'location guarded and wx success writes name', () => { page.choosePlace(); assert.equal(locationCalls, mode === 'wx' ? 1 : 0); assert.equal(page.placeName, mode === 'wx' ? '真实地点' : '尚未选择'); assert(source.includes('TODO(web)')) })
  check('c5', 'plugin template and config isolated', () => { assert.equal(compiled.includes('<foo-card'), mode === 'wx'); assert.equal(config.usingComponents['foo-card'], mode === 'wx' ? 'plugin://foo/component' : undefined) })
  check('c6', 'region/map event and stable marker IDs', () => { page.onWxRegionChange({ detail: { value: ['北京市','北京市','朝阳区'], code: ['110000','110100','110105'] } }); assert.equal(page.regionText, '北京市 / 北京市 / 朝阳区'); page.onWebRegionChange({ detail: { value: '1' } }); assert.equal(page.regionText, '上海市 / 上海市 / 浦东新区'); assert.equal(page.regionCodes.join(','), '310000,310100,310115'); assert.equal(page.regionIndex, 1); page.onWxMarkerTap({ detail: { markerId: '102' } }); assert.equal(page.selectedStoreId, 102); assert.equal(page.selectedStoreName, '国贸门店'); assert.equal(compiled.includes('<map'), mode === 'wx'); if (mode === 'web') { assert(/@change=.{0,100}onWebRegionChange/.test(compiled)); assert(compiled.includes(':range="(regionLabels)"')); assert(compiled.includes(':value="(regionIndex)"')); assert(compiled.includes('mode="selector"')) } else { assert(compiled.includes('mode="region"')); assert(compiled.includes('bindmarkertap="onWxMarkerTap"')) } })
  check('c7', 'swiper/image common props and state', () => { assert(compiled.includes('previous-margin="24rpx"')); assert(compiled.includes('next-margin="24rpx"')); assert.equal(compiled.includes('display-multiple-items="2"'), mode === 'wx'); assert.equal(compiled.includes('lazy-load'), mode === 'wx'); assert(compiled.includes('aspectFill')); page.onBannerChange({ detail: { current: 1 } }); assert.equal(page.activeBannerId, 'campaign-b'); page.selectProduct('p-201'); assert.equal(page.selectedProductId, 'p-201') })
  check('c8', 'grid/page-container real web replacement plus conditional panel', () => { ['grid-view','grid-item','page-container'].forEach(tag => assert.equal(compiled.includes('<' + tag), mode === 'wx')); if (mode === 'web') { assert(/v-if=[^>]*filterVisible/.test(compiled)); assert(compiled.includes('chooseDraftCategory')); assert(!/\bwx:if|bindtap=/.test(compiled)); assert(source.includes('display: grid')); assert(source.includes('position: fixed')); } })
  check('c9', 'store confirm and filter draft/cancel/confirm', () => { page.confirmSelection(); assert.equal(page.confirmedText, '上海市 / 上海市 / 浦东新区 · 国贸门店'); page.openFilter(); page.chooseDraftCategory('home'); assert.equal(page.appliedCategory, 'all'); page.cancelFilter(); assert.equal(page.appliedCategory, 'all'); assert.equal(page.draftCategory, 'all'); assert.equal(page.filterVisible, false); page.openFilter(); page.chooseDraftCategory('home'); page.confirmFilter(); assert.equal(page.appliedCategory, 'home'); assert.equal(page.filteredProducts.length, 1); assert.equal(page.filteredProducts[0].id, 'p-101'); page.openFilter(); assert.equal(page.draftCategory, 'home'); page.chooseDraftCategory('all'); page.cancelFilter(); assert.equal(page.appliedCategory, 'home') })
  check('c10', 'share wx payload and explicit web remove', () => { if (mode === 'wx') { assert.equal(opts.onShareAppMessage().title, '业务详情'); assert.equal(opts.onShareAppMessage().path, '/pages/business/index'); assert(compiled.includes('open-type="share"')) } else { assert(!opts.onShareAppMessage || implemented.onShareAppMessage.remove === true); assert(!compiled.includes('open-type="share"')); assert(compiled.includes('disabled')); } })
  results.push({ group, mode, warnings, errors, checks })
 }
}
fs.writeFileSync('/tmp/mpx2web-case2-verification.json', JSON.stringify({ url, actualRouterQuery: query, results }, null, 2))
console.log(JSON.stringify(results.map(({ group, mode, warnings, errors, checks }) => ({ group, mode, warnings: warnings.length, errors, passed: checks.filter(x => x.passed).length, failed: checks.filter(x => !x.passed) })), null, 2))
