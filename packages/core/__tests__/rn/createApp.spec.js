global.__mpx_mode__ = 'ios'
global.__mpx_dynamic_runtime__ = false
global.mpxGlobal = {}

const React = require('react')
const { act, create } = require('react-test-renderer')
const createApp = require('../../src/platform/createApp.ios').default
const transferOptions = require('../../src/core/transferOptions')
const Mpx = require('../../src/index')
const { pageWrapperHOC } = jest.requireActual('../../src/index')
const { getDefaultOptions } = require('../../src/platform/patch/getDefaultOptions.ios')
const pageStatusMap = global.__mpxPageStatusMap
const { getWindowInfo } = require('../../../api-proxy/src/platform/api/system/rnSystem')
const { watch } = require('../../src/observer/watch')
const { error, setFocusedNavigation } = require('@mpxjs/utils')
const { implement, implemented } = require('../../src/core/implement')
const { onPageNotFound, offPageNotFound } = require('../../../api-proxy/src/platform/api/app/index.ios')

jest.mock('../../src/core/transferOptions', () => jest.fn())

jest.mock('@mpxjs/utils', () => Object.assign({}, jest.requireActual('@mpxjs/utils'), {
  error: jest.fn()
}))

jest.mock('@mpxjs/api-proxy', () => ({ createSelectorQuery: jest.fn(), createIntersectionObserver: jest.fn() }))

jest.mock('../../src/index', () => ({ config: { rnConfig: {}, ignoreProxyWhiteList: [] }, prototype: {} }))

jest.mock('react-native', () => ({
  AppState: { addEventListener: jest.fn(() => ({ remove: jest.fn() })) },
  StyleSheet: { create: value => value },
  processColor: () => null,
  Platform: { OS: 'ios' },
  PixelRatio: { get: () => 3 },
  Dimensions: {
    get: () => ({ width: 390, height: 844 }),
    addEventListener: jest.fn(() => ({ remove: jest.fn() }))
  },
  StatusBar: 'StatusBar',
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
  Image: 'Image',
  View: 'View',
  Text: 'Text'
}), { virtual: true })

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
  initialWindowMetrics: { insets: { top: 47, bottom: 34, left: 0, right: 0 } }
}), { virtual: true })

jest.mock('../../src/platform/export/inject', () => ({
  initAppProvides: jest.fn()
}))

jest.mock('../../src/platform/env/navigationHelper', () => {
  const React = require('react')
  const NavigationContext = React.createContext()
  return {
    useSafeAreaInsets: require('react-native-safe-area-context').useSafeAreaInsets,
    initialWindowMetrics: require('react-native-safe-area-context').initialWindowMetrics,
    PortalHost: ({ children, id }) => {
      const PortalHost = require('../../../webpack-plugin/lib/runtime/components/react/mpx-portal/portal-host').default
      return React.createElement('PortalHost', { pageId: id },
        React.createElement(PortalHost, { id }, children))
    },
    NavigationContainer: (props) => {
      const state = React.useRef({
        index: 0,
        routes: props.initialState.routes.map(route => Object.assign({ key: route.name }, route))
      }).current
      const navigation = React.useRef({
        getState: () => state,
        isFocused: () => true,
        addListener: jest.fn(() => jest.fn()),
        push: jest.fn(),
        replace: jest.fn(),
        pop: jest.fn(),
        reset: jest.fn()
      }).current
      return React.createElement(NavigationContext.Provider, { value: navigation },
        React.createElement('NavigationContainer', props, props.children))
    },
    createNativeStackNavigator: () => ({
      Navigator: ({ children }) => {
        const navigation = React.useContext(NavigationContext)
        const state = navigation.getState()
        const screen = children.find(screen => screen.props.name === state.routes[state.index].name)
        return React.createElement('StackNavigator', { key: state.routes[state.index].key },
          React.createElement(screen.props.getComponent(), { navigation, route: state.routes[state.index] }))
      },
      Screen: 'StackScreen'
    }),
    SafeAreaProvider: 'SafeAreaProvider',
    GestureHandlerRootView: 'GestureHandlerRootView'
  }
}, { virtual: true })

jest.mock('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/context', () => require('../../../webpack-plugin/lib/runtime/components/react/context'), { virtual: true })

jest.mock('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-keyboard-avoiding-view', () => ({ default: 'KeyboardAvoidingView' }), { virtual: true })

