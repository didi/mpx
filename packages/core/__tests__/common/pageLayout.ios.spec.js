let mockDimensions
let mockProcessedDimensions
let mockLayoutDimensions

jest.mock('react-native', () => ({
  View: 'View',
  Platform: { OS: 'ios' },
  StatusBar: { currentHeight: 20 },
  Dimensions: {
    get: jest.fn(base => mockDimensions[base]),
    addEventListener: jest.fn()
  }
}), { virtual: true })
jest.mock('../../src/index', () => ({ config: { rnConfig: {} } }))
jest.mock('../../src/core/proxy', () => jest.fn())
jest.mock('../../src/core/mergeOptions', () => jest.fn())
jest.mock('../../src/observer/effect', () => ({ ReactiveEffect: jest.fn() }))
jest.mock('../../src/observer/watch', () => ({ watch: jest.fn() }))
jest.mock('../../src/observer/reactive', () => ({
  reactive: value => value,
  set: (value, key, next) => { value[key] = next },
  del: (value, key) => { delete value[key] }
}))
jest.mock('../../src/observer/ref', () => ({ ref: value => ({ value }) }))
jest.mock('../../src/observer/scheduler', () => ({ queueJob: jest.fn(), hasPendingJob: jest.fn() }))
jest.mock('@mpxjs/utils', () => ({
  hasOwn: (value, key) => Object.prototype.hasOwnProperty.call(value, key),
  error: jest.fn()
}))
jest.mock('@mpxjs/api-proxy', () => ({ createSelectorQuery: jest.fn(), createIntersectionObserver: jest.fn() }))
jest.mock('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/context', () => {
  const React = require('react')
  return {
    IntersectionObserverContext: React.createContext(),
    KeyboardAvoidContext: React.createContext(),
    ProviderContext: React.createContext(),
    RouteContext: React.createContext()
  }
}, { virtual: true })
jest.mock('../../src/platform/env/navigationHelper', () => {
  const React = require('react')
  const Context = React.createContext({ top: 20, bottom: 10, left: 0, right: 0 })
  return {
    Context,
    PortalHost: 'PortalHost',
    useSafeAreaInsets: () => React.useContext(Context),
    initialWindowMetrics: { insets: { top: 20, bottom: 10 } }
  }
}, { virtual: true })
jest.mock('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-nav', () => ({
  useInnerHeaderHeight: () => 44 + require('../../src/platform/env/navigationHelper').useSafeAreaInsets().top
}), { virtual: true })

const React = require('react')
const { act, create } = require('react-test-renderer')
const native = require('react-native')
const { Context } = require('../../src/platform/env/navigationHelper')
const { PageWrapperHOC } = require('../../src/platform/patch/getDefaultOptions.ios')

