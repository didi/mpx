global.__mpx_mode__ = 'wx'
global.__mpx_dynamic_runtime__ = false
global.mpxGlobal = {}
global.wx = {}

jest.mock('@mpxjs/perf', () => ({}), { virtual: true })
jest.mock('../../src/platform/patch/lifecycle/index', () => {
  return jest.requireActual(`../../src/platform/patch/lifecycle/index.${global.__mpx_mode__}`)
})

const {
  default: Mpx, reactive, ref, shallowRef, customRef, toRef, triggerRef,
  computed, watch, watchEffect, nextTick, set, del,
  onRenderTracked, onRenderTriggered, getCurrentScope
} = require('../../src')
const { ReactiveEffect } = require('../../src/observer/effect')
const { default: MpxProxy, setCurrentInstance, unsetCurrentInstance, getCurrentInstance } = require('../../src/core/proxy')
const { renderHelperDefs } = require('../../src/platform/builtInMixins/renderHelperMixin')
const mergeOptions = require('../../src/core/mergeOptions').default

function observe (getter, onTrack = jest.fn(), onTrigger = jest.fn()) {
  const effect = new ReactiveEffect(getter)
  Object.assign(effect, { onTrack, onTrigger })
  effect.run()
  return { effect, onTrack, onTrigger }
}

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

describe('reactivity debugger events', () => {
  it('reports reads and synchronous notifications before the watch callback', () => {
    const state = reactive({ count: 0 })
    const order = []
    const onTrack = jest.fn()
    const onTrigger = jest.fn(event => order.push(['trigger', event.newValue]))
    const stop = watch(() => state.count, value => order.push(['callback', value]), { flush: 'sync', onTrack, onTrigger })

    expect(onTrack.mock.calls[0][0]).toMatchObject({ target: state, type: 'get', key: 'count' })
    state.count = 1
    expect(onTrigger.mock.calls[0][0]).toMatchObject({
      target: state, type: 'set', key: 'count', oldValue: 0, newValue: 1
    })
    expect(onTrigger.mock.calls[0][0].effect).toBe(onTrack.mock.calls[0][0].effect)
    expect(order).toEqual([['trigger', 1], ['callback', 1]])
    stop()
    state.count = 2
    expect(onTrigger).toHaveBeenCalledTimes(1)
  })

  it.each([ref, shallowRef])('uses the public ref identity for value events', (createRef) => {
    const count = createRef(0)
    const { effect, onTrack, onTrigger } = observe(() => count.value)
    expect(onTrack.mock.calls[0][0]).toMatchObject({ target: count, key: 'value', type: 'get' })
    count.value = 1
    expect(onTrigger.mock.calls[0][0]).toMatchObject({
      target: count, key: 'value', type: 'set', oldValue: 0, newValue: 1
    })
    effect.stop()
  })

  it('preserves the source property target of toRef and nested ref values', () => {
    const source = reactive({ count: 0 })
    const count = toRef(source, 'count')
    const first = observe(() => count.value)
    expect(first.onTrack.mock.calls[0][0].target).toBe(source)
    count.value++
    expect(first.onTrigger.mock.calls[0][0]).toMatchObject({ target: source, key: 'count' })
    first.effect.stop()

    const nested = ref({ name: 'first' })
    const second = observe(() => nested.value.name)
    expect(second.onTrack.mock.calls.map(([event]) => [event.target, event.key])).toEqual([
      [nested, 'value'], [nested.value, 'name']
    ])
    nested.value.name = 'second'
    expect(second.onTrigger.mock.calls[0][0].target).toBe(nested.value)
    second.effect.stop()
  })

  it('normalizes customRef and explicit shallowRef triggering without synthetic values', () => {
    let value = 0
    const custom = customRef((track, trigger) => ({
      get () { track(); return value },
      set (next) { value = next; trigger() }
    }))
    const first = observe(() => custom.value)
    expect(first.onTrack.mock.calls[0][0].target).toBe(custom)
    custom.value = 10
    expect(first.onTrigger.mock.calls[0][0]).toMatchObject({ target: custom, type: 'set', key: 'value' })
    expect(first.onTrigger.mock.calls[0][0]).not.toHaveProperty('newValue')
    expect(first.onTrigger.mock.calls[0][0]).not.toHaveProperty('oldValue')
    first.effect.stop()

    const shallow = shallowRef({ count: 0 })
    const second = observe(() => shallow.value)
    shallow.value.count++
    expect(second.onTrigger).not.toHaveBeenCalled()
    triggerRef(shallow)
    expect(second.onTrigger.mock.calls[0][0]).toMatchObject({ target: shallow, type: 'set', key: 'value' })
    expect(second.onTrigger.mock.calls[0][0]).not.toHaveProperty('newValue')
    second.effect.stop()
  })

  it('reports property additions, deletions and array mutation methods on existing deps', () => {
    const state = reactive({ object: {}, list: [] })
    const object = state.object
    const list = state.list
    const first = observe(() => state.object)
    set(object, 'name', 'Mpx')
    expect(first.onTrigger.mock.calls[0][0]).toMatchObject({
      target: object, type: 'add', key: 'name', newValue: 'Mpx'
    })
    del(object, 'name')
    expect(first.onTrigger.mock.calls[1][0]).toMatchObject({ target: object, type: 'delete', key: 'name' })
    expect(first.onTrigger.mock.calls[1][0]).not.toHaveProperty('oldValue')
    first.effect.stop()

    const second = observe(() => state.list)
    list.push('first')
    expect(second.onTrigger.mock.calls.map(([event]) => [event.target, event.type, event.key])).toEqual([
      [list, 'array mutation', 'push']
    ])
    second.effect.stop()
  })

  it('forwards computed and watchEffect debug events without changing caching or scheduling', async () => {
    const count = ref(0)
    const getter = jest.fn(() => count.value * 2)
    const onTrack = jest.fn()
    const onTrigger = jest.fn()
    const tracked = jest.fn()
    const triggered = jest.fn()
    const doubled = computed(getter, { onTrack, onTrigger })
    const stop = watchEffect(() => doubled.value, { onTrack: tracked, onTrigger: triggered })
    expect(onTrack.mock.calls[0][0]).toMatchObject({ target: count, type: 'get', key: 'value' })
    expect(tracked.mock.calls[0][0]).toMatchObject({ target: doubled, type: 'get', key: 'value' })
    expect(tracked).toHaveBeenCalledTimes(1)
    expect(doubled.value).toBe(0)
    expect(getter).toHaveBeenCalledTimes(1)
    count.value = 2
    expect(onTrigger.mock.calls[0][0].target).toBe(count)
    expect(triggered.mock.calls[0][0].target).toBe(count)
    expect(getter).toHaveBeenCalledTimes(1)
    await nextTick()
    expect(doubled.value).toBe(4)
    expect(getter).toHaveBeenCalledTimes(2)
    stop()
  })

  it('does not collect properties read by a debugger callback and restores tracking after errors', () => {
    const state = reactive({ count: 0, diagnostic: 0 })
    const error = jest.spyOn(console, 'error').mockImplementation(() => {})
    const getter = jest.fn(() => state.count)
    const { effect } = observe(getter, () => {
      Number(state.diagnostic)
      throw new Error('debug callback error')
    }, () => { Number(state.diagnostic) })
    state.diagnostic++
    expect(getter).toHaveBeenCalledTimes(1)
    state.count++
    expect(getter).toHaveBeenCalledTimes(2)
    expect(effect.deps).toHaveLength(1)
    expect(error).toHaveBeenCalled()
    effect.stop()
    error.mockRestore()
  })
})

