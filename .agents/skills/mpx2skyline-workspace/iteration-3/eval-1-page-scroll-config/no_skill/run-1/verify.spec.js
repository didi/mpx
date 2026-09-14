const fs = require('fs')
const vm = require('vm')
const parser = require('/Users/hjw/project/mpx/packages/webpack-plugin/lib/parser')
const dir = '/private/tmp/skyline-v3-baseline-20260911/eval-1-page-scroll-config/no_skill/outputs/'
const source = fs.readFileSync(dir + 'orders.mpx', 'utf8')
function parse (env) { return parser(source, { filePath: dir + 'orders.mpx', mode: 'wx', env }) }
function page (env, fetchOrders) {
  let options
  const wx = { stopPullDownRefresh: jest.fn(), getWindowInfo: () => ({ statusBarHeight: 24 }), getMenuButtonBoundingClientRect: () => ({ top: 32, height: 32 }) }
  vm.runInNewContext(parse(env).script.content.replace(/^import .*$/gm, ''), {
    createPage: value => { options = value }, fetchOrders, wx, __mpx_mode__: 'wx', __mpx_env__: env
  })
  return { instance: Object.assign({}, options.data, options.methods, options), wx }
}
test('Skyline and WebView parse into their intended template and config', () => {
  const skyline = parse('skyline')
  expect(skyline.template.content).toContain('bindrefresherrefresh="onRefresh"')
  expect(skyline.template.content).toContain('bindscrolltolower="loadMore"')
  expect(JSON.parse(skyline.json.content)).toMatchObject({ renderer: 'skyline', componentFramework: 'glass-easel', disableScroll: true })
  const webview = parse('webview')
  expect(webview.template.content).not.toContain('scroll-view')
  expect(JSON.parse(webview.json.content)).toEqual({ enablePullDownRefresh: true, navigationBarTitleText: '订单' })
  const app = JSON.parse(fs.readFileSync(dir + 'app.json', 'utf8'))
  expect(app.pages).toEqual(['pages/home', 'pages/orders'])
  expect(app.window.navigationBarTitleText).toBe('演示')
  expect(app.rendererOptions.webview).toEqual({})
})
test('initial load, pagination, refresh, scroll, and refresh failure cleanup', async () => {
  const fetchOrders = jest.fn().mockResolvedValueOnce([{ id: 1 }]).mockResolvedValueOnce([{ id: 2 }]).mockResolvedValueOnce([{ id: 3 }]).mockRejectedValueOnce(new Error('offline'))
  const { instance: p, wx } = page('skyline', fetchOrders)
  await p.onLoad()
  expect(p.orders).toEqual([{ id: 1 }])
  await p.loadMore()
  expect(fetchOrders).toHaveBeenLastCalledWith(2)
  expect(p.orders).toEqual([{ id: 1 }, { id: 2 }])
  await p.onRefresh()
  expect(p.pageNo).toBe(1)
  expect(p.orders).toEqual([{ id: 3 }])
  p.onScroll({ detail: { scrollTop: 99 } })
  expect(p.scrollTop).toBe(99)
  await p.onRefresh()
  expect(p.refreshing).toBe(false)
  expect(p.loading).toBe(false)
  expect(p.orders).toEqual([{ id: 3 }])
  expect(p.errorMessage).toBeTruthy()
  expect(wx.stopPullDownRefresh).not.toHaveBeenCalled()
})
test('WebView page refresh cleanup and page scroll remain functional', async () => {
  const { instance: p, wx } = page('webview', jest.fn().mockRejectedValue(new Error('offline')))
  await p.onPullDownRefresh()
  expect(wx.stopPullDownRefresh).toHaveBeenCalledTimes(1)
  p.onPageScroll({ scrollTop: 50 })
  expect(p.scrollTop).toBe(50)
})
test('service content unchanged', () => {
  expect(fs.readFileSync(dir + 'service.js', 'utf8')).toBe(fs.readFileSync('/Users/hjw/project/mpx/.agents/skills/mpx2skyline-workspace/iteration-3/eval-1-page-scroll-config/input/service.js', 'utf8'))
})
