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
const { ref, computed, onRenderTracked, onRenderTriggered } = require('../../src')
const { getDefaultOptions } = require('../../src/platform/patch/getDefaultOptions.ios')

describe('Mpx2RN render debugger hooks', () => {
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
