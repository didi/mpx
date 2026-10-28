global.__mpx_mode__ = 'ios'
global.__mpx_dynamic_runtime__ = false
global.mpxGlobal = {}
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
const { ref, onRenderTriggered } = require('../../src')
const { getDefaultOptions } = require('../../src/platform/patch/getDefaultOptions.ios')
const mergeOptions = require('../../src/core/mergeOptions').default

it('connects RN render hooks to initial, reactive and parent renders', async () => {
  const count = ref(0)
  const tracked = jest.fn()
  const triggered = jest.fn()
  const compositionTriggered = jest.fn()
  const Component = getDefaultOptions({
    type: 'component',
    rawOptions: mergeOptions({
      mpxConvertMode: 'wxToIos',
      options: { disableMemo: true },
      renderTracked: tracked,
      renderTriggered: triggered,
      setup () {
        onRenderTriggered(compositionTriggered)
        return { count }
      }
    }, 'component', true),
    currentInject: {
      componentsMap: {},
      render (h) { return h('debug-view', null, String(this.count)) }
    }
  })
  let renderer
  act(() => { renderer = create(React.createElement(Component)) })
  expect(renderer.toJSON().children).toEqual(['0'])
  expect(tracked.mock.calls.some(([event]) => event.target === count)).toBe(true)
  await act(async () => {
    count.value = 1
    await Promise.resolve()
  })
  expect(renderer.toJSON().children).toEqual(['1'])
  expect(triggered).toHaveBeenCalledTimes(1)
  expect(compositionTriggered).toHaveBeenCalledTimes(1)
  tracked.mockClear()
  act(() => { renderer.update(React.createElement(Component, { extra: 'parent update' })) })
  expect(tracked).toHaveBeenCalled()
  act(() => { renderer.unmount() })
})
