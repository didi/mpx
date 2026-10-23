global.__mpx_mode__ = 'ios'
global.__mpx_dynamic_runtime__ = false
global.mpxGlobal = {}
global.__mpxAppDimensionsInfo = { window: { width: 375, height: 667 }, screen: { width: 375, height: 667 } }
global.__mpxPageSizeCountMap = {}

jest.mock('@mpxjs/perf', () => ({}), { virtual: true })
jest.mock('react-native', () => ({
  Dimensions: { get: () => ({ width: 375, height: 667 }) }
}), { virtual: true })
jest.mock('@mpxjs/api-proxy', () => ({ createSelectorQuery: jest.fn(), createIntersectionObserver: jest.fn() }))
jest.mock('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/context', () => {
  const React = require('react')
  return {
    IntersectionObserverContext: React.createContext({}),
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

it('drives RN render hooks through initial, reactive and parent renders, then stops on unmount', async () => {
  const count = ref(0)
  const tracked = jest.fn()
  const triggered = jest.fn()
  const mixinTriggered = jest.fn()
  const compositionTriggered = jest.fn()
  let instance
  const Component = getDefaultOptions({
    type: 'component',
    rawOptions: mergeOptions({
      mpxConvertMode: 'wxToIos',
      options: { disableMemo: true },
      mixins: [{ renderTriggered: mixinTriggered }],
      renderTracked: tracked,
      renderTriggered: triggered,
      setup () {
        instance = getCurrentInstance().target
        onRenderTracked(tracked)
        onRenderTriggered(compositionTriggered)
        return { count, doubled: computed(() => count.value * 2) }
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
  expect(tracked.mock.calls.some(([event]) => event.target === count)).toBe(true)
  await act(async () => {
    count.value = 1
    count.value = 2
    expect(triggered).toHaveBeenCalledTimes(2)
    expect(triggered.mock.contexts).toEqual([instance, instance])
    expect(triggered.mock.calls[0][0]).toBe(compositionTriggered.mock.calls[0][0])
    expect(mixinTriggered.mock.invocationCallOrder[0]).toBeLessThan(triggered.mock.invocationCallOrder[0])
    expect(triggered.mock.invocationCallOrder[0]).toBeLessThan(compositionTriggered.mock.invocationCallOrder[0])
    expect(renderer.toJSON().children).toEqual(['0:0'])
    await Promise.resolve()
  })
  expect(renderer.toJSON().children).toEqual(['2:4'])
  tracked.mockClear()
  act(() => { renderer.update(React.createElement(Component, { extra: 'parent update' })) })
  expect(tracked).toHaveBeenCalled()
  act(() => { renderer.unmount() })
  count.value++
  expect(triggered).toHaveBeenCalledTimes(2)
})
