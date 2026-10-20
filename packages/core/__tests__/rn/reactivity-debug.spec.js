global.__mpx_mode__ = 'ios'
global.__mpx_dynamic_runtime__ = false
global.mpxGlobal = {}
global.__mpxAppDimensionsInfo = { window: { width: 375, height: 667 }, screen: { width: 375, height: 667 } }
global.__mpxPageSizeCountMap = {}

jest.mock('@mpxjs/perf', () => ({}), { virtual: true })
jest.mock('react-native', () => ({}), { virtual: true })
jest.mock('@mpxjs/api-proxy', () => ({ createSelectorQuery: jest.fn(), createIntersectionObserver: jest.fn() }))
jest.mock('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/context', () => {
  const React = require('react')
  return {
    IntersectionObserverContext: React.createContext({}),
    KeyboardAvoidContext: React.createContext(null),
    ProviderContext: React.createContext(null),
    RouteContext: React.createContext({})
  }
}, { virtual: true })
jest.mock('../../src/platform/env/navigationHelper', () => ({ PortalHost: 'PortalHost' }), { virtual: true })
jest.mock('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-nav', () => ({}), { virtual: true })

const React = require('react')
const { create, act } = require('react-test-renderer')
const { ref, computed, onRenderTracked, onRenderTriggered, getCurrentInstance } = require('../../src')
const { getDefaultOptions } = require('../../src/platform/patch/getDefaultOptions.ios')
const mergeOptions = require('../../src/core/mergeOptions').default

describe('Mpx2RN render debugger hooks', () => {
  it.each([false, true])('supports options hooks and composition hooks with a throwing mixin: %s', async (throwInMixin) => {
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {})
    const tracked = jest.fn()
    const triggered = jest.fn()
    const mixinTracked = jest.fn(() => {
      if (throwInMixin) throw new Error('mixin render tracked error')
    })
    const mixinTriggered = jest.fn(() => {
      if (throwInMixin) throw new Error('mixin render triggered error')
    })
    const compositionTracked = jest.fn()
    const compositionTriggered = jest.fn()
    let instance
    const Component = getDefaultOptions({
      type: 'component',
      rawOptions: mergeOptions({
        mpxConvertMode: 'wxToIos',
        data: { count: 0 },
        computed: { doubled () { return this.count * 2 } },
        mixins: [{ renderTracked: mixinTracked, renderTriggered: mixinTriggered }],
        renderTracked: tracked,
        renderTriggered: triggered,
        setup () {
          instance = getCurrentInstance().target
          onRenderTracked(compositionTracked)
          onRenderTriggered(compositionTriggered)
          return {}
        }
      }, 'component', true),
      currentInject: {
        componentsMap: {},
        render (h) { return h('debug-view', null, `${this.count}:${this.doubled}`) }
      }
    })
    let renderer
    act(() => { renderer = create(React.createElement(Component)) })
    expect(renderer.toJSON().children).toEqual(['0:0'])
    expect(tracked).toHaveBeenCalled()
    expect(tracked.mock.contexts.every(context => context === instance)).toBe(true)
    expect(tracked).toHaveBeenCalledTimes(compositionTracked.mock.calls.length)
    expect(mixinTracked.mock.invocationCallOrder[0]).toBeLessThan(tracked.mock.invocationCallOrder[0])
    expect(tracked.mock.invocationCallOrder[0]).toBeLessThan(compositionTracked.mock.invocationCallOrder[0])
    act(() => {
      const proxy = instance.__mpxProxy
      const onStoreChange = proxy.onStoreChange
      const unsubscribe = proxy.subscribe(onStoreChange)
      unsubscribe()
      proxy.subscribe(onStoreChange)
      renderer.update(React.createElement(Component, { extra: 'resubscribe' }))
    })
    expect(tracked).toHaveBeenCalledTimes(compositionTracked.mock.calls.length)
    await act(async () => {
      instance.count = 1
      instance.count = 2
      expect(triggered).toHaveBeenCalledTimes(2)
      expect(compositionTriggered).toHaveBeenCalledTimes(2)
      expect(triggered.mock.contexts).toEqual([instance, instance])
      expect(triggered.mock.calls[0][0]).toBe(compositionTriggered.mock.calls[0][0])
      expect(mixinTriggered.mock.invocationCallOrder[0]).toBeLessThan(triggered.mock.invocationCallOrder[0])
      expect(triggered.mock.invocationCallOrder[0]).toBeLessThan(compositionTriggered.mock.invocationCallOrder[0])
      await Promise.resolve()
    })
    expect(renderer.toJSON().children).toEqual(['2:4'])
    act(() => { renderer.unmount() })
    instance.count++
    expect(triggered).toHaveBeenCalledTimes(2)
    if (throwInMixin) expect(errors).toHaveBeenCalled()
    else expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })

  it('uses the real React render path, batches reactive updates and handles parent-driven renders', async () => {
    const count = ref(0)
    const tracked = jest.fn()
    const triggered = jest.fn()
    const Component = getDefaultOptions({
      type: 'component',
      rawOptions: {
        options: { disableMemo: true },
        setup () {
          onRenderTracked(tracked)
          onRenderTriggered(triggered)
          return { count, doubled: computed(() => count.value * 2) }
        }
      },
      currentInject: {
        componentsMap: {},
        render (h) { return h('debug-view', null, `${this.count}:${this.doubled}`) }
      }
    })
    let renderer
    act(() => { renderer = create(React.createElement(Component)) })
    expect(renderer.toJSON().children).toEqual(['0:0'])
    expect(tracked.mock.calls.some(([event]) => event.target === count)).toBe(true)
    const firstTracks = tracked.mock.calls.length

    await act(async () => {
      count.value = 1
      count.value = 2
      expect(triggered).toHaveBeenCalledTimes(2)
      expect(renderer.toJSON().children).toEqual(['0:0'])
      await Promise.resolve()
    })
    expect(renderer.toJSON().children).toEqual(['2:4'])
    expect(tracked.mock.calls.length).toBeGreaterThan(firstTracks)
    expect(triggered.mock.calls[0][0]).toMatchObject({ target: count, key: 'value', type: 'set' })

    tracked.mockClear()
    act(() => { renderer.update(React.createElement(Component, { extra: 'parent update' })) })
    expect(tracked).toHaveBeenCalled()
    expect(triggered).toHaveBeenCalledTimes(2)
    act(() => { renderer.unmount() })
    count.value++
    expect(triggered).toHaveBeenCalledTimes(2)
  })
})
