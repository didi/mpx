const fs = require('fs')
const vm = require('vm')
const path = require('path')
const output = path.resolve(__dirname, '../outputs')
const source = fs.readFileSync(path.join(output, 'orders.mpx'), 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]

function instance () {
  let options
  const fetchOrders = jest.fn(page => Promise.resolve([{ id: page, name: `订单 ${page}` }]))
  const wx = {
    getWindowInfo: () => ({ windowHeight: 800, statusBarHeight: 24 }),
    getMenuButtonBoundingClientRect: () => ({ top: 30, height: 32 }),
    showToast: jest.fn()
  }
  vm.runInNewContext(script.replace(/^import .*$/gm, ''), { createPage: value => { options = value }, fetchOrders, wx })
  const page = Object.assign({}, options.data, options.methods)
  return { page, options, fetchOrders, wx }
}

test('initial load, pagination, refresh replacement and scroll position', async () => {
  const { page, options, fetchOrders } = instance()
  options.onLoad.call(page)
  await new Promise(resolve => setImmediate(resolve))
  expect(page.orders).toHaveLength(1)
  expect(page.scrollHeight).toBe(700)
  await page.loadMore()
  expect(fetchOrders).toHaveBeenLastCalledWith(2)
  expect(page.orders).toHaveLength(2)
  expect(page.pageNo).toBe(2)
  const refresh = page.onRefresh()
  expect(page.refreshing).toBe(true)
  await refresh
  expect(page.orders).toHaveLength(1)
  expect(page.pageNo).toBe(1)
  expect(page.refreshing).toBe(false)
  page.onScroll({ detail: { scrollTop: 123 } })
  expect(page.scrollTop).toBe(123)
})

test('failed refresh ends refresh state and preserves data; failed pagination does not advance', async () => {
  const { page, fetchOrders, wx } = instance()
  await page.reload()
  const previous = page.orders
  fetchOrders.mockRejectedValue(new Error('network'))
  await page.onRefresh()
  expect(page.refreshing).toBe(false)
  expect(page.loading).toBe(false)
  expect(page.orders).toBe(previous)
  await page.loadMore()
  expect(page.pageNo).toBe(1)
  expect(page.orders).toBe(previous)
  expect(wx.showToast).toHaveBeenCalledTimes(2)
})

test('repeated bottom events do not duplicate pages', async () => {
  const { page, fetchOrders } = instance()
  let resolve
  fetchOrders.mockImplementation(() => new Promise(done => { resolve = done }))
  const pending = page.loadMore()
  page.loadMore()
  expect(fetchOrders).toHaveBeenCalledTimes(1)
  resolve([{ id: 2 }])
  await pending
  expect(page.pageNo).toBe(2)
})

test('page config and app config preserve scope; service is unchanged', () => {
  const config = JSON.parse(source.match(/<script type="application\/json">([\s\S]*?)<\/script>/)[1])
  expect(config).toMatchObject({ renderer: 'skyline', componentFramework: 'glass-easel', navigationStyle: 'custom', disableScroll: true, enablePullDownRefresh: false })
  const app = JSON.parse(fs.readFileSync(path.join(output, 'app.json'), 'utf8'))
  expect(app.pages).toEqual(['pages/home', 'pages/orders'])
  expect(app.window).toEqual({ navigationBarTitleText: '演示' })
  expect(app.rendererOptions.webview).toEqual({})
  expect(app.rendererOptions.skyline).toEqual({ defaultDisplayBlock: true, defaultContentBox: true, tagNameStyleIsolation: 'legacy', enableScrollViewAutoSize: true, keyframeStyleIsolation: 'legacy' })
  expect(fs.readFileSync(path.join(output, 'service.js'), 'utf8')).toBe(fs.readFileSync('/Users/hjw/project/mpx/.agents/skills/mpx2skyline-workspace/iteration-3/eval-1-page-scroll-config/input/service.js', 'utf8'))
  expect(source).toContain('bindrefresherrefresh="onRefresh"')
  expect(source).toContain('bindscrolltolower="loadMore"')
  expect(source).toContain('bindscroll="onScroll"')
  expect(source).not.toMatch(/onPullDownRefresh|onReachBottom|onPageScroll|stopPullDownRefresh/)
})
