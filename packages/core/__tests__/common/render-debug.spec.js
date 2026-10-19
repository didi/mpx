global.__mpx_mode__ = 'wx'
global.__mpx_dynamic_runtime__ = false
global.mpxGlobal = {}
global.wx = {}

jest.mock('@mpxjs/perf', () => ({}), { virtual: true })

const { ref, computed, onRenderTracked, onRenderTriggered, nextTick, getCurrentScope } = require('../../src')
const { default: MpxProxy, setCurrentInstance, unsetCurrentInstance, getCurrentInstance } = require('../../src/core/proxy')
const { renderHelperDefs } = require('../../src/platform/builtInMixins/renderHelperMixin')

function createComponent (setup) {
  const target = Object.assign({
    data: {},
    __getProps: () => ({}),
    getPageId: () => 'debug-page',
    selectComponent: jest.fn(),
    selectAllComponents: jest.fn(),
    createSelectorQuery: jest.fn(),
    createIntersectionObserver: jest.fn()
  }, renderHelperDefs)
  target.__render = jest.fn()
  target.__injectedRender = jest.fn(function (_i, _c, _r, _sc) {
    _sc('count')
    _sc('doubled')
    _r()
  })
  const proxy = new MpxProxy({ setup }, target)
  target.__mpxProxy = proxy
  proxy.created()
  proxy.mounted()
  return proxy
}

describe('mini program render debugger hooks', () => {
  it('tracks the first render and notifies synchronously while batching the render job', async () => {
    const count = ref(0)
    const tracked = jest.fn()
    const triggered = jest.fn()
    const proxy = createComponent(() => {
      onRenderTracked(tracked)
      onRenderTriggered(triggered)
      return { count, doubled: computed(() => count.value * 2) }
    })
    expect(tracked.mock.calls.map(([event]) => event.target)).toContain(count)
    expect(proxy.target.__injectedRender).toHaveBeenCalledTimes(1)
    count.value = 1
    count.value = 2
    expect(triggered).toHaveBeenCalledTimes(2)
    expect(proxy.target.__injectedRender).toHaveBeenCalledTimes(1)
    await nextTick()
    expect(proxy.target.__injectedRender).toHaveBeenCalledTimes(2)
    expect(proxy.target.__render.mock.calls.at(-1)[0]).toEqual({ count: 2, doubled: 4 })
    expect(proxy.target.__injectedRender.mock.results.every(result => result.type === 'return')).toBe(true)
    proxy.unmounted()
    count.value++
    expect(triggered).toHaveBeenCalledTimes(2)
  })

  it('restores an enclosing instance and scope even when a component debug hook throws', () => {
    const count = ref(0)
    const diagnostic = ref(0)
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {})
    let owner
    const proxy = createComponent(() => {
      onRenderTracked(() => { Number(diagnostic.value) })
      onRenderTriggered(() => {
        owner = [getCurrentInstance(), getCurrentScope()]
        Number(diagnostic.value)
        throw new Error('component debug hook error')
      })
      return { count, doubled: computed(() => count.value * 2) }
    })
    const enclosing = new MpxProxy({}, {})
    setCurrentInstance(enclosing)
    count.value++
    expect(owner).toEqual([proxy, proxy.scope])
    expect(getCurrentInstance()).toBe(enclosing)
    expect(getCurrentScope()).toBe(enclosing.scope)
    unsetCurrentInstance()
    const calls = proxy.target.__injectedRender.mock.calls.length
    diagnostic.value++
    expect(proxy.target.__injectedRender).toHaveBeenCalledTimes(calls)
    expect(errors).toHaveBeenCalled()
    proxy.unmounted()
    enclosing.unmounted()
    errors.mockRestore()
  })
})
