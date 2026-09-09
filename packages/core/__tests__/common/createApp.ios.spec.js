import createApp from '../../src/platform/createApp.ios'
import transferOptions from '../../src/core/transferOptions'
import Mpx from '../../src/index'
import { error } from '@mpxjs/utils'

jest.mock('../../src/core/transferOptions', () => ({
  __esModule: true,
  default: jest.fn()
}))

jest.mock('../../src/platform/patch/builtInKeysMap', () => ({
  __esModule: true,
  default: {}
}))

jest.mock('@mpxjs/utils', () => ({
  makeMap: (keys) => keys.reduce((map, key) => {
    map[key] = true
    return map
  }, {}),
  spreadProp: (options) => options,
  getFocusedNavigation: jest.fn(),
  hasOwn: (target, key) => Object.prototype.hasOwnProperty.call(target, key),
  callWithErrorHandling: jest.fn(),
  error: jest.fn()
}), { virtual: true })

jest.mock('../../src/convertor/mergeLifecycle', () => ({
  mergeLifecycle: () => ({
    app: ['onLaunch', 'onShow', 'onHide', 'onError', 'onUnhandledRejection']
  })
}))

jest.mock('../../src/platform/patch/lifecycle/index', () => ({
  LIFECYCLE: {}
}))

jest.mock('../../src/index', () => {
  const Mpx = function () {}
  Mpx.config = { rnConfig: {} }
  return {
    __esModule: true,
    default: Mpx
  }
})

jest.mock('../../src/observer/reactive', () => ({
  reactive: (value) => value
}))

jest.mock('../../src/observer/watch', () => ({
  watch: jest.fn()
}))

jest.mock('react', () => ({
  createElement: (type, props, ...children) => ({
    type,
    props: Object.assign({}, props, { children })
  }),
  memo: (component) => component,
  useRef: (value) => ({ current: value }),
  useEffect: jest.fn()
}), { virtual: true })

jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn()
  }
}), { virtual: true })

jest.mock('../../src/platform/export/inject', () => ({
  initAppProvides: jest.fn()
}))

jest.mock('../../src/platform/env/navigationHelper', () => ({
  NavigationContainer: 'NavigationContainer',
  createNativeStackNavigator: () => ({
    Navigator: 'StackNavigator',
    Screen: 'StackScreen'
  }),
  SafeAreaProvider: 'SafeAreaProvider',
  GestureHandlerRootView: 'GestureHandlerRootView'
}), { virtual: true })

jest.mock('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-nav', () => 'MpxNav', { virtual: true })

describe('RN createApp initial params', () => {
  const globalKeys = [
    '__mpxAppCbs',
    '__mpxAppHotLaunched',
    '__mpxAppLaunched',
    '__mpxAppOnLaunch',
    '__mpxEnterOptions',
    '__mpxInitialRouteKey',
    '__mpxInitialRunParams',
    '__mpxLaunchOptions',
    '__mpxOptionsMap',
    '__mpxPageConfig',
    '__mpxPageConfigsMap',
    '__mpxPagesMap',
    '__navigationHelper',
    'getApp',
    'getCurrentPages',
    'setAppHide',
    'setAppShow'
  ]

  beforeEach(() => {
    global.__mpxAppCbs = {
      show: [],
      hide: [],
      error: [],
      rejection: []
    }
    global.__mpxPageConfig = {}
    global.__mpxPageConfigsMap = {
      'pages/index': {}
    }
    global.__navigationHelper = {}
    Mpx.config.rnConfig = {}
  })

  afterEach(() => {
    jest.clearAllMocks()
    globalKeys.forEach((key) => {
      delete global[key]
    })
  })

  it('uses initialState for a non-first Screen instead of Navigator and Screen defaults', () => {
    const initialParams = { a: 1 }
    const onLaunch = jest.fn()
    const onStateChange = jest.fn()
    const HomePage = () => null
    HomePage.displayName = 'HomePage'
    const IndexPage = () => null
    IndexPage.displayName = 'IndexPage'
    transferOptions.mockReturnValue({
      rawOptions: { onLaunch },
      currentInject: {
        moduleId: 'app',
        firstPage: 'pages/home',
        pagesMap: {
          'pages/home': HomePage,
          'pages/index': IndexPage
        }
      }
    })
    Mpx.config.rnConfig = {
      parseAppProps: () => ({
        initialRouteName: 'pages/index',
        initialParams
      }),
      onStateChange
    }

    createApp({})
    const tree = global.__mpxOptionsMap.app({})
    const navigationContainer = tree.props.children[0]
    const stackNavigator = navigationContainer.props.children[0]
    const indexScreen = stackNavigator.props.children[1]

    expect(navigationContainer.props.initialState).toEqual({
      routes: [{
        name: 'pages/index',
        params: initialParams
      }]
    })
    expect(stackNavigator.props.children.map(screen => screen.props.name)).toEqual([
      'pages/home',
      'pages/index'
    ])
    expect(stackNavigator.props).not.toHaveProperty('initialRouteName')
    expect(indexScreen.props).not.toHaveProperty('initialParams')
    expect(global.__mpxInitialRouteKey).toBeUndefined()
    expect(global.__mpxInitialRunParams).toBeUndefined()

    const resetRouteParams = Object.assign({}, indexScreen.props.initialParams, { b: 2 })
    expect(resetRouteParams).toEqual({ b: 2 })

    const state = {
      index: 0,
      routes: [{
        key: 'pages/index-1',
        name: 'pages/index',
        params: initialParams
      }]
    }
    global.__mpxAppOnLaunch({
      getState: () => state
    })

    expect(onStateChange).toHaveBeenCalledWith(state)
    expect(onLaunch).toHaveBeenCalledWith(expect.objectContaining({
      path: 'pages/index',
      query: initialParams,
      isLaunch: true
    }))
  })

  it('reports and falls back when the initial route is not registered', () => {
    const initialParams = { fromMissing: true }
    const IndexPage = () => null
    IndexPage.displayName = 'IndexPage'
    transferOptions.mockReturnValue({
      rawOptions: {},
      currentInject: {
        moduleId: 'app',
        firstPage: 'pages/index',
        pagesMap: {
          'pages/index': IndexPage
        }
      }
    })
    Mpx.config.rnConfig = {
      parseAppProps: () => ({
        initialRouteName: 'pages/missing',
        initialParams
      })
    }

    createApp({})
    const tree = global.__mpxOptionsMap.app({})
    const navigationContainer = tree.props.children[0]
    const stackNavigator = navigationContainer.props.children[0]

    expect(error).toHaveBeenCalledTimes(1)
    expect(error).toHaveBeenCalledWith('Initial page [pages/missing] is not registered, fallback to [pages/index].')
    expect(navigationContainer.props.initialState).toEqual({
      routes: [{
        name: 'pages/index',
        params: {}
      }]
    })
    expect(stackNavigator.props).not.toHaveProperty('initialRouteName')
  })
})
