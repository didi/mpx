const fs = require('fs')
const path = require('path')

const outputs = path.resolve(__dirname, '../outputs')
const source = fs.readFileSync(path.join(outputs, 'orders.mpx'), 'utf8')
const template = source.match(/<template>([\s\S]*?)<\/template>/)[1]
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
const pageJson = JSON.parse(source.match(/<script type="application\/json">([\s\S]*?)<\/script>/)[1])
const appJson = JSON.parse(fs.readFileSync(path.join(outputs, 'app.json'), 'utf8'))
const fetchOrders = new Function(fs.readFileSync(path.join(outputs, 'service.js'), 'utf8').replace('export function', 'function') + '\nreturn fetchOrders')()
const evidence = []

function instantiate (renderer, request = jest.fn(fetchOrders)) {
  let options
  const windowInfo = { windowHeight: 800, screenHeight: 800, statusBarHeight: 24, safeArea: { bottom: 780 } }
  new Function('createPage', 'getWindowInfo', 'getMenuButtonBoundingClientRect', 'fetchOrders', script)(
    value => { options = value },
    () => windowInfo,
    () => ({ top: 28, height: 32 }),
    request
  )
  const page = Object.assign({ renderer }, JSON.parse(JSON.stringify(options.data)))
  Object.entries(options.methods).forEach(([name, method]) => { page[name] = method.bind(page) })
  return { page, options, request, windowInfo }
}

function snapshot (name, page, request) {
  evidence.push({
    name,
    renderer: page.renderer,
    calls: request.mock.calls.map(args => args.slice()),
    pageNo: page.pageNo,
    groupCount: page.sections.length,
    orderCount: page.sections.reduce((total, group) => total + group.items.length, 0),
    groupIds: page.sections.map(group => group.id),
    scrollTop: page.scrollTop,
    loading: page.loading,
    refreshing: page.refreshing,
    errorMessage: page.errorMessage,
    scrollHeight: page.scrollHeight
  })
}

afterAll(() => {
  fs.writeFileSync(path.join(__dirname, 'mock-evidence.json'), JSON.stringify({ type: 'mock', nativeRendering: false, scenarios: evidence }, null, 2) + '\n')
})

describe.each(['webview', 'skyline'])('%s business methods with mocked host', renderer => {
  test('initial data, two pages, refresh success/failure, recovery, main scroll and modal', async () => {
    const { page, options, request } = instantiate(renderer)
    await options.onLoad.call(page)
    expect(request.mock.calls).toEqual([[1, false]])
    expect(page.sections).toHaveLength(4)
    page.sections.forEach(group => expect(group.items).toHaveLength(8))
    expect(page.scrollHeight).toBe(736)
    expect(page.floatingBottom).toBe(32)
    snapshot('initial', page, request)

    const firstGroups = page.sections.slice()
    await page.loadMore()
    expect(page.pageNo).toBe(2)
    expect(page.sections).toHaveLength(8)
    snapshot('pagination-1', page, request)
    await page.loadMore()
    expect(page.pageNo).toBe(3)
    expect(page.sections).toHaveLength(12)
    firstGroups.forEach((group, index) => {
      expect(page.sections[index]).toBe(group)
      expect(page.sections[index].items).toBe(group.items)
    })
    expect(new Set(page.sections.map(group => group.id)).size).toBe(12)
    expect(new Set(page.sections.flatMap(group => group.items.map(item => item.id))).size).toBe(96)
    snapshot('pagination-2', page, request)

    const refresh = page.onRefresh()
    expect(page.refreshing).toBe(true)
    await refresh
    expect(page.sections).toHaveLength(4)
    expect(page.pageNo).toBe(1)
    expect(page.refreshing).toBe(false)
    expect(page.loading).toBe(false)
    snapshot('refresh-success', page, request)

    const previous = page.sections
    const failure = page.reload(true)
    expect(page.refreshing).toBe(true)
    await failure
    expect(request).toHaveBeenLastCalledWith(1, true)
    expect(page.sections).toBe(previous)
    expect(page.pageNo).toBe(1)
    expect(page.errorMessage).toBe('订单加载失败')
    expect(page.refreshing).toBe(false)
    expect(page.loading).toBe(false)
    snapshot('refresh-failure-retains-data', page, request)

    await page.loadMore()
    expect(page.pageNo).toBe(2)
    expect(page.sections).toHaveLength(8)
    expect(page.errorMessage).toBe('')
    snapshot('recovery-after-failure', page, request)
    page.onMainScroll({ detail: { scrollTop: 137 }, scrollTop: 999 })
    expect(page.scrollTop).toBe(137)
    snapshot('main-scroll-detail', page, request)
    page.open()
    expect(page.opened).toBe(true)
    page.close()
    expect(page.opened).toBe(false)
  })
})

