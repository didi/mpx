let mockNativeDimensions
let mockInsets
let mockNavigation
let mockHeaderHeight
const mockListeners = []

jest.mock('react-native', () => ({
  View: 'View',
  StyleSheet: { hairlineWidth: 0.5 },
  StatusBar: { get currentHeight () { return global.__mpx_mode__ === 'android' ? 24 : 0 } },
  PixelRatio: { get: () => 3 },
  Platform: { get OS () { return global.__mpx_mode__ } },
  Dimensions: {
    get: base => mockNativeDimensions[base],
    addEventListener: (type, cb) => {
      mockListeners.push(cb)
      return {
        remove: () => {
          const index = mockListeners.indexOf(cb)
          if (index > -1) mockListeners.splice(index, 1)
        }
      }
    }
  }
}), { virtual: true })
jest.mock('../../src/index', () => ({
  __esModule: true,
  default: { config: { rnConfig: {} } }
}))
jest.mock('@mpxjs/utils', () => Object.assign({}, jest.requireActual('@mpxjs/utils'), {
  getFocusedNavigation: () => mockNavigation,
  setFocusedNavigation: navigation => { mockNavigation = navigation }
}))
jest.mock('@mpxjs/perf', () => ({ scopeStart: jest.fn(), scopeEnd: jest.fn() }))
jest.mock('../../../api-proxy/src/common/js', () => ({
  getFocusedNavigation: () => mockNavigation
}))
jest.mock('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/context', () => {
  const React = require('react')
  return {
    IntersectionObserverContext: React.createContext(),
    KeyboardAvoidContext: React.createContext(),
    RouteContext: React.createContext()
  }
}, { virtual: true })
jest.mock('../../src/platform/env/navigationHelper', () => ({
  GestureHandlerRootView: 'GestureHandlerRootView',
  PortalHost: 'PortalHost',
  useSafeAreaInsets: () => mockInsets,
  initialWindowMetrics: { insets: { top: 24, bottom: 24, left: 0, right: 0 } }
}), { virtual: true })
jest.mock('react-native-safe-area-context', () => ({
  initialWindowMetrics: { insets: { top: 24, bottom: 24, left: 0, right: 0 } }
}), { virtual: true })
jest.mock('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-nav', () => ({
  __esModule: true,
  default: () => null,
  useInnerHeaderHeight: () => mockHeaderHeight
}), { virtual: true })

let React, act, create, pageWrapperHOC, getWindowInfo, onWindowResize, offWindowResize
const mountedPages = []
function mountPage (key = String(mountedPages.length)) {
  const Page = pageWrapperHOC(() => null, { disableKeyboardAvoiding: true })
  mockNavigation = {}
  const navigation = mockNavigation
  const props = { navigation, route: { key } }
  let renderer
  act(() => { renderer = create(React.createElement(Page, props)) })
  const page = { navigation, renderer, Page, props }
  mountedPages.push(page)
  return page
}
function emit (value) {
  mockNativeDimensions = value
  act(() => mockListeners.slice().forEach(cb => cb(value)))
}

beforeEach(() => {
  jest.resetModules()
  mockListeners.length = 0
  global.__mpx_mode__ = 'ios'
  global.__mpx_perf__ = false
  global.__mpx_perf_framework__ = false
  global.__mpxPagesMap = {}
  global.__mpxPageStatusMap = {}
  global.__classCaches = []
  global.__mpxAppHotLaunched = true
  global.__mpxPageConfig = {}
  delete global.__mpxWindowResizeHandler
  mockNavigation = undefined
  mockHeaderHeight = 44
  mockInsets = { top: 0, bottom: 0, left: 0, right: 0 }
  mockNativeDimensions = { window: { width: 390, height: 844 }, screen: { width: 390, height: 844 } }
  React = require('react')
  ;({ act, create } = require('react-test-renderer'))
  global.mpxGlobal = { __mpx: require('../../src/index').default }
  require('../../src/platform/builtInMixins/styleHelperMixin.ios')
  ;({ pageWrapperHOC } = require('../../src/platform/patch/pageWrapperHOC.ios'))
  ;({ getWindowInfo } = require('../../../api-proxy/src/platform/api/system/rnSystem'))
  ;({ onWindowResize, offWindowResize } = require('../../../api-proxy/src/platform/api/window/rnWindow'))
})
afterEach(() => {
  act(() => mountedPages.forEach(page => page.renderer.unmount()))
  mountedPages.length = 0
  offWindowResize()
})

