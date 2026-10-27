const fs = require('fs')
const path = require('path')
const assert = require('assert')
const vm = require('vm')
const repo = '/Users/didi/work/mpx'
const base = path.join(repo, '.agents/skills/mpx2web-workspace/iteration-13/eval-3-ssr-state-adaptation')
const { JSDOM, VirtualConsole } = require(repo + '/node_modules/jest-environment-jsdom/node_modules/jsdom')
const roots = { mpx: '/private/tmp/mpx-article-ssr-7Y2mBO', mpx2web: fs.readFileSync('/tmp/article-ssr-check-path', 'utf8') }
const result = {}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
async function check (group) {
 const root = roots[group]
 const req = require('module').createRequire(path.join(root, 'package.json'))
 const files = ['mpx.config.js', 'src/app.mpx', 'src/services/article.js', 'src/store/article.js', 'src/pages/article/index.mpx']
 files.forEach(file => assert.strictEqual(fs.readFileSync(path.join(base, group, 'outputs', file), 'utf8'), fs.readFileSync(path.join(root, file), 'utf8')))
 let render, bundles
 if (group === 'mpx') {
  const manifest = req('./dist/client/vue-ssr-client-manifest.json')
  assert.strictEqual(manifest.publicPath, '/help-demo/')
  const renderer = req('vue-server-renderer').createBundleRenderer(req('./dist/server/vue-ssr-server-bundle.json'), { runInNewContext: false, template: fs.readFileSync(path.join(root, 'public/index.html'), 'utf8'), clientManifest: manifest })
  render = async id => { const context = { url: '/pages/article/index' + (id === undefined ? '' : '?id=' + id) }; return { context, html: await renderer.renderToString(context) } }
  bundles = manifest.initial.filter(file => file.endsWith('.js')).map(file => fs.readFileSync(path.join(root, 'dist/client', file), 'utf8'))
 } else {
  const factory = req('./build/server/app.js').default
  const renderer = req('vue-server-renderer').createRenderer({ template: '<html><body><!--vue-ssr-outlet--></body></html>' })
  render = async id => { const context = { url: '/pages/article/index' + (id === undefined ? '' : '?id=' + id) }; const app = await factory(context); return { context, app, html: await renderer.renderToString(app, context) } }
  bundles = [fs.readFileSync(path.join(root, 'build/client/app.js'), 'utf8')]
 }
 const concurrent = await Promise.all(['a', 'b', 'missing', undefined].map(render))
 concurrent.forEach(({ context, html }, i) => { const expected = ['a', 'b', null, 'a'][i]; const state = context.state.article; assert.strictEqual(state.loading, false); if (expected) { assert.strictEqual(state.article.id, expected); assert(html.includes('这是文章 ' + expected.toUpperCase() + ' 的正文。')); assert(!html.includes('加载中')) } else { assert.strictEqual(state.article, null); assert.strictEqual(state.errorText, '文章不存在'); assert(html.includes('文章不存在')) } })
 assert.notStrictEqual(concurrent[0].context.state, concurrent[1].context.state)
 concurrent[0].context.state.article.article.title = 'MUTATED'
 assert.strictEqual((await render('a')).context.state.article.article.title, '文章 A')
 result[group] = { identicalSources: files, serverConcurrentAndErrorAndDefault: true, freshRequestAfterMutation: true, hydration: {} }
 for (const id of ['a', 'b', 'missing']) {
  const { html } = await render(id)
  const errors = []
  const vc = new VirtualConsole()
  vc.on('jsdomError', e => errors.push(e.message)); vc.on('error', e => errors.push(String(e)))
  const dom = new JSDOM(html, { url: 'https://example.test/help-demo/pages/article/index?id=' + id, runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, beforeParse (window) { window.scrollTo = () => {} } })
  const { window } = dom
  const oldRoot = window.document.querySelector('#app')
  const oldPage = window.document.querySelector('.article')
  const timers = []
  const setTimer = window.setTimeout.bind(window)
  window.setTimeout = (fn, delay, ...args) => { timers.push(delay); return setTimer(fn, delay, ...args) }
  try { bundles.forEach(bundle => window.eval(bundle)) } catch (error) { result[group].hydration[id] = { exception: error.name + ': ' + error.message, fetchTimers: timers.filter(v => v === 10 || v === 40), errors }; dom.window.close(); continue }
  await sleep(1)
  const firstText = window.document.querySelector('.article').textContent
  const sameRoot = oldRoot === window.document.querySelector('#app')
  const samePage = oldPage === window.document.querySelector('.article')
  await sleep(70)
  const finalText = window.document.querySelector('.article').textContent
  let toggle = null
  if (id !== 'missing') {
   const button = window.document.querySelector('.mpx-button')
   button.dispatchEvent(new window.Event('tap', { bubbles: true })); await sleep(1)
   assert(window.document.querySelector('.article').textContent.includes('的补充说明。'))
   button.dispatchEvent(new window.Event('tap', { bubbles: true })); await sleep(1)
   assert(!window.document.querySelector('.article').textContent.includes('的补充说明。'))
   toggle = true
  }
  result[group].hydration[id] = { sameRoot, samePage, firstText, finalText, fetchTimers: timers.filter(v => v === 10 || v === 40), errors, toggle }
  if (group === 'mpx2web' && id === 'missing') {
   const app = window.document.querySelector('#app').__vue__
   await app.$router.push('/pages/article/index?id=a')
   await sleep(100)
   result[group].clientEntryAfterError = { text: window.document.querySelector('.article').textContent, url: window.location.href, fetchTimers: timers.filter(v => v === 10 || v === 40) }
  }
  dom.window.close()
 }
 // Execute unchanged source options with actual shared action and service in wx mode.
 const babel = req('@babel/core')
 let options, storeOptions
 const serviceExports = {}
 function exec (source, dependencies, exports = {}) { vm.runInNewContext(babel.transformSync(source, { babelrc: false, configFile: false, plugins: [req.resolve('@babel/plugin-transform-modules-commonjs')] }).code, { exports, __mpx_mode__: 'wx', setTimeout, require: id => { assert(id in dependencies, id); return dependencies[id] } }); return exports }
 const service = exec(fs.readFileSync(path.join(root, 'src/services/article.js'), 'utf8'), {}, serviceExports)
 let store
 const useStore = () => store
 const storeExports = exec(fs.readFileSync(path.join(root, 'src/store/article.js'), 'utf8'), { '@mpxjs/pinia': { defineStore: (id, value) => { storeOptions = value; return useStore } }, '../services/article': service })
 store = Object.assign(storeOptions.state(), storeOptions.actions)
 const pageSource = fs.readFileSync(path.join(root, 'src/pages/article/index.mpx'), 'utf8').split('<script>')[1].split('</script>')[0]
 exec(pageSource, { '@mpxjs/core': { createPage: value => { options = value } }, '@mpxjs/pinia': { mapState: () => ({}), mapActions: () => ({ loadArticle (id) { return store.loadArticle(id) } }) }, '../../store/article': storeExports })
 const page = Object.assign({ expanded: false }, options.methods)
 for (const id of ['b', undefined, 'missing']) {
  const pending = options.onLoad.call(page, id ? { id } : {})
  assert.strictEqual(store.loading, true)
  assert.strictEqual(store.errorText, '')
  await pending
  assert.strictEqual(store.loading, false)
  if (id === 'missing') assert.strictEqual(store.errorText, '文章不存在')
  else assert.strictEqual(store.article.id, id || 'a')
 }
 page.toggleExtra(); assert.strictEqual(page.expanded, true); page.toggleExtra(); assert.strictEqual(page.expanded, false)
 result[group].wxSharedActionLoadingErrorDefaultToggle = true
 if (group === 'mpx2web') {
  let webOptions
  vm.runInNewContext(babel.transformSync(pageSource, { babelrc: false, configFile: false, plugins: [req.resolve('@babel/plugin-transform-modules-commonjs')] }).code, { exports: {}, __mpx_mode__: 'web', require: id => id === '@mpxjs/core' ? { createPage: value => { webOptions = value } } : id === '@mpxjs/pinia' ? { mapState: () => ({}), mapActions: () => ({}) } : storeExports })
  let called = 0
  webOptions.mounted.call({ $route: { query: { id: 'a' } }, loading: false, article: null, errorText: '文章不存在', loadArticle: () => called++ })
  result[group].clientEntryAfterPreviousErrorActionCalls = called
 }
}
;(async () => { await check('mpx'); await check('mpx2web'); fs.writeFileSync('/tmp/mpx2web-ssr-probe-results.json', JSON.stringify(result, null, 2)); console.log(JSON.stringify(result, null, 2)) })().catch(e => { console.error(e.name, e.message, e.stack); process.exitCode = 1 })
