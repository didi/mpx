const fs = require('fs')
const path = require('path')
const assert = require('assert/strict')
const outputs = path.resolve(__dirname, '../outputs')
const source = fs.readFileSync(path.join(outputs, 'orders.mpx'), 'utf8')
const template = source.match(/<template>([\s\S]*?)<\/template>/)[1]
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
const service = new Function(fs.readFileSync(path.join(outputs, 'service.js'), 'utf8').replace('export function', 'function') + '\nreturn fetchOrders')()
const main = template.match(/<scroll-view\b[^>]*id="orders-main"[^>]*>/)[0]
const binding = event => main.match(new RegExp('(?:bind|catch)' + event + '="([^"]+)"'))[1]
const checks = []
;(async () => {
  for (const renderer of ['skyline', 'webview']) {
    let options
    let failNext = false
    let deferNext = false
    let release
    const calls = []
    const host = {
      getWindowInfo: () => ({ windowHeight: 500, statusBarHeight: 24 }),
      getMenuButtonBoundingClientRect: () => ({ top: 28, height: 32 }),
      showToast: () => {}
    }
    new Function('createPage', 'fetchOrders', 'wx', script)(value => { options = value }, (page, fail) => {
      calls.push([page, !!fail])
      if (failNext) { failNext = false; return Promise.reject(new Error('grader injected failure')) }
      if (deferNext) { deferNext = false; return new Promise(resolve => { release = async () => resolve(await service(page)) }) }
      return service(page, fail)
    }, host)
    const page = Object.assign({ renderer }, JSON.parse(JSON.stringify(options.data)))
    Object.entries(options.methods).forEach(([name, method]) => { page[name] = method.bind(page) })
    await options.onLoad.call(page)
    assert.equal(page.viewportHeight, 436)
    assert.equal(page.sections.length, 4)
    const initial = page.sections.slice()
    await page[binding('scrolltolower')]()
    await page[binding('scrolltolower')]()
    assert.equal(page.pageNo, 3)
    assert.equal(page.sections.length, 12)
    initial.forEach((group, i) => assert.equal(page.sections[i], group))
    let pending = page[binding('refresherrefresh')]()
    assert.equal(page.refreshing, true)
    assert.equal(!page.loadingMore, true)
    await pending
    assert.equal(page.sections.length, 4)
    assert.equal(page.pageNo, 1)
    assert.equal(page.refreshing, false)
    const beforeFailure = page.sections
    failNext = true
    pending = page[binding('refresherrefresh')]()
    assert.equal(page.refreshing, true)
    await pending
    assert.equal(page.sections, beforeFailure)
    assert.equal(page.refreshing, false)
    assert.equal(page.pageNo, 1)
    deferNext = true
    pending = page[binding('scrolltolower')]()
    assert.equal(!page.loadingMore, false)
    await release()
    await pending
    assert.equal(page.pageNo, 2)
    assert.equal(page.sections.length, 8)
    assert.equal(!page.loadingMore, true)
    page[binding('scroll')]({ detail: { scrollTop: 238 }, scrollTop: 999 })
    const horizontal = template.match(/<scroll-view\b[^>]*class="strip"[^>]*>/)[0]
    const horizontalHandler = horizontal.match(/catchscroll="([^"]+)"/)[1]
    page[horizontalHandler]({ detail: { scrollTop: 700 } })
    assert.equal(page.scrollTop, 238)
    page.open()
    assert.equal(page.opened, true)
    page.close()
    assert.equal(page.opened, false)
    checks.push({ renderer, status: 'pass', bindings: ['refresherrefresh', 'scrolltolower', 'scroll'].map(binding), calls, height: 436, initialGroupsHeight: 480, paginatedGroupsHeight: 1440, refreshFailureViaActualBinding: 'list/page preserved, refreshing false, pagination recovered', refresherEnabledWhileIdleAndRefreshing: true, refresherDisabledDuringPagination: true, scrollTopAfterHorizontalEvent: page.scrollTop })
  }
  console.log(JSON.stringify({ kind: 'grader independent Node mock', nativeRendering: false, checks }, null, 2))
})().catch(error => { console.error(error); process.exitCode = 1 })