test('resize callback reads the current page layout after native rotation', () => {
  mountPage()
  let infoAtResize
  onWindowResize(() => { infoAtResize = getWindowInfo() })
  emit({ window: { width: 844, height: 390 }, screen: { width: 844, height: 390 } })
  expect(mockNavigation.layout).toMatchObject({ width: 844, height: 346 })
  expect(infoAtResize).toMatchObject({ windowWidth: 844, windowHeight: 346 })
})

test('the first native resize reaches a listener registered before any size read', () => {
  const listener = jest.fn()
  onWindowResize(listener)
  emit({ window: { width: 844, height: 390 }, screen: { width: 844, height: 390 } })
  expect(listener).toHaveBeenCalledWith({ size: { windowWidth: 844, windowHeight: 390 } })
})

test('updates all mounted page layouts before synchronous page resize watchers', () => {
  const first = mountPage()
  const second = mountPage()
  const { reactive } = require('../../src/observer/reactive')
  const { watch } = require('../../src/observer/watch')
  global.__mpxPageStatusMap = reactive({ [second.navigation.pageId]: 'show' })
  const resize = jest.fn(() => {
    expect(first.navigation.layout).toMatchObject({ width: 844, height: 346 })
    expect(getWindowInfo()).toMatchObject({ windowWidth: 844, windowHeight: 346 })
  })
  const stop = watch(() => global.__mpxPageStatusMap[second.navigation.pageId], resize, { sync: true })
  emit({ window: { width: 844, height: 390 }, screen: { width: 844, height: 390 } })
  expect(resize).toHaveBeenCalledTimes(1)
  stop()
})

test('updates layout for a window-only change under the screen base without a resize callback', () => {
  require('../../src/index').default.config.rnConfig.dimensionsBase = 'screen'
  mountPage()
  const resize = jest.fn()
  onWindowResize(resize)
  emit({ window: { width: 844, height: 390 }, screen: { width: 390, height: 844 } })
  expect(mockNavigation.layout).toMatchObject({ width: 844, height: 346 })
  expect(resize).not.toHaveBeenCalled()
  expect(global.__mpxSizeCount).toBe(0)
})

test('unsubscribes an unmounted page and keeps the remaining page current', () => {
  const first = mountPage()
  const second = mountPage()
  act(() => first.renderer.unmount())
  const firstLayout = first.navigation.layout
  const resize = jest.fn(() => {
    expect(second.navigation.layout).toMatchObject({ width: 844, height: 346 })
  })
  onWindowResize(resize)
  emit({ window: { width: 844, height: 390 }, screen: { width: 844, height: 390 } })
  expect(first.navigation.layout).toBe(firstLayout)
  expect(resize).toHaveBeenCalledTimes(1)
  // Only the shared style helper subscribes to native Dimensions events.
  expect(mockListeners.length).toBe(1)
})

test('uses the latest header height after a page update', () => {
  const page = mountPage()
  mockHeaderHeight = 88
  act(() => page.renderer.update(React.createElement(page.Page, page.props)))
  expect(mockNavigation.layout.height).toBe(756)
  const resize = jest.fn(() => {
    expect(getWindowInfo().windowHeight).toBe(302)
  })
  onWindowResize(resize)
  emit({ window: { width: 844, height: 390 }, screen: { width: 844, height: 390 } })
  expect(resize).toHaveBeenCalledTimes(1)
  expect(mockListeners.length).toBe(1)
})

test.each(['window', 'screen'])('initializes custom %s dimensions on subscription and delivers only real changes', base => {
  require('../../src/index').default.config.rnConfig = {
    dimensionsBase: base,
    customDimensions: dimensions => ({
      window: Object.assign({}, dimensions.window, { width: dimensions.window.width / 2 }),
      screen: Object.assign({}, dimensions.screen, { width: dimensions.screen.width / 2 })
    })
  }
  const resize = jest.fn()
  onWindowResize(resize)
  expect(resize).not.toHaveBeenCalled()
  const dimensions = { window: { width: 800, height: 400 }, screen: { width: 1000, height: 500 } }
  emit(dimensions)
  emit(dimensions)
  expect(resize).toHaveBeenCalledTimes(1)
  expect(resize).toHaveBeenCalledWith({
    size: {
      windowWidth: base === 'window' ? 400 : 500,
      windowHeight: base === 'window' ? 400 : 500
    }
  })
})
