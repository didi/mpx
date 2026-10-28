const fs = require('fs')
const path = require('path')
const vm = require('vm')
const outputs = path.resolve(__dirname, '../outputs')
const source = fs.readFileSync(path.join(outputs, 'orders.mpx'), 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
const service = fs.readFileSync(path.join(outputs, 'service.js'), 'utf8').replace('export function', 'function')
const trace = []
function mount (renderer) {
  const fetchOrdersReal = vm.runInNewContext(service + '\nfetchOrders', { Promise })
  const fetchOrders = jest.fn(fetchOrdersReal)
  let options
  const windowInfo = { windowHeight: 844, statusBarHeight: 47 }
  const wx = {
    getWindowInfo: jest.fn(() => windowInfo),
    getMenuButtonBoundingClientRect: jest.fn(() => ({ top: 51, height: 32 })),
    showToast: jest.fn()
  }
  vm.runInNewContext(script, { createPage: value => { options = value }, fetchOrders, wx, Promise })
  const page = Object.assign({ renderer }, JSON.parse(JSON.stringify(options.data)))
  Object.entries(options.methods).forEach(([key, value]) => { page[key] = value.bind(page) })
  const handlers = Object.fromEntries(Object.entries(options).filter(([key]) => key.startsWith('on')).map(([key, value]) => [key, value.bind(page)]))
  return { page, fetchOrders, fetchOrdersReal, wx, handlers, windowInfo }
}
function snapshot (page) {
  return {
    groups: page.sections.length,
    orders: page.sections.reduce((sum, section) => sum + section.items.length, 0),
    pageNo: page.pageNo,
    refreshing: page.refreshing,
    loadingMore: page.loadingMore,
    scrollTop: page.scrollTop
  }
}
describe.each(['skyline', 'webview'])('%s shared business handlers', renderer => {
  test('entry, two consecutive pages, scroll, refresh success and failure, then continued operation', async () => {
    const { page, handlers, fetchOrders, wx } = mount(renderer)
    await handlers.onLoad()
    expect(fetchOrders.mock.calls).toEqual([[1, false]])
    expect(page.sections).toHaveLength(4)
    page.sections.forEach(section => expect(section.items).toHaveLength(8))
    expect(page.refreshing).toBe(false)
    expect(page.viewportHeight).toBe(757)
    trace.push({ renderer, action: 'initial', state: snapshot(page), requested: [1] })
    const original = page.sections.slice()
    await page.loadMore()
    expect(page.sections).toHaveLength(8)
    expect(page.pageNo).toBe(2)
    original.forEach((section, index) => expect(page.sections[index]).toBe(section))
    trace.push({ renderer, action: 'pagination-1', state: snapshot(page), requested: [2] })
    await page.loadMore()
    expect(page.sections).toHaveLength(12)
    expect(page.pageNo).toBe(3)
    original.forEach((section, index) => expect(page.sections[index]).toBe(section))
    expect(new Set(page.sections.map(section => section.id)).size).toBe(12)
    expect(new Set(page.sections.flatMap(section => section.items.map(item => item.id))).size).toBe(96)
    trace.push({ renderer, action: 'pagination-2', state: snapshot(page), requested: [3] })
    page.onMainScroll({ detail: { scrollTop: 238 } })
    expect(page.scrollTop).toBe(238)
    page.ignoreScroll({ detail: { scrollTop: 700 } })
    expect(page.scrollTop).toBe(238)
    trace.push({ renderer, action: 'main-scroll', state: snapshot(page) })
    const pendingRefresh = page.onRefresh({ type: 'refresherrefresh' })
    expect(page.refreshing).toBe(true)
    await pendingRefresh
    expect(page.sections).toHaveLength(4)
    expect(page.pageNo).toBe(1)
    expect(page.refreshing).toBe(false)
    trace.push({ renderer, action: 'refresh-success', state: snapshot(page), requested: [1] })
    await page.loadMore()
    const beforeFailure = page.sections
    const failedRefresh = page.reload(true)
    expect(page.refreshing).toBe(true)
    await failedRefresh
    expect(page.sections).toBe(beforeFailure)
    expect(page.pageNo).toBe(2)
    expect(page.refreshing).toBe(false)
    expect(wx.showToast).toHaveBeenCalledWith({ title: '订单加载失败', icon: 'none' })
    trace.push({ renderer, action: 'refresh-failure-preserves-list', state: snapshot(page), requested: [1, true] })
    await page.loadMore()
    expect(page.pageNo).toBe(3)
    expect(page.sections).toHaveLength(12)
    trace.push({ renderer, action: 'paginate-after-failure', state: snapshot(page), requested: [3] })
    page.open()
    expect(page.opened).toBe(true)
    page.close()
    expect(page.opened).toBe(false)
  })
  test('overlapping requests do not duplicate pages; failed pagination retries the same page', async () => {
    const { page, handlers, fetchOrders, fetchOrdersReal } = mount(renderer)
    await handlers.onLoad()
    let resolvePending
    fetchOrders.mockImplementationOnce(() => new Promise(resolve => { resolvePending = resolve }))
    const loading = page.loadMore()
    const count = fetchOrders.mock.calls.length
    await page.loadMore()
    await page.onRefresh()
    expect(fetchOrders.mock.calls).toHaveLength(count)
    resolvePending(await fetchOrdersReal(2))
    await loading
    expect(page.pageNo).toBe(2)
    fetchOrders.mockImplementationOnce(page => fetchOrdersReal(page, true))
    const beforeFailure = page.sections
    await page.loadMore()
    expect(page.pageNo).toBe(2)
    expect(page.sections).toBe(beforeFailure)
    expect(page.loadingMore).toBe(false)
    await page.loadMore()
    expect(page.pageNo).toBe(3)
    expect(fetchOrders.mock.calls.slice(-2)).toEqual([[3], [3]])
    trace.push({ renderer, action: 'pagination-failure-and-retry', state: snapshot(page), requested: [3, 3] })
  })
  test('window changes recalculate the bounded scroll areas', async () => {
    const { page, handlers, windowInfo } = mount(renderer)
    await handlers.onLoad()
    windowInfo.windowHeight = 600
    handlers.onResize()
    expect(page.viewportHeight).toBe(513)
    trace.push({ renderer, action: 'resize', viewportHeight: page.viewportHeight })
  })
})
afterAll(() => fs.writeFileSync(path.join(__dirname, 'mock-evidence.json'), JSON.stringify({ environment: 'Node VM; mocked createPage and wx; real delivered service.js', trace }, null, 2) + '\n'))
