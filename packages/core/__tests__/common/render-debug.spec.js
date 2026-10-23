global.__mpx_mode__ = 'wx'
global.__mpx_dynamic_runtime__ = false
global.mpxGlobal = {}
global.wx = {}

jest.mock('@mpxjs/perf', () => ({}), { virtual: true })

const { default: Mpx, ref, computed, onRenderTracked, onRenderTriggered, nextTick, getCurrentScope } = require('../../src')
const { default: MpxProxy, setCurrentInstance, unsetCurrentInstance, getCurrentInstance } = require('../../src/core/proxy')
const { renderHelperDefs } = require('../../src/platform/builtInMixins/renderHelperMixin')
const mergeOptions = require('../../src/core/mergeOptions').default

function createComponent (options) {
  const target = Object.assign({
    data: {},
    __getProps: () => ({}),
    getPageId: () => 'debug-page',
    selectComponent: jest.fn(),
    selectAllComponents: jest.fn(),
    createSelectorQuery: jest.fn(),
    createIntersectionObserver: jest.fn(),
    __render: jest.fn(),
    __injectedRender: jest.fn(function (_i, _c, _r, _sc) {
      _sc('count')
      _sc('doubled')
      _r()
    })
  }, renderHelperDefs)
  const proxy = new MpxProxy(mergeOptions(mergeOptions(options, 'component', true), 'component', false), target)
  target.__mpxProxy = proxy
  proxy.created()
  proxy.mounted()
  return proxy
}

it('drives options and composition render hooks while batching updates and stopping on unmount', async () => {
  const count = ref(0)
  const diagnostic = ref(0)
  const tracked = jest.fn(function () {
    Number(diagnostic.value)
    return [getCurrentInstance(), getCurrentScope()]
  })
  const triggered = jest.fn()
  const mixinTracked = jest.fn()
  const compositionTracked = jest.fn()
  const compositionTriggered = jest.fn()
  const proxy = createComponent({
    mixins: [{ renderTracked: mixinTracked }],
    renderTracked: tracked,
    renderTriggered: triggered,
    setup () {
      onRenderTracked(compositionTracked)
      onRenderTriggered(compositionTriggered)
      return { count, doubled: computed(() => count.value * 2) }
    }
  })
  expect(tracked).toHaveBeenCalled()
  expect(tracked.mock.contexts.every(context => context === proxy.target)).toBe(true)
  expect(tracked.mock.results.every(({ value }) => value[0] === proxy && value[1] === proxy.scope)).toBe(true)
  expect(compositionTracked.mock.calls.some(([event]) => event.target === count)).toBe(true)
  expect(mixinTracked.mock.invocationCallOrder[0]).toBeLessThan(tracked.mock.invocationCallOrder[0])
  expect(tracked.mock.invocationCallOrder[0]).toBeLessThan(compositionTracked.mock.invocationCallOrder[0])
  count.value = 1
  count.value = 2
  expect(triggered).toHaveBeenCalledTimes(2)
  expect(triggered.mock.calls[0][0]).toBe(compositionTriggered.mock.calls[0][0])
  expect(proxy.target.__injectedRender).toHaveBeenCalledTimes(1)
  await nextTick()
  expect(proxy.target.__render.mock.calls.at(-1)[0]).toEqual({ count: 2, doubled: 4 })
  diagnostic.value++
  await nextTick()
  expect(proxy.target.__injectedRender).toHaveBeenCalledTimes(2)
  proxy.unmounted()
  count.value++
  expect(triggered).toHaveBeenCalledTimes(2)
})

it('uses lifecycle error handling and restores the enclosing instance and scope', () => {
  const errors = jest.spyOn(console, 'error').mockImplementation(() => {})
  const skipped = jest.fn()
  let owner
  const composition = jest.fn(() => {
    owner = [getCurrentInstance(), getCurrentScope()]
    throw new Error('composition hook error')
  })
  const proxy = createComponent({
    data: { count: 0 },
    computed: { doubled () { return this.count * 2 } },
    mixins: [{ renderTriggered () { throw new Error('mixin hook error') } }],
    renderTriggered: skipped
  })
  const enclosing = new MpxProxy({}, {})
  setCurrentInstance(enclosing)
  onRenderTriggered(composition, proxy)
  proxy.target.count++
  expect(skipped).not.toHaveBeenCalled()
  expect(composition).toHaveBeenCalledTimes(1)
  expect(owner).toEqual([proxy, proxy.scope])
  expect(errors).toHaveBeenCalled()
  expect(getCurrentInstance()).toBe(enclosing)
  expect(getCurrentScope()).toBe(enclosing.scope)
  const previousErrorHandler = Mpx.config.errorHandler
  Mpx.config.errorHandler = () => { throw new Error('error handler failed') }
  try {
    ;[() => proxy.callHook('renderTriggered'), () => proxy.hooks.renderTriggered[0]()].forEach(invoke => {
      expect(invoke).toThrow('error handler failed')
      expect(getCurrentInstance()).toBe(enclosing)
      expect(getCurrentScope()).toBe(enclosing.scope)
    })
  } finally {
    Mpx.config.errorHandler = previousErrorHandler
  }
  unsetCurrentInstance()
  proxy.unmounted()
  enclosing.unmounted()
  errors.mockRestore()
})