describe('render debugger hooks', () => {
  it('drives options and composition render hooks while batching updates and stopping on unmount', async () => {
    const count = ref(0)
    const tracked = jest.fn(function () {
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
})

it.each([['ali', 'wxToAli'], ['swan', 'wxToSwan']])('merges render hooks across %s conversion', (mode, convertMode) => {
  const previousMode = global.__mpx_mode__
  global.__mpx_mode__ = mode
  try {
    jest.isolateModules(() => {
      const mergeOptions = require('../../src/core/mergeOptions').default
      const calls = []
      const options = {
        mpxConvertMode: convertMode,
        mixins: [{ renderTracked (event) { calls.push(['mixin', this, event]) } }],
        renderTracked (event) { calls.push(['component', this, event]) }
      }
      const merged = mergeOptions(mergeOptions(options, 'component', true), 'component', false)
      const target = {}
      const event = {}
      merged.renderTracked.call(target, event)
      expect(calls).toEqual([['mixin', target, event], ['component', target, event]])
      expect(merged.methods?.renderTracked).toBeUndefined()
    })
  } finally {
    global.__mpx_mode__ = previousMode
  }
})

it('ignores production debug hooks without changing reactive updates', () => {
  const previousEnv = process.env.NODE_ENV
  const previousMpx = mpxGlobal.__mpx
  const previousGlobalMpx = global.__mpx
  process.env.NODE_ENV = 'production'
  try {
    jest.isolateModules(() => {
      const { ref, computed, watchEffect, onRenderTracked, onRenderTriggered } = require('../../src')
      const onTrack = jest.fn()
      const onTrigger = jest.fn()
      const instance = { hooks: {} }
      onRenderTracked(onTrack, instance)
      onRenderTriggered(onTrigger, instance)
      const count = ref(0)
      const doubled = computed(() => count.value * 2, { onTrack, onTrigger })
      const getter = jest.fn(() => doubled.value)
      const stop = watchEffect(getter, { flush: 'sync', onTrack, onTrigger })
      count.value++
      expect(getter).toHaveBeenCalledTimes(2)
      expect(doubled.value).toBe(2)
      expect(instance.hooks).toEqual({})
      expect(onTrack).not.toHaveBeenCalled()
      expect(onTrigger).not.toHaveBeenCalled()
      stop()
    })
  } finally {
    process.env.NODE_ENV = previousEnv
    mpxGlobal.__mpx = previousMpx
    global.__mpx = previousGlobalMpx
  }
})
