const fs = require('fs')
const path = require('path')
const vm = require('vm')
const source = fs.readFileSync(path.join(__dirname, 'orders-script.js'), 'utf8').replace(/^import .*$/gm, '')
function create () {
  let options
  const fetchOrders = jest.fn().mockResolvedValue([{ id: 100, name: '订单' }])
  vm.runInNewContext(source, {
    createPage: value => { options = value },
    fetchOrders,
    wx: {
      getWindowInfo: () => ({ windowHeight: 800, statusBarHeight: 24 }),
      getMenuButtonBoundingClientRect: () => ({ top: 28, height: 32 })
    }
  })
  const page = Object.assign({}, options.data, options.methods)
  return { page, options, fetchOrders }
}
test('initial load, pagination append, scroll detail, resize sizing', async () => {
  const { page, options, fetchOrders } = create()
  await options.onLoad.call(page)
  expect(fetchOrders).toHaveBeenLastCalledWith(1)
  expect(page.scrollHeight).toBe(736)
  fetchOrders.mockResolvedValueOnce([{ id: 200 }])
  await page.loadMore()
  expect(fetchOrders).toHaveBeenLastCalledWith(2)
  expect(page.orders.map(row => row.id)).toEqual([100, 200])
  expect(page.pageNo).toBe(2)
  page.onScroll({ detail: { scrollTop: 90 } })
  expect(page.scrollTop).toBe(90)
  options.onResize.call(page)
  expect(page.scrollHeight).toBe(736)
})
test('refresh replaces list and resets page and controlled refresher', async () => {
  const { page, fetchOrders } = create()
  page.pageNo = 4
  page.orders = [{ id: 400 }]
  const promise = page.onRefresh()
  expect(page.refreshing).toBe(true)
  await promise
  expect(fetchOrders).toHaveBeenCalledWith(1)
  expect(page.orders.map(row => row.id)).toEqual([100])
  expect(page.pageNo).toBe(1)
  expect(page.refreshing).toBe(false)
})
test('failed refresh exits refresher and preserves existing list and page', async () => {
  const { page, fetchOrders } = create()
  page.pageNo = 3
  page.orders = [{ id: 300 }]
  fetchOrders.mockRejectedValueOnce(new Error('offline'))
  await expect(page.onRefresh()).rejects.toThrow('offline')
  expect(page.refreshing).toBe(false)
  expect(page.pageNo).toBe(3)
  expect(page.orders).toEqual([{ id: 300 }])
})
