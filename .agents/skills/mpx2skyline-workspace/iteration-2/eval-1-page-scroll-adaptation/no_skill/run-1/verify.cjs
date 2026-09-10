const fs = require('fs')
const vm = require('vm')
const assert = require('assert/strict')
const source = fs.readFileSync('../outputs/orders.mpx', 'utf8')
const script = source.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
const app = JSON.parse(fs.readFileSync('../outputs/app.json', 'utf8'))
const originalApp = JSON.parse(fs.readFileSync('../../input/app.json', 'utf8'))
const config = JSON.parse(source.match(/<script type="application\/json">([\s\S]*?)<\/script>/)[1])
assert.deepEqual(app.pages, originalApp.pages)
assert.deepEqual(app.window, originalApp.window)
assert.deepEqual(app.rendererOptions.webview, originalApp.rendererOptions.webview)
assert.equal(config.navigationBarTitleText, '订单')
assert.equal(fs.readFileSync('../outputs/service.js', 'utf8'), fs.readFileSync('../../input/service.js', 'utf8'))
assert.match(source, /from '\.\/service'/)
assert.match(source, /bindscrolltolower="loadMore"/)
assert.match(source, /bindrefresherrefresh="onRefresh"/)
assert.match(source, /bindscroll="onScroll"/)
assert.doesNotMatch(source, /onPullDownRefresh|onReachBottom|onPageScroll|stopPullDownRefresh/)
let options
let fail = false
const calls = []
vm.runInNewContext(script, {
  createPage: value => { options = value },
  fetchOrders: page => {
    calls.push(page)
    return fail ? Promise.reject(new Error('controlled failure')) : Promise.resolve([{ id: page, name: '订单 ' + page }])
  },
  console: { error () {} }
})
const page = Object.assign({}, options.data, options.methods)
;(async () => {
  options.onLoad.call(page)
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(page.orders.length, 1)
  assert.equal(page.pageNo, 1)
  await page.loadMore()
  assert.equal(page.orders.length, 2)
  assert.equal(page.pageNo, 2)
  page.onScroll({ detail: { scrollTop: 123 } })
  assert.equal(page.scrollTop, 123)
  const refresh = page.onRefresh()
  assert.equal(page.refreshing, true)
  await refresh
  assert.equal(page.orders.length, 1)
  assert.equal(page.pageNo, 1)
  assert.equal(page.refreshing, false)
  fail = true
  await page.onRefresh()
  assert.equal(page.refreshing, false)
  assert.equal(page.loading, false)
  assert.equal(page.orders.length, 1)
  await page.loadMore()
  assert.equal(page.pageNo, 1)
  assert.equal(page.loading, false)
  fail = false
  const pending = page.loadMore()
  const count = calls.length
  page.loadMore()
  assert.equal(calls.length, count)
  await pending
  console.log('PASS: JSON/preserved config, dependency, event bindings, initial load, pagination, scroll position, refresh success/failure, pagination failure, duplicate-request guard')
})().catch(error => { console.error(error); process.exitCode = 1 })
