global.__mpx_mode__ = 'wx'
global.__mpx_dynamic_runtime__ = false
global.mpxGlobal = {}
global.wx = {}

jest.mock('@mpxjs/perf', () => ({}), { virtual: true })

const { ref, computed, onRenderTracked, onRenderTriggered, nextTick, getCurrentScope } = require('../../src')
const { default: MpxProxy, setCurrentInstance, unsetCurrentInstance, getCurrentInstance } = require('../../src/core/proxy')
const { renderHelperDefs } = require('../../src/platform/builtInMixins/renderHelperMixin')
const mergeOptions = require('../../src/core/mergeOptions').default

function createComponent (setup, options = {}, type = 'component') {
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
  const rawOptions = mergeOptions(Object.assign({ setup }, options), type, true)
  const proxy = new MpxProxy(mergeOptions(rawOptions, type, false), target)
  target.__mpxProxy = proxy
  proxy.created()
  proxy.mounted()
  return proxy
}

describe('mini program render debugger hooks', () => {
  it.each(['page', 'component'])('supports options hooks and mixins without setup in a %s', async (type) => {
    const diagnostic = ref(0)
    const mixinTracked = jest.fn()
    const mixinTriggered = jest.fn()
    const tracked = jest.fn(function () {
      Number(diagnostic.value)
      return [getCurrentInstance(), getCurrentScope()]
    })
    const triggered = jest.fn(function () {
      Number(diagnostic.value)
      return [getCurrentInstance(), getCurrentScope()]
    })
    const proxy = createComponent(undefined, {
      data: { count: 0 },
      computed: { doubled () { return this.count * 2 } },
      mixins: [{ renderTracked: mixinTracked, renderTriggered: mixinTriggered }],
      renderTracked: tracked,
      renderTriggered: triggered
    }, type)
    expect(tracked).toHaveBeenCalled()
    expect(tracked.mock.contexts.every(context => context === proxy.target)).toBe(true)
    expect(tracked.mock.results.every(result => result.value[0] === proxy && result.value[1] === proxy.scope)).toBe(true)
    expect(mixinTracked.mock.invocationCallOrder[0]).toBeLessThan(tracked.mock.invocationCallOrder[0])
    proxy.target.count = 1
    proxy.target.count = 2
    expect(triggered).toHaveBeenCalledTimes(2)
    expect(triggered.mock.contexts).toEqual([proxy.target, proxy.target])
    expect(triggered.mock.results[0].value).toEqual([proxy, proxy.scope])
    expect(mixinTriggered.mock.invocationCallOrder[0]).toBeLessThan(triggered.mock.invocationCallOrder[0])
    expect(mixinTriggered.mock.calls[0][0]).toMatchObject({ effect: proxy.effect, key: 'count', type: 'set' })
    expect(proxy.target.__injectedRender).toHaveBeenCalledTimes(1)
    await nextTick()
    expect(proxy.target.__injectedRender).toHaveBeenCalledTimes(2)
    expect(proxy.target.__render.mock.calls.at(-1)[0]).toEqual({ count: 2, doubled: 4 })
    diagnostic.value++
    await nextTick()
    expect(proxy.target.__injectedRender).toHaveBeenCalledTimes(2)
    expect(triggered).toHaveBeenCalledTimes(2)
    proxy.unmounted()
    proxy.target.count++
    expect(triggered).toHaveBeenCalledTimes(2)
  })

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

  it('keeps composition hooks and restores context when an options hook throws', () => {
    const count = ref(0)
    const tracked = jest.fn()
    const triggered = jest.fn()
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {})
    let owner
    const mixinTriggered = jest.fn(() => { throw new Error('mixin render debug hook error') })
    const mixinTracked = jest.fn(() => { throw new Error('mixin render debug hook error') })
    const optionTriggered = jest.fn(function () {
      owner = [this, getCurrentInstance(), getCurrentScope()]
      throw new Error('options render debug hook error')
    })
    const optionTracked = jest.fn()
    const proxy = createComponent(() => {
      onRenderTracked(tracked)
      onRenderTriggered(triggered)
      return { count, doubled: computed(() => count.value * 2) }
    }, {
      mixins: [{ renderTracked: mixinTracked, renderTriggered: mixinTriggered }],
      renderTracked: optionTracked,
      renderTriggered: optionTriggered
    })
    expect(optionTracked).toHaveBeenCalledTimes(tracked.mock.calls.length)
    expect(mixinTracked.mock.invocationCallOrder[0]).toBeLessThan(optionTracked.mock.invocationCallOrder[0])
    expect(optionTracked.mock.invocationCallOrder[0]).toBeLessThan(tracked.mock.invocationCallOrder[0])
    const enclosing = new MpxProxy({}, {})
    setCurrentInstance(enclosing)
    count.value++
    expect(owner).toEqual([proxy.target, proxy, proxy.scope])
    expect(optionTriggered).toHaveBeenCalledTimes(1)
    expect(triggered).toHaveBeenCalledTimes(1)
    expect(mixinTriggered).toHaveBeenCalledTimes(1)
    expect(mixinTriggered.mock.invocationCallOrder[0]).toBeLessThan(optionTriggered.mock.invocationCallOrder[0])
    expect(optionTriggered.mock.invocationCallOrder[0]).toBeLessThan(triggered.mock.invocationCallOrder[0])
    expect(optionTriggered.mock.calls[0][0]).toBe(triggered.mock.calls[0][0])
    expect(getCurrentInstance()).toBe(enclosing)
    expect(getCurrentScope()).toBe(enclosing.scope)
    expect(errors).toHaveBeenCalled()
    unsetCurrentInstance()
    proxy.unmounted()
    enclosing.unmounted()
    errors.mockRestore()
  })
})
