const fs = require('fs')
const path = require('path')
const vm = require('vm')
const { parseDocument } = require('htmlparser2')

const outputDir = path.resolve(__dirname, '../outputs')
const source = fs.readFileSync(path.join(outputDir, 'orders.mpx'), 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
const service = fs.readFileSync(path.join(outputDir, 'service.js'), 'utf8').replace('export function', 'function')
const event = (id = 'orders-main', detail = {}) => ({ target: { id }, currentTarget: { id: 'orders-main' }, detail })
const evidence = []

function mount (renderer, overrideFetch) {
  let options
  const calls = []
  const context = vm.createContext({
    createPage: value => { options = value },
    getWindowInfo: () => ({ windowHeight: 844, statusBarHeight: 47 }),
    getMenuButtonBoundingClientRect: () => ({ height: 32, top: 53 }),
    Promise
  })
  vm.runInContext(service, context)
  const fetch = context.fetchOrders
  context.fetchOrders = (page, fail) => {
    calls.push({ page, fail: fail === true })
    return overrideFetch ? overrideFetch(page, fail, fetch) : fetch(page, fail)
  }
  vm.runInContext(script, context)
  const instance = Object.assign({}, JSON.parse(JSON.stringify(options.data)), { renderer })
  Object.keys(options.methods).forEach(name => { instance[name] = options.methods[name].bind(instance) })
  return { instance, options, calls }
}

describe.each(['webview', 'skyline'])('%s mocked page logic', renderer => {
  test('initial load, two bottom events, refresh success/failure, retry and event ownership', async () => {
    const { instance: page, options, calls } = mount(renderer)
    await options.onLoad.call(page)
    expect(calls).toEqual([{ page: 1, fail: false }])
    expect(page.sections).toHaveLength(4)
    page.sections.forEach(group => expect(group.items).toHaveLength(8))
    expect(page.contentHeight).toBe(753)
    expect(page.statusBarHeight + page.navigationHeight + page.contentHeight).toBe(844)
    const initial = JSON.stringify(page.sections)
    await page.onLoadMore(event())
    await page.onLoadMore(event())
    expect(page.pageNo).toBe(3)
    expect(page.sections).toHaveLength(12)
    expect(JSON.stringify(page.sections.slice(0, 4))).toBe(initial)
    const groupIds = page.sections.map(group => group.id)
    const orderIds = page.sections.flatMap(group => group.items.map(order => order.id))
    expect(new Set(groupIds).size).toBe(12)
    expect(new Set(orderIds).size).toBe(96)
    const beforeFailure = JSON.stringify(page.sections)
    const failedRefresh = page.reload(true)
    expect(page.refreshing).toBe(true)
    await failedRefresh
    expect(page.refreshing).toBe(false)
    expect(page.loading).toBe(false)
    expect(page.pageNo).toBe(3)
    expect(JSON.stringify(page.sections)).toBe(beforeFailure)
    expect(page.errorMessage).toBe('订单加载失败')
    await page.onLoadMore(event())
    expect(page.pageNo).toBe(4)
    expect(page.sections).toHaveLength(16)
    const refresh = page.onRefresh(event())
    expect(page.refreshing).toBe(true)
    await refresh
    expect(page.refreshing).toBe(false)
    expect(page.loading).toBe(false)
    expect(page.errorMessage).toBe('')
    expect(page.pageNo).toBe(1)
    expect(JSON.stringify(page.sections)).toBe(initial)
    page.onMainScroll(event('orders-main', { scrollTop: 237 }))
    expect(page.scrollTop).toBe(237)
    page.onMainScroll(event('orders-outer', { scrollTop: 99 }))
    page.onMainScroll(event('horizontal-strip', { scrollTop: 0, scrollLeft: 120 }))
    expect(page.scrollTop).toBe(237)
    await page.onLoadMore(event('horizontal-strip'))
    await page.onRefresh(event('orders-outer'))
    expect(page.pageNo).toBe(1)
    page.open()
    expect(page.opened).toBe(true)
    page.close()
    expect(page.opened).toBe(false)
    evidence.push({ renderer, calls, initialGroups: 4, initialOrdersPerGroup: 8, afterTwoPages: { pageNo: 3, groups: 12, orders: 96 }, failedRefresh: { listUnchanged: true, pageNo: 3, refreshing: false }, recoveryPage: 4, successfulRefresh: { pageNo: 1, groups: 4, refreshing: false }, mainScrollTop: page.scrollTop, childEventsIgnored: true, modalOpenClose: true, layout: { windowHeight: 844, statusBarHeight: 47, navigationHeight: page.navigationHeight, contentHeight: page.contentHeight } })
  })

  test('duplicate bottom events cannot issue concurrent pages; failure does not advance page number', async () => {
    let resolvePage
    let rejectPage
    let delayed = false
    const { instance: page, calls } = mount(renderer, (number, fail, fetch) => {
      if (!delayed) return fetch(number, fail)
      return new Promise((resolve, reject) => { resolvePage = resolve; rejectPage = reject })
    })
    await page.reload()
    delayed = true
    const pending = page.onLoadMore(event())
    await page.onLoadMore(event())
    expect(calls.map(call => call.page)).toEqual([1, 2])
    rejectPage(new Error('分页失败'))
    await pending
    expect(page.pageNo).toBe(1)
    expect(page.sections).toHaveLength(4)
    expect(page.loading).toBe(false)
    const retry = page.onLoadMore(event())
    expect(calls.map(call => call.page)).toEqual([1, 2, 2])
    resolvePage([])
    await retry
    expect(page.pageNo).toBe(2)
    evidence.push({ renderer, concurrency: { requests: calls, failureKeepsPage: 1, retryRequestsPage: 2 } })
  })
})

test('static template structure, JSON and immutable service contract', () => {
  const template = source.match(/<template>([\s\S]*?)<\/template>/)[1]
  const doc = parseDocument(template, { xmlMode: true, decodeEntities: false })
  const nodes = []
  const visit = node => { if (node.type === 'tag') nodes.push(node); (node.children || []).forEach(visit) }
  visit(doc)
  const get = id => nodes.find(node => node.attribs.id === id)
  const root = nodes.find(node => node.attribs.class === 'page')
  const main = get('orders-main')
  const outer = get('orders-outer')
  expect(main.parent).toBe(outer)
  expect(outer.attribs.type).toBe('nested')
  expect(main.attribs.type).toBe('custom')
  expect(main.attribs['associative-container']).toBe('nested-scroll-view')
  expect(main.attribs.bindrefresherrefresh).toBe('onRefresh')
  expect(main.attribs.bindscrolltolower).toBe('onLoadMore')
  expect(main.attribs.bindscroll).toBe('onMainScroll')
  expect(Object.keys(outer.attribs).filter(key => key.startsWith('bind'))).toEqual([])
  const scrolls = nodes.filter(node => node.name === 'scroll-view')
  expect(scrolls).toHaveLength(4)
  scrolls.forEach(node => expect(node.attribs.type).toBeTruthy())
  const strips = nodes.filter(node => node.attribs.class === 'strip')
  strips.forEach(strip => {
    expect(strip.attribs['enable-flex']).toBe('{{true}}')
    expect(Object.keys(strip.attribs).filter(key => key.startsWith('bind'))).toEqual([])
    expect(strip.children.filter(node => node.type === 'tag').map(node => node.attribs.class)).toEqual(['tile'])
  })
  const sticky = nodes.find(node => node.name === 'sticky-section')
  expect(sticky.parent.attribs['wx:if']).toBe("{{renderer === 'skyline'}}")
  expect(sticky.children.filter(node => node.type === 'tag')[0].name).toBe('sticky-header')
  const webGroup = nodes.find(node => node.attribs.class === 'group')
  expect(webGroup.parent.attribs).toHaveProperty('wx:else')
  expect(nodes.find(node => node.attribs.class === 'modal').parent).toBe(root)
  expect(nodes.find(node => node.attribs.class === 'fab').parent).toBe(root)
  expect(source).toMatch(/\.summary\s*\{[^}]*height: 120px/)
  expect(source).toMatch(/\.tile\s*\{[^}]*width: 120px/)
  expect(source).toMatch(/\.header\s*\{[^}]*background: #fff/)
  expect(source).toMatch(/\.fab\s*\{[^}]*position: fixed;[^}]*z-index: 2/)
  expect(source).toMatch(/\.modal\s*\{[^}]*position: fixed;[^}]*z-index: 3/)
  expect(script).not.toMatch(/onPullDownRefresh|onReachBottom|onPageScroll|stopPullDownRefresh/)
  const pageJson = JSON.parse(source.match(/<script type="application\/json">([\s\S]*?)<\/script>/)[1])
  expect(pageJson).toEqual({ navigationBarTitleText: '订单', renderer: 'skyline', componentFramework: 'glass-easel', navigationStyle: 'custom', disableScroll: true, enablePullDownRefresh: false })
  const app = JSON.parse(fs.readFileSync(path.join(outputDir, 'app.json')))
  const originalApp = JSON.parse(fs.readFileSync(path.join(__dirname, '../../input/app.json')))
  expect(app.pages).toEqual(originalApp.pages)
  expect(app.window).toEqual(originalApp.window)
  expect(app.rendererOptions.webview).toEqual(originalApp.rendererOptions.webview)
  expect(app.renderer).toBeUndefined()
  expect(app.lazyCodeLoading).toBe('requiredComponents')
  expect(app.rendererOptions.skyline).toEqual({ defaultDisplayBlock: true, defaultContentBox: true, tagNameStyleIsolation: 'legacy', enableScrollViewAutoSize: true, keyframeStyleIsolation: 'legacy' })
  expect(fs.readFileSync(path.join(outputDir, 'service.js'), 'utf8')).toBe(fs.readFileSync(path.join(__dirname, '../../input/service.js'), 'utf8'))
})

afterAll(() => {
  fs.writeFileSync(path.join(__dirname, 'mock-evidence.json'), JSON.stringify({ kind: 'mock', runtime: 'Node vm; extracted actual SFC options and unchanged service; no WeChat rendering', evidence }, null, 2) + '\n')
})