test('request lock prevents duplicate pagination and pages only advance on success', async () => {
  let resolvePage
  const request = jest.fn(fetchOrders)
  const { page, options } = instantiate('skyline', request)
  await options.onLoad.call(page)
  request.mockImplementationOnce(() => new Promise(resolve => { resolvePage = resolve }))
  const pending = page.loadMore()
  await page.loadMore()
  expect(request).toHaveBeenCalledTimes(2)
  expect(page.pageNo).toBe(1)
  resolvePage(await fetchOrders(2))
  await pending
  request.mockRejectedValueOnce(new Error('分页失败'))
  const before = page.sections
  await page.loadMore()
  expect(page.pageNo).toBe(2)
  expect(page.sections).toBe(before)
  expect(page.loading).toBe(false)
  await page.loadMore()
  expect(page.pageNo).toBe(3)
  expect(request.mock.calls.map(args => args[0])).toEqual([1, 2, 3, 3])
  snapshot('pagination-lock-failure-retry', page, request)
})

test('layout uses available window height and updates on resize', () => {
  const { page, options, windowInfo } = instantiate('skyline')
  page.updateLayout()
  expect(page.scrollHeight).toBe(736)
  windowInfo.windowHeight = 600
  options.onResize.call(page)
  expect(page.scrollHeight).toBe(536)
})

test('page and application config preserve home/window/webview and add Skyline baseline', () => {
  const input = JSON.parse(fs.readFileSync(path.resolve(outputs, '../../input/app.json'), 'utf8'))
  expect(appJson.pages).toEqual(input.pages)
  expect(appJson.window).toEqual(input.window)
  expect(appJson.rendererOptions.webview).toEqual(input.rendererOptions.webview)
  expect(appJson.lazyCodeLoading).toBe('requiredComponents')
  expect(appJson.rendererOptions.skyline).toEqual({
    defaultDisplayBlock: true,
    defaultContentBox: true,
    tagNameStyleIsolation: 'legacy',
    enableScrollViewAutoSize: true,
    keyframeStyleIsolation: 'legacy'
  })
  expect(pageJson).toMatchObject({ navigationBarTitleText: '订单', navigationStyle: 'custom', renderer: 'skyline', componentFramework: 'glass-easel', disableScroll: true, enablePullDownRefresh: false })
  expect(fs.readFileSync(path.join(outputs, 'service.js'), 'utf8')).toBe(fs.readFileSync(path.resolve(outputs, '../../input/service.js'), 'utf8'))
})

test('nested vertical structure and main event ownership; strips have explicit width and horizontal layout', () => {
  const scrollTags = template.match(/<scroll-view\b[^>]*>/g)
  expect(scrollTags).toHaveLength(4)
  scrollTags.forEach(tag => expect(tag).toMatch(/type="(nested|custom|list)"/))
  const outer = scrollTags.find(tag => tag.includes('id="outer-scroll"'))
  const main = scrollTags.find(tag => tag.includes('id="orders-scroll"'))
  expect(outer).toMatch(/type="nested"/)
  expect(outer).not.toMatch(/bindscroll|refresher-enabled/)
  expect(main).toMatch(/type="custom"/)
  expect(main).toMatch(/associative-container="nested-scroll-view"/)
  expect(main).toMatch(/bindrefresherrefresh="onRefresh"/)
  expect(main).toMatch(/refresher-triggered="\{\{refreshing\}\}"/)
  expect(main).toMatch(/bindscrolltolower="loadMore"/)
  expect(main).toMatch(/bindscroll="onMainScroll"/)
  scrollTags.filter(tag => tag.includes('class="strip"')).forEach(tag => {
    expect(tag).toMatch(/scroll-x="\{\{true\}\}"/)
    expect(tag).toMatch(/enable-flex="\{\{true\}\}"/)
    expect(tag).not.toMatch(/bindscroll|refresher-enabled|associative-container/)
  })
  expect(source).toMatch(/\.strip\s*\{[^}]*display: flex;[^}]*flex-direction: row;[^}]*width: 100%/)
  expect(source).toMatch(/\.tile\s*\{[^}]*flex-shrink: 0;[^}]*width: 120px/)
  expect(source).toMatch(/\.summary\s*\{[^}]*height: 120px/)
  expect(script).not.toMatch(/onPullDownRefresh|onReachBottom|onPageScroll|stopPullDownRefresh/)
})

test('renderer branches isolate CSS sticky; full screen modal is a fixed sibling above fab', () => {
  expect(template).toMatch(/<sticky-section wx:if="\{\{renderer === 'skyline'\}\}">\s*<sticky-header class="header">/)
  expect(template).toMatch(/<view wx:else class="group">\s*<view class="header webview-header">/)
  expect(source).toMatch(/\.header\s*\{[^}]*background: #fff/)
  expect(source).toMatch(/\.webview-header\s*\{[^}]*position: sticky; top: 0/)
  expect(source).toMatch(/\.fab\s*\{[^}]*position: fixed;[^}]*z-index: 10/)
  expect(source).toMatch(/\.modal\s*\{[^}]*position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 20/)
  expect(template).toMatch(/<\/scroll-view>\s*<view class="fab"[^>]*bindtap="open">[\s\S]*?<\/view>\s*<view wx:if="\{\{opened\}\}" class="modal" bindtap="close">/)
  expect(source).not.toMatch(/translateZ|position: absolute/)
})