describe('RN page layout updates on render and native dimensions changes', () => {
  let renderer
  let navigation
  let Page
  let insets

  function resize () {
    const calls = native.Dimensions.addEventListener.mock.calls
    const change = calls[calls.length - 1][1]
    act(() => change(mockDimensions))
  }

  function render () {
    return React.createElement(Context.Provider, { value: insets },
      React.createElement(Page, { navigation, route: { key: 'page', name: 'pages/test' } }))
  }

  beforeEach(() => {
    jest.useFakeTimers()
    native.Dimensions.get.mockClear()
    native.Dimensions.addEventListener.mockClear()
    native.Dimensions.addEventListener.mockReturnValue({ remove: jest.fn() })
    native.Platform.OS = 'ios'
    mockDimensions = {
      window: { width: 360, height: 640 },
      screen: { width: 360, height: 680 }
    }
    mockLayoutDimensions = { width: 360, height: 640 }
    mockProcessedDimensions = mockDimensions
    global.getDimensionsInfo = jest.fn(base => base ? mockProcessedDimensions[base] : mockLayoutDimensions)
    global.mpxGlobal = { __mpx: { config: { rnConfig: {} } } }
    global.__mpxPageConfig = { disableKeyboardAvoiding: true }
    navigation = { isFocused: () => false, addListener: jest.fn(() => jest.fn()) }
    insets = { top: 20, bottom: 10, left: 0, right: 0 }
    Page = PageWrapperHOC(() => null)
    act(() => { renderer = create(render()) })
  })

  afterEach(() => {
    act(() => renderer.unmount())
    jest.clearAllTimers()
    jest.useRealTimers()
    delete global.getDimensionsInfo
  })

  it('updates a plain layout value when the native dimensions event runs', () => {
    expect(navigation.layout).toMatchObject({ width: 360, height: 576, top: 64 })
    mockDimensions = {
      window: { width: 640, height: 360 },
      screen: { width: 680, height: 400 }
    }
    mockProcessedDimensions = mockDimensions
    mockLayoutDimensions = { width: 600, height: 360 }
    expect(navigation.layout).toMatchObject({ width: 360, height: 576, top: 64 })
    resize()
    expect(navigation.layout).toMatchObject({ width: 600, height: 296, top: 64 })
    expect(native.Dimensions.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    expect(Object.getOwnPropertyDescriptor(navigation, 'layout').writable).toBe(true)
  })

  it('uses the latest header height after safe-area changes', () => {
    insets = { top: 0, bottom: 0, left: 0, right: 0 }
    act(() => renderer.update(render()))
    mockLayoutDimensions = { width: 640, height: 360 }
    resize()
    expect(navigation.layout).toMatchObject({ width: 640, height: 316, top: 44 })
    mockLayoutDimensions = { width: 360, height: 640 }
    resize()
    expect(navigation.layout.height).toBe(596)
  })

  it('uses processed Screen and Window values for Android orientation and bottom-bar calculations', () => {
    native.Platform.OS = 'android'
    mockDimensions = {
      window: { width: 1280, height: 696 },
      screen: { width: 1280, height: 720 }
    }
    mockProcessedDimensions = {
      window: { width: 640, height: 348 },
      screen: { width: 640, height: 360 }
    }
    mockLayoutDimensions = mockProcessedDimensions.screen
    resize()

    expect(navigation.layout).toMatchObject({ width: 640, height: 284, bottomVirtualHeight: 12, isLandscape: true })
    expect(native.Dimensions.get).not.toHaveBeenCalled()
    expect(global.getDimensionsInfo).toHaveBeenCalledWith('screen')
    expect(global.getDimensionsInfo).toHaveBeenCalledWith('window')
    expect(global.getDimensionsInfo).toHaveBeenCalledWith()
  })

  it('uses the processed portrait Screen when native Screen still has the previous landscape direction', () => {
    native.Platform.OS = 'android'
    mockDimensions = {
      window: { width: 360, height: 656 },
      screen: { width: 680, height: 360 }
    }
    mockProcessedDimensions = {
      window: { width: 360, height: 656 },
      screen: { width: 180, height: 680 }
    }
    mockLayoutDimensions = mockProcessedDimensions.screen
    resize()

    expect(navigation.layout).toMatchObject({ width: 180, height: 606, bottomVirtualHeight: 10, isLandscape: false })
    expect(mockProcessedDimensions.screen).toEqual({ width: 180, height: 680 })
    expect(native.Dimensions.get).not.toHaveBeenCalled()
  })

  it('uses the processed landscape Screen when native Screen still has the previous portrait direction', () => {
    native.Platform.OS = 'android'
    mockDimensions = {
      window: { width: 680, height: 336 },
      screen: { width: 360, height: 680 }
    }
    mockProcessedDimensions = {
      window: { width: 680, height: 336 },
      screen: { width: 544, height: 360 }
    }
    mockLayoutDimensions = mockProcessedDimensions.screen
    resize()

    expect(navigation.layout).toMatchObject({ width: 544, height: 272, bottomVirtualHeight: 24, isLandscape: true })
    expect(mockProcessedDimensions.screen).toEqual({ width: 544, height: 360 })
    expect(native.Dimensions.get).not.toHaveBeenCalled()
  })

  it('keeps the orientation chosen by custom Screen dimensions', () => {
    native.Platform.OS = 'android'
    mockDimensions = {
      window: { width: 1280, height: 696 },
      screen: { width: 1280, height: 720 }
    }
    mockProcessedDimensions = {
      window: mockDimensions.window,
      screen: { width: 640, height: 720 }
    }
    mockLayoutDimensions = mockProcessedDimensions.screen
    resize()

    expect(navigation.layout).toMatchObject({ width: 640, height: 646, bottomVirtualHeight: 10, isLandscape: false })
    expect(native.Dimensions.get).not.toHaveBeenCalled()
  })

  it('keeps a stable writable layout value until the next dimensions event', () => {
    const descriptor = Object.getOwnPropertyDescriptor(navigation, 'layout')
    expect(descriptor.get).toBeUndefined()
    expect(descriptor.writable).toBe(true)
    const layout = navigation.layout
    expect(navigation.layout).toBe(layout)

    mockLayoutDimensions = { width: 600, height: 360 }
    resize()
    expect(navigation.layout).not.toBe(layout)
    expect(navigation.layout).toMatchObject({ width: 600, height: 296 })
  })

  it('removes the native dimensions subscription when the page unmounts', () => {
    const results = native.Dimensions.addEventListener.mock.results
    const subscription = results[results.length - 1].value
    act(() => renderer.unmount())
    expect(subscription.remove).toHaveBeenCalledTimes(1)
  })
})