jest.mock('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-nav', () => require('../../../webpack-plugin/lib/runtime/components/react/mpx-nav'), { virtual: true })

describe('RN createApp initial params', () => {
  const onLaunch = jest.fn()
  let renderer

  beforeEach(() => {
    Object.keys(implemented).forEach(key => delete implemented[key])
    jest.useFakeTimers()
    jest.clearAllMocks()
    onLaunch.mockReset()
    global.mpxGlobal = Object.create(global)
    global.mpxGlobal.__mpx = Mpx
    global.__mpxAppCbs = { show: [], hide: [], error: [], rejection: [], pageNotFound: [] }
    global.__navigationHelper = {}
    Object.keys(pageStatusMap).forEach(key => delete pageStatusMap[key])
    global.__mpxPageStatusMap = pageStatusMap
    global.__preloadRule = {}
    delete global.__mpxAppOnLaunch
    global.__mpxAppHotLaunched = false
    global.__mpxPagesMap = {}
    global.__mpxPageSizeCountMap = {}
    global.__mpxSizeCount = 0
    global.__mpxAppDimensionsInfo = { window: { width: 390, height: 844 }, screen: { width: 390, height: 844 } }
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
          'pages/home': () => () => null,
          'pages/index': () => () => null
        }
      }
    })
  })

  afterEach(() => {
    if (renderer) act(() => renderer.unmount())
    renderer = null
    setFocusedNavigation(null)
    jest.clearAllTimers()
    jest.useRealTimers()
    delete global.__mpxEventChannel
  })

  function createTestPage (Component) {
    return getDefaultOptions({
      type: 'page',
      rawOptions: { __type__: 'page' },
      currentInject: {
        componentsMap: {},
        render () { return React.createElement(Component, this.__props) }
      }
    })
  }

  function renderApp (initialRouteName, initialParams) {
    Mpx.config.rnConfig.parseAppProps = () => ({ initialRouteName, initialParams })
    createApp({})
    act(() => { renderer = create(React.createElement(global.__mpxOptionsMap.app)) })
    return renderer.root.findByType('NavigationContainer')
  }

  it.each(['onThemeChange'])('handles implement for App %s', (name) => {
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

    expect(error).not.toHaveBeenCalled()
    expect(navigationContainer.props.initialState).toEqual({
      routes: [{
        name: expectedRouteName,
        params: initialParams
      }]
    })
    expect(onLaunch).toHaveBeenCalledWith(expect.objectContaining({
      path: expectedRouteName,
      query: initialParams,
      isLaunch: true
    }))
  })

  it('reports and ignores an unregistered initial route and its params', () => {
    const navigationContainer = renderApp('pages/missing', { fromMissing: true })

    expect(error).not.toHaveBeenCalled()
    act(() => navigationContainer.props.onReady())
    expect(error).toHaveBeenCalledTimes(1)
    expect(error).toHaveBeenCalledWith('The initial page [pages/missing] is not registered in the application. Mpx will ignore this initial route configuration.')
    expect(navigationContainer.props.initialState).toEqual({
      routes: [{
        name: 'pages/home',
        params: {}
      }]
    })
  })

  it('notifies the missing entry once after ready and preserves App this', () => {
    const onPageNotFound = jest.fn()
    const injected = transferOptions()
    injected.rawOptions.onPageNotFound = onPageNotFound
    const query = { from: 'entry' }
    const navigationContainer = renderApp('pages/missing', query)
    expect(error).not.toHaveBeenCalled()
    expect(onPageNotFound).not.toHaveBeenCalled()
    expect(navigationContainer.props.initialState.routes).toEqual([{ name: 'pages/home', params: {} }])
    act(() => navigationContainer.props.onReady())
    expect(onPageNotFound).toHaveBeenCalledWith({ path: 'pages/missing', query, isEntryPage: true })
    expect(onPageNotFound.mock.contexts[0]).toBe(onLaunch.mock.contexts[0])
    act(() => renderer.update(React.createElement(global.__mpxOptionsMap.app, { updated: true })))
    act(() => navigationContainer.props.onReady())
    global.setAppShow()
    expect(onPageNotFound).toHaveBeenCalledTimes(1)

    act(() => renderer.unmount())
    act(() => { renderer = create(React.createElement(global.__mpxOptionsMap.app)) })
    act(() => renderer.root.findByType('NavigationContainer').props.onReady())
    expect(onPageNotFound).toHaveBeenCalledTimes(2)
    expect(onLaunch).toHaveBeenCalledTimes(1)
  })

  it.each([undefined, 'pages/index'])('does not notify a valid entry %s', (path) => {
    const onPageNotFound = jest.fn()
    transferOptions().rawOptions.onPageNotFound = onPageNotFound
    const navigationContainer = renderApp(path)
    act(() => navigationContainer.props.onReady())
    expect(onPageNotFound).not.toHaveBeenCalled()
  })

  it('notifies an API listener registered in onLaunch without an App hook', () => {
    const listener = jest.fn()
    onLaunch.mockImplementationOnce(() => onPageNotFound(listener))
    const navigationContainer = renderApp('pages/missing', { from: 'api' })
    expect(listener).not.toHaveBeenCalled()
    act(() => navigationContainer.props.onReady())
    act(() => navigationContainer.props.onReady())
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith({ path: 'pages/missing', query: { from: 'api' }, isEntryPage: true })
    expect(error).not.toHaveBeenCalled()
    const lateListener = jest.fn()
    onPageNotFound(lateListener)
    act(() => navigationContainer.props.onReady())
    expect(lateListener).not.toHaveBeenCalled()
  })

  it.each(['one', 'all'])('removes %s API listeners without removing the App hook', (mode) => {
    const hook = jest.fn()
    transferOptions().rawOptions.onPageNotFound = hook
    const removed = jest.fn()
    const retained = jest.fn()
    onPageNotFound(removed)
    onPageNotFound(retained)
    if (mode === 'one') offPageNotFound(removed)
    else offPageNotFound()
    const navigationContainer = renderApp('pages/missing')
    act(() => navigationContainer.props.onReady())
    expect(hook).toHaveBeenCalledTimes(1)
    expect(removed).not.toHaveBeenCalled()
    expect(retained).toHaveBeenCalledTimes(mode === 'one' ? 1 : 0)
    expect(error).not.toHaveBeenCalled()
  })

  it.each([
    ['navigateTo', 'push'],
    ['redirectTo', 'replace'],
    ['reLaunch', 'reset']
  ])('%s fails synchronously without notifying App and can recover', (name, method) => {
    const api = require('../../../api-proxy/src/platform/api/route/index.ios')[name]
    const onPageNotFound = jest.fn()
    const listener = jest.fn()
    global.__mpxAppCbs.pageNotFound.push(listener)
    transferOptions().rawOptions.onPageNotFound = onPageNotFound
    const navigationContainer = renderApp('pages/home')
    const state = { index: 0, routes: [{ name: 'pages/home' }] }
    const navigation = global.__mpxPagesMap['pages/home'][1]
    navigation[method].mockImplementation(() => navigationContainer.props.onUnhandledAction({ type: method }))
    const calls = []
    const success = jest.fn()
    api({ url: '/pages/missing', success, fail: () => calls.push('fail'), complete: () => calls.push('complete') })
    expect(calls).toEqual(['fail', 'complete'])
    expect(global.__navigationHelper.lastFailCallback).toBeNull()
    expect(global.__navigationHelper.lastSuccessCallback).toBeNull()
    navigationContainer.props.onStateChange(state)
    expect(success).not.toHaveBeenCalled()
    expect(onPageNotFound).not.toHaveBeenCalled()
    expect(listener).not.toHaveBeenCalled()
    navigation[method].mockImplementation(() => navigationContainer.props.onStateChange(state))
    api({ url: '/pages/index', success })
    expect(success).toHaveBeenCalledTimes(1)
    expect(global.__navigationHelper.lastFailCallback).toBeNull()
  })

  it.each(['redirectTo', 'reLaunch'])('can %s from onPageNotFound', (name) => {
    const api = require('../../../api-proxy/src/platform/api/route/index.ios')[name]
    const success = jest.fn()
    const onPageNotFound = jest.fn(() => api({ url: '/pages/index', success }))
    transferOptions().rawOptions.onPageNotFound = onPageNotFound
    const navigationContainer = renderApp('pages/missing')
    const state = { index: 0, routes: [{ name: 'pages/home' }] }
    const navigate = jest.fn(() => navigationContainer.props.onStateChange(state))
    Object.assign(global.__mpxPagesMap['pages/home'][1], { replace: navigate, reset: navigate })
    act(() => navigationContainer.props.onReady())
    expect(onPageNotFound).toHaveBeenCalledTimes(1)
    expect(success).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledTimes(1)
  })

  it('keeps a new navigation started inside fail pending until its own completion', () => {
    const { redirectTo } = require('../../../api-proxy/src/platform/api/route/index.ios')
    const navigationContainer = renderApp('pages/home')
    const state = { index: 0, routes: [{ name: 'pages/home' }] }
    const replace = jest.fn((path) => {
      if (path === 'pages/missing') navigationContainer.props.onUnhandledAction({ type: 'REPLACE' })
    })
    global.__mpxPagesMap['pages/home'][1].replace = replace
    const success = jest.fn()
    redirectTo({ url: '/pages/missing', fail: () => redirectTo({ url: '/pages/index', success }) })
    expect(replace).toHaveBeenCalledTimes(2)
    expect(global.__navigationHelper.lastSuccessCallback).toEqual(expect.any(Function))
    expect(global.__navigationHelper.lastFailCallback).toEqual(expect.any(Function))
    navigationContainer.props.onStateChange(state)
    expect(success).toHaveBeenCalledTimes(1)
  })

  it('initializes window information before App launch and show', () => {
    const snapshots = []
    onLaunch.mockImplementation(() => snapshots.push(getWindowInfo()))
    transferOptions().rawOptions.onShow = () => snapshots.push(getWindowInfo())
    renderApp()
    expect(snapshots).toHaveLength(2)
    snapshots.forEach(info => {
      expect(info).toEqual(expect.objectContaining({ windowWidth: 390, windowHeight: 753, screenTop: 91, statusBarHeight: 47 }))
    })
  })

  it('displays portal content requested during App launch before the host mounts', () => {
    const { portal } = require('../../../webpack-plugin/lib/runtime/components/react/mpx-portal/portal-host')
    onLaunch.mockImplementation(() => portal.add(React.createElement('LaunchOverlay')))
    renderApp()
    expect(renderer.root.findAllByType('LaunchOverlay')).toHaveLength(1)
  })

  it('retains navigation, contexts and page status when wrapped independently', async () => {
    const { RouteContext, IntersectionObserverContext, KeyboardAvoidContext } = require('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/context')
    const listeners = {}
    const removers = []
    const navigation = {
      getState: () => ({ routes: [{ name: 'pages/standalone' }] }),
      isFocused: () => true,
      addListener: jest.fn((name, listener) => {
        listeners[name] = listener
        const remove = jest.fn()
        removers.push(remove)
        return remove
      })
    }
    const route = { key: 'standalone', name: 'pages/standalone' }
    let context
    const Page = pageWrapperHOC(createTestPage((props) => {
      context = {
        route: React.useContext(RouteContext),
        intersection: React.useContext(IntersectionObserverContext),
        keyboard: React.useContext(KeyboardAvoidContext),
        props
      }
      return React.createElement('BusinessPage')
    }), { navigationBarTitleText: 'Standalone' })
    await act(async () => { renderer = create(React.createElement(Page, { navigation, route, foo: 'bar' })) })
    expect(renderer.root.findAllByType('GestureHandlerRootView')).toHaveLength(1)
    expect(renderer.root.findAllByType('StatusBar')).toHaveLength(1)
    expect(renderer.root.findByType('Text').props.children).toBe('Standalone')
    expect(renderer.root.findByType('KeyboardAvoidingView').findByType('BusinessPage')).toBeDefined()
    expect(context.route).toEqual({ navigation, pageId: navigation.pageId })
    expect(renderer.root.findByType('PortalHost').props.pageId).toBe(navigation.pageId)
    expect(context.props).toEqual({ navigation, route, foo: 'bar' })
    expect(global.__mpxPagesMap[route.key][0].getPageId()).toBe(navigation.pageId)
    expect(global.__mpxPagesMap[route.key][0].id).toBeUndefined()
    expect(context.intersection).toEqual({})
    expect(context.keyboard).toEqual({ current: null })
    expect(pageStatusMap[navigation.pageId]).toBe('show')
    act(() => listeners.blur())
    expect(pageStatusMap[navigation.pageId]).toBe('hide')
    act(() => listeners.focus())
    expect(pageStatusMap[navigation.pageId]).toBe('show')
    act(() => renderer.unmount())
    expect(pageStatusMap).not.toHaveProperty(String(navigation.pageId))
    expect(global.__mpxPagesMap).not.toHaveProperty(route.key)
    removers.forEach(remove => expect(remove).toHaveBeenCalledTimes(1))
  })

  it('preserves custom navigation and disabled keyboard avoidance for standalone pages', () => {
    const navigation = {
      isFocused: () => true,
      addListener: jest.fn(() => jest.fn())
    }
    const Page = pageWrapperHOC(createTestPage(() => React.createElement('BusinessPage')), {
      navigationStyle: 'custom',
      disableKeyboardAvoiding: true
    })
    act(() => {
      renderer = create(React.createElement(Page, { navigation, route: { key: 'custom', name: 'pages/custom' } }))
    })
    expect(navigation.layout.height).toBe(844)
    expect(renderer.root.findAllByType('StatusBar')).toHaveLength(1)
    expect(renderer.root.findAllByType('Text')).toHaveLength(0)
    expect(renderer.root.findAllByType('KeyboardAvoidingView')).toHaveLength(0)
    expect(renderer.root.findAllByType('BusinessPage')).toHaveLength(1)
  })

  it('mounts page status and preload only after the async page loads, without nesting containers', async () => {
    const calls = []
    let resolvePage
    const loaded = new Promise(resolve => { resolvePage = resolve })
    const Page = createTestPage(() => {
      const { pageId } = React.useContext(require('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/context').RouteContext)
      React.useEffect(() => watch(() => pageStatusMap[pageId], status => calls.push(status), { sync: true }), [])
      return React.createElement('BusinessPage')
    })
    const AsyncPage = (props) => {
      const [ready, setReady] = React.useState(false)
      React.useEffect(() => { loaded.then(() => setReady(true)) }, [])
      return ready ? React.createElement(Page, props) : React.createElement('Loading')
    }
    AsyncPage.displayName = 'AsyncPage'
    transferOptions().currentInject.pagesMap['pages/home'] = AsyncPage
    global.__preloadRule = { 'pages/home': { packages: ['pkg'] } }
    const download = jest.fn()
    global.mpxGlobal.__mpx = { config: { rnConfig: { downloadChunkAsync: download } } }
    renderApp()
    const navigation = global.__mpxPagesMap['pages/home'][1]
    act(() => jest.advanceTimersByTime(800))
    const pageId = navigation.pageId
    expect(pageId).toEqual(expect.any(Number))
    expect(pageStatusMap).not.toHaveProperty(String(pageId))
    expect(renderer.root.findByType('PortalHost').props.pageId).toBe(pageId)
    expect(navigation.addListener).not.toHaveBeenCalled()
    expect(download).not.toHaveBeenCalled()
    expect(renderer.root.findAllByType('StatusBar')).toHaveLength(1)
    await act(async () => { resolvePage(); await loaded })
    expect(calls).toEqual(['show'])
    expect(navigation.pageId).toBe(pageId)
    expect(global.__mpxPagesMap['pages/home'][0].getPageId()).toBe(pageId)
    expect(renderer.root.findAllByType('GestureHandlerRootView')).toHaveLength(1)
    expect(renderer.root.findAllByType('StatusBar')).toHaveLength(1)
    expect(renderer.root.findAllByType('PortalHost')).toHaveLength(1)
    expect(navigation.addListener).toHaveBeenCalledTimes(2)
    act(() => jest.advanceTimersByTime(800))
    expect(download).toHaveBeenCalledTimes(1)
    expect(download).toHaveBeenCalledWith(['pkg'])
  })

  it('launches before the synchronous page initializes', () => {
    const calls = []
    onLaunch.mockImplementation(() => calls.push('launch'))
    transferOptions().rawOptions.onShow = () => calls.push('show')
    transferOptions().currentInject.pagesMap['pages/home'] = () => () => {
      calls.push('page')
      return null
    }
    renderApp()
    expect(calls).toEqual(['launch', 'show', 'page'])
  })

  it('lazily wraps a page once and preserves it across container renders', () => {
    const loadPage = jest.fn(() => () => null)
    transferOptions().currentInject.pagesMap['pages/home'] = loadPage
    createApp({})
    expect(loadPage).not.toHaveBeenCalled()
    act(() => { renderer = create(React.createElement(global.__mpxOptionsMap.app)) })
    const instance = { route: 'pages/home' }
    const page = [instance, global.__mpxPagesMap['pages/home'][1]]
    const pageId = page[1].pageId
    // 实体页面沿用 getDefaultOptions 中已有的登记方式。
    global.__mpxPagesMap['pages/home'] = page
    act(() => renderer.update(React.createElement(global.__mpxOptionsMap.app, { updated: true })))
    expect(global.__mpxPagesMap['pages/home']).toBe(page)
    expect(page[1].pageId).toBe(pageId)
    expect(loadPage).toHaveBeenCalledTimes(1)
    expect(global.getCurrentPages()).toEqual([instance])
    act(() => renderer.unmount())
    expect(global.__mpxPagesMap['pages/home']).toBe(page)
  })

  it.each(['redirectTo', 'reLaunch'])('launches and can %s while the async home page is loading', async (name) => {
    const api = require('../../../api-proxy/src/platform/api/route/index.ios')[name]
    const calls = []
    let resolvePage
    const loaded = new Promise(resolve => { resolvePage = resolve })
    const pageInit = jest.fn(() => {
      calls.push('page')
      return null
    })
    const AsyncPage = () => {
      const [ready, setReady] = React.useState(false)
      React.useEffect(() => { loaded.then(() => setReady(true)) }, [])
      return ready ? React.createElement(pageInit) : React.createElement('Loading')
    }
    AsyncPage.displayName = 'AsyncPage'
    transferOptions().currentInject.pagesMap['pages/home'] = AsyncPage
    global.__mpxPageConfig.navigationStyle = 'custom'
    const onShow = jest.fn(() => calls.push('show'))
    transferOptions().rawOptions.onShow = onShow
    const success = jest.fn()
    const listener = jest.fn(() => {
      calls.push('missing')
      api({ url: '/pages/index', success })
    })
    onLaunch.mockImplementation(() => {
      calls.push('launch')
      onPageNotFound(listener)
    })
    const container = renderApp('pages/missing', { from: 'entry' })
    const navigation = global.__mpxPagesMap['pages/home'][1]
    const updateRoutes = (routes) => {
      navigation.getState().routes = routes.map(route => Object.assign({ key: route.name }, route))
      container.props.onStateChange(navigation.getState())
    }
    navigation.replace.mockImplementation((name, params) => updateRoutes([{ name, params }]))
    navigation.reset.mockImplementation(({ routes }) => updateRoutes(routes))
    expect(calls).toEqual(['launch', 'show'])
    expect(renderer.root.findByType('Loading')).toBeDefined()
    expect(global.__mpxPagesMap['pages/home']).toEqual([null, navigation])
    expect(global.getCurrentPages()).toEqual([])
    act(() => {
      container.props.onReady()
      renderer.update(React.createElement(global.__mpxOptionsMap.app, { updated: true }))
    })
    expect(listener).toHaveBeenCalledWith({ path: 'pages/missing', query: { from: 'entry' }, isEntryPage: true })
    expect(success).toHaveBeenCalledTimes(1)
    expect(pageInit).not.toHaveBeenCalled()
    expect(renderer.root.findAllByType('Loading')).toHaveLength(0)
    expect(global.__mpxPagesMap).not.toHaveProperty('pages/home')
    expect(error).not.toHaveBeenCalled()
    if (name === 'redirectTo') {
      expect(navigation.replace).toHaveBeenCalledWith('pages/index', {})
    } else {
      expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'pages/index', params: {} }] })
    }
    await act(async () => { resolvePage(); await loaded })
    expect(calls).toEqual(['launch', 'show', 'missing'])
    expect(onLaunch).toHaveBeenCalledTimes(1)
    expect(onShow).toHaveBeenCalledTimes(1)
    act(() => container.props.onReady())
    expect(listener).toHaveBeenCalledTimes(1)

    act(() => renderer.unmount())
    Mpx.config.rnConfig.parseAppProps = () => ({ initialRouteName: 'pages/index', initialParams: { hot: true } })
    act(() => { renderer = create(React.createElement(global.__mpxOptionsMap.app)) })
    expect(global.__mpxPagesMap).not.toHaveProperty('pages/home')
    expect(global.__mpxPagesMap['pages/index'][1]).not.toBe(navigation)
    expect(onLaunch).toHaveBeenCalledTimes(1)
    expect(onShow).toHaveBeenCalledTimes(2)
    expect(onShow).toHaveBeenLastCalledWith(expect.objectContaining({ path: 'pages/index', query: { hot: true } }))
    act(() => renderer.root.findByType('NavigationContainer').props.onReady())
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
