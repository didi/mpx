global.__mpx_mode__ = 'ios'

const createApp = require('../../src/platform/createApp.ios').default
const transferOptions = require('../../src/core/transferOptions')
const Mpx = require('../../src/index')
const { error } = require('@mpxjs/utils')

jest.mock('../../src/core/transferOptions', () => jest.fn())

jest.mock('@mpxjs/utils', () => Object.assign({}, jest.requireActual('@mpxjs/utils'), {
  error: jest.fn()
}))

jest.mock('../../src/index', () => ({ config: { rnConfig: {} }, prototype: {} }))

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

jest.mock('react-native', () => ({}), { virtual: true })

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
  const onLaunch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    global.__mpxOptionsMap = {}
    global.__mpxPageConfig = {}
    global.__mpxPageConfigsMap = {}
    Mpx.config.rnConfig = {}
    transferOptions.mockReturnValue({
      rawOptions: { onLaunch },
      currentInject: {
        moduleId: 'app',
        firstPage: 'pages/home',
        pagesMap: {
          'pages/home': () => null,
          'pages/index': () => null
        }
      }
    })
  })

  function renderApp (initialRouteName, initialParams) {
    Mpx.config.rnConfig.parseAppProps = () => ({ initialRouteName, initialParams })
    createApp({})
    return global.__mpxOptionsMap.app({}).props.children[0]
  }

  it.each([
    ['pages/index', 'pages/index'],
    [undefined, 'pages/home']
  ])('uses initialState when initialRouteName is %s', (initialRouteName, expectedRouteName) => {
    const initialParams = { a: 1 }
    const navigationContainer = renderApp(initialRouteName, initialParams)
    const stackNavigator = navigationContainer.props.children[0]

    expect(error).not.toHaveBeenCalled()
    expect(navigationContainer.props.initialState).toEqual({
      routes: [{
        name: expectedRouteName,
        params: initialParams
      }]
    })
    expect(stackNavigator.props).not.toHaveProperty('initialRouteName')
    stackNavigator.props.children.forEach(screen => {
      expect(screen.props).not.toHaveProperty('initialParams')
    })

    global.__mpxAppOnLaunch({
      getState: () => Object.assign({ index: 0 }, navigationContainer.props.initialState)
    })
    expect(onLaunch).toHaveBeenCalledWith(expect.objectContaining({
      path: expectedRouteName,
      query: initialParams,
      isLaunch: true
    }))
  })

  it('reports and falls back when the initial route is not registered', () => {
    const navigationContainer = renderApp('pages/missing', { fromMissing: true })

    expect(error).toHaveBeenCalledTimes(1)
    expect(error).toHaveBeenCalledWith('The initial page [pages/missing] is not registered in the application. Mpx will fall back to the first page [pages/home].')
    expect(navigationContainer.props.initialState).toEqual({
      routes: [{
        name: 'pages/home',
        params: {}
      }]
    })
  })
})
