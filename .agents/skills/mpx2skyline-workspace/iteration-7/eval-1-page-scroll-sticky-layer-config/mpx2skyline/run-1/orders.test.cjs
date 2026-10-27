const fs = require('fs')
const path = require('path')
const vm = require('vm')
const outputDir = path.resolve(__dirname, '../outputs')
const source = fs.readFileSync(path.join(outputDir, 'orders.mpx'), 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
const serviceSource = fs.readFileSync(path.join(outputDir, 'service.js'), 'utf8').replace('export function', 'function')
const realFetch = vm.runInNewContext(serviceSource + '\nfetchOrders')
const scrollTags = source.match(/<scroll-view\b[^>]*>/g)
const mainTags = scrollTags.filter(tag => tag.includes('id="orders-scroll"'))
const evidence = []

function page (renderer = 'skyline') {
  let options
  const fetchOrders = jest.fn(realFetch)
  const wx = {
    getWindowInfo: jest.fn(() => ({ windowHeight: 800, statusBarHeight: 24 })),
    getMenuButtonBoundingClientRect: jest.fn(() => ({ top: 28, height: 32 })),
    showToast: jest.fn()
  }
  vm.runInNewContext(script, { createPage: value => { options = value }, fetchOrders, wx })
  const instance = Object.assign({}, options.data, { renderer })
  Object.entries(options.methods).forEach(([name, fn]) => { instance[name] = fn.bind(instance) })
  return { instance, options, wx, fetchOrders }
}

function checkIds (sections) {
  expect(new Set(sections.map(section => section.id)).size).toBe(sections.length)
  const orders = sections.flatMap(section => section.items)
  expect(new Set(orders.map(order => order.id)).size).toBe(orders.length)
  sections.forEach(section => expect(section.items).toHaveLength(8))
}

afterAll(() => {
  fs.writeFileSync(path.join(__dirname, 'mock-evidence.json'), JSON.stringify({ status: 'passed', evidence }, null, 2) + '\n')
})

describe.each(['skyline', 'webview'])('%s page logic (mock host, no rendered UI)', renderer => {
  const main = mainTags[renderer === 'skyline' ? 0 : 1]
  test('initial data, refresh replacement, failure recovery and two consecutive pages', async () => {
    const { instance, options, fetchOrders, wx } = page(renderer)
    const initial = options.onLoad.call(instance)
    expect(instance.refreshing).toBe(true)
    await initial
    expect(fetchOrders.mock.calls).toEqual([[1, false]])
    expect(instance.sections).toHaveLength(4)
    checkIds(instance.sections)
    expect(instance.refreshing).toBe(false)
    expect(instance.scrollHeight).toBe(732)
    const firstGroups = instance.sections.slice()
    const firstOrders = firstGroups.map(group => group.items)

    expect(main).toContain('catchscrolltolower="loadMore"')
    await instance.loadMore()
    expect(instance.pageNo).toBe(2)
    await instance.loadMore()
    expect(instance.pageNo).toBe(3)
    expect(instance.sections).toHaveLength(12)
    firstGroups.forEach((group, index) => {
      expect(instance.sections[index]).toBe(group)
      expect(instance.sections[index].items).toBe(firstOrders[index])
    })
    checkIds(instance.sections)
    evidence.push({ renderer, operation: 'initial_and_two_pages', requests: fetchOrders.mock.calls.slice(), sections: 12, orders: 96, pageNo: instance.pageNo, preservedOriginalObjects: true })

    expect(main).toContain('bindrefresherrefresh="onRefresh"')
    const beforeRefresh = instance.sections
    await instance.onRefresh({ type: 'refresherrefresh' })
    expect(instance.sections).not.toBe(beforeRefresh)
    expect(instance.sections).toHaveLength(4)
    expect(instance.pageNo).toBe(1)
    expect(instance.refreshing).toBe(false)
    evidence.push({ renderer, operation: 'refresh_success', sections: 4, pageNo: 1, refreshing: instance.refreshing })

    await instance.loadMore()
    const beforeFailure = instance.sections
    await instance.reload(true)
    expect(fetchOrders).toHaveBeenLastCalledWith(1, true)
    expect(instance.sections).toBe(beforeFailure)
    expect(instance.pageNo).toBe(2)
    expect(instance.refreshing).toBe(false)
    expect(instance.loading).toBe(false)
    expect(wx.showToast).toHaveBeenLastCalledWith({ title: '订单加载失败', icon: 'none' })
    evidence.push({ renderer, operation: 'refresh_failure', injected: 'fetchOrders(1, true)', sections: 8, pageNo: 2, sameList: true, refreshing: instance.refreshing })
    await instance.loadMore()
    expect(instance.pageNo).toBe(3)
    await instance.onRefresh()
    expect(instance.pageNo).toBe(1)
    expect(instance.sections).toHaveLength(4)
    evidence.push({ renderer, operation: 'continued_after_failure', nextPage: 3, recoveredRefreshPage: instance.pageNo })
  })

  test('event ownership, main scroll position, resize and modal controls', async () => {
    const { instance, options, wx } = page(renderer)
    await options.onLoad.call(instance)
    expect(main).toContain('catchscroll="onScroll"')
    instance.onScroll({ detail: { scrollTop: 186 } })
    expect(instance.scrollTop).toBe(186)
    scrollTags.filter(tag => tag.includes('scroll-x')).forEach(tag => {
      expect(tag).toContain('catchscroll="ignoreScroll"')
      expect(tag).toContain('catchscrolltolower="ignoreScroll"')
      expect(tag).not.toMatch(/refresher-enabled|onRefresh|loadMore/)
    })
    instance.ignoreScroll({ detail: { scrollTop: 999, scrollLeft: 240 } })
    expect(instance.scrollTop).toBe(186)
    expect(mainTags).toHaveLength(2)
    expect(scrollTags.filter(tag => tag.includes('refresher-enabled'))).toHaveLength(2)
    const outer = scrollTags.find(tag => tag.includes('type="nested"'))
    expect(outer).not.toMatch(/onRefresh|loadMore|onScroll/)
    wx.getWindowInfo.mockReturnValue({ windowHeight: 600, statusBarHeight: 24 })
    options.onResize.call(instance)
    expect(instance.scrollHeight).toBe(532)
    instance.open()
    expect(instance.opened).toBe(true)
    instance.close()
    expect(instance.opened).toBe(false)
    evidence.push({ renderer, operation: 'main_scroll_and_resize', scrollTop: instance.scrollTop, horizontalIgnored: true, outerNoBusinessBindings: true, resizedScrollHeight: instance.scrollHeight, modalOpenedAndClosed: true })
  })

  test('request serialization and failed pagination retry', async () => {
    const { instance, options, fetchOrders } = page(renderer)
    await options.onLoad.call(instance)
    let release
    fetchOrders.mockImplementationOnce(() => new Promise(resolve => { release = resolve }))
    const pending = instance.loadMore()
    const calls = fetchOrders.mock.calls.length
    await instance.loadMore()
    await instance.onRefresh()
    expect(fetchOrders.mock.calls).toHaveLength(calls)
    release(await realFetch(2))
    await pending
    const before = instance.sections
    fetchOrders.mockRejectedValueOnce(new Error('分页失败'))
    await instance.loadMore()
    expect(instance.pageNo).toBe(2)
    expect(instance.sections).toBe(before)
    expect(instance.loading).toBe(false)
    await instance.loadMore()
    expect(fetchOrders).toHaveBeenLastCalledWith(3)
    expect(instance.pageNo).toBe(3)
    evidence.push({ renderer, operation: 'serialization_and_pagination_failure', duplicateRequestSuppressed: true, pageAfterFailure: 2, pageAfterRetry: 3 })
  })
})
