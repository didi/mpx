global.__mpx_mode__ = 'ios'

const createApp = require('../../src/platform/createApp.ios').default
const transferOptions = require('../../src/core/transferOptions')
const Mpx = require('../../src/index')
const { error } = require('@mpxjs/utils')
const { implement, implemented } = require('../../src/core/implement')

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

jest.mock('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/context', () => ({
  NavigationContainerContext: { Provider: 'NavigationContainerProvider' }
}), { virtual: true })

describe('RN createApp initial params', () => {
  const onLaunch = jest.fn()

  beforeEach(() => {
    Object.keys(implemented).forEach(key => delete implemented[key])
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
    const provider = global.__mpxOptionsMap.app({}).props.children[0]
    const navigationContainer = provider.props.children[0]
    expect(navigationContainer.props.ref).toBe(provider.props.value)
    return navigationContainer
  }

  it.each(['onThemeChange', 'onPageNotFound'])('handles implement for App %s', (name) => {
    const hook = jest.fn()
    const create = () => {
      const rawOptions = { onLaunch, [name]: hook }
      transferOptions.mockReturnValue({ rawOptions, currentInject: { moduleId: 'app' } })
      createApp({})
      return rawOptions
    }

    expect(create()).not.toHaveProperty(name)
    expect(error).toHaveBeenCalledWith(expect.stringContaining(`Options.${name}`), undefined)

    error.mockClear()
    implement(name, { modes: ['ios'] })
    expect(create()[name]).toBe(hook)
    expect(hook).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()

    implement(name, { modes: ['ios'], remove: true })
    const removed = create()
    expect(removed).not.toHaveProperty(name)
    expect(removed.onLaunch).toBe(onLaunch)
    expect(error).not.toHaveBeenCalled()
  })

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

  it('reports and ignores an unregistered initial route and its params', () => {
    const navigationContainer = renderApp('pages/missing', { fromMissing: true })

    expect(error).toHaveBeenCalledTimes(1)
    expect(error).toHaveBeenCalledWith('The initial page [pages/missing] is not registered in the application. Mpx will ignore this initial route configuration.')
    expect(navigationContainer.props.initialState).toEqual({
      routes: [{
        name: 'pages/home',
        params: {}
      }]
    })
  })
})
