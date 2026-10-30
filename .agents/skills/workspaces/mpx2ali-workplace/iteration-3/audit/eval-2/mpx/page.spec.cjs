const fs = require('fs')
const path = require('path')
const vm = require('vm')
const pagePath = path.resolve(__dirname, '../fixed-page.mpx')

function loadPage () {
  const helper = fs.readFileSync(path.resolve(__dirname, '../utils/window-info.js'), 'utf8').replace(/export /g, '')
  const windowContext = vm.createContext({})
  vm.runInContext(helper + '\nthis.windowApi = { getWindowInfo, setWindowInfo }', windowContext)
  const getWindowInfo = jest.fn(windowContext.windowApi.getWindowInfo)
  const source = fs.readFileSync(pagePath, 'utf8').match(/<script>\s*([\s\S]*?)<\/script>/)[1]
  let options
  vm.runInNewContext(source.replace(/^import .*$/gm, ''), { createPage: value => { options = value }, getWindowInfo })
  const instance = Object.assign({}, options.data, options.methods)
  return { options, instance, getWindowInfo, setWindowInfo: windowContext.windowApi.setWindowInfo }
}

test.each([
  [{ windowHeight: 640, screenHeight: 800, statusBarHeight: 24, safeArea: { bottom: 776 } }, 640, 24],
  [{ windowHeight: 640, screenHeight: 800, statusBarHeight: 24 }, 640, 0],
  [{ windowHeight: 640, screenHeight: 800, statusBarHeight: 24, safeArea: { bottom: 810 } }, 640, 0],
  [{ windowHeight: 480, screenHeight: 800, statusBarHeight: 24, safeArea: { bottom: 780 } }, 480, 20]
])('onShow uses public window info %j', (info, height, safeBottom) => {
  const page = loadPage()
  page.setWindowInfo(info)
  page.options.onShow.call(page.instance)
  expect(page.getWindowInfo).toHaveBeenCalledTimes(1)
  expect(page.instance.pageHeight).toBe(height)
  expect(page.instance.statusBarHeight).toBe(24)
  expect(page.instance.safeBottom).toBe(safeBottom)
})

test('resize and later shows re-read the helper, without trusting event dimensions', () => {
  const page = loadPage()
  page.options.onShow.call(page.instance)
  page.setWindowInfo({ windowHeight: 480, screenHeight: 800, statusBarHeight: 24, safeArea: { bottom: 780 } })
  page.options.onResize.call(page.instance, { size: { windowHeight: 999 } })
  expect(page.instance.pageHeight).toBe(480)
  expect(page.instance.safeBottom).toBe(20)
  page.setWindowInfo({ windowHeight: 640, screenHeight: 800, statusBarHeight: 24 })
  page.options.onShow.call(page.instance)
  expect(page.instance.pageHeight).toBe(640)
  expect(page.instance.safeBottom).toBe(0)
  expect(page.getWindowInfo).toHaveBeenCalledTimes(3)
})

test('40 distinct order rows and completion state', () => {
  const { instance } = loadPage()
  expect(instance.orders).toHaveLength(40)
  expect(new Set(instance.orders.map(order => order.id)).size).toBe(40)
  expect(instance.completed).toBe(false)
  instance.completeOrders()
  expect(instance.completed).toBe(true)
})
