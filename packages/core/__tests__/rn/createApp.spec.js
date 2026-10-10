global.__mpx_mode__ = 'ios'

const React = require('react')
const { act, create } = require('react-test-renderer')
const createApp = require('../../src/platform/createApp.ios').default
const transferOptions = require('../../src/core/transferOptions')
const Mpx = require('../../src/index')
const { error } = require('@mpxjs/utils')
const { implement, implemented } = require('../../src/core/implement')
const { onPageNotFound, offPageNotFound } = require('../../../api-proxy/src/platform/api/app/index.ios')

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

jest.mock('react-native', () => ({
  AppState: { addEventListener: jest.fn(() => ({ remove: jest.fn() })) }
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
  const onLaunch = jest.fn()
  let renderer

  beforeEach(() => {
    Object.keys(implemented).forEach(key => delete implemented[key])
    jest.clearAllMocks()
    global.mpxGlobal = global
    global.__mpxAppCbs = { show: [], hide: [], error: [], rejection: [], pageNotFound: [] }
    global.__navigationHelper = {}
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

  afterEach(() => {
    if (renderer) act(() => renderer.unmount())
    renderer = null
    delete global.__mpxEventChannel
  })

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
    const stackNavigator = renderer.root.findByType('StackNavigator')

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
    global.__mpxAppOnLaunch({ getState: () => Object.assign({ index: 0 }, navigationContainer.props.initialState) })
    act(() => navigationContainer.props.onReady())
    expect(onPageNotFound).toHaveBeenCalledWith({ path: 'pages/missing', query, isEntryPage: true })
    expect(onPageNotFound.mock.contexts[0]).toBe(onLaunch.mock.contexts[0])
    act(() => renderer.update(React.createElement(global.__mpxOptionsMap.app, { updated: true })))
    act(() => navigationContainer.props.onReady())
    global.setAppShow()
    expect(onPageNotFound).toHaveBeenCalledTimes(1)

    act(() => renderer.unmount())
    act(() => { renderer = create(React.createElement(global.__mpxOptionsMap.app)) })
    global.__mpxAppOnLaunch({ getState: () => ({ index: 0, routes: [{ name: 'pages/home', params: {} }] }) })
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
    global.__mpxAppOnLaunch({ getState: () => Object.assign({ index: 0 }, navigationContainer.props.initialState) })
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
    const navigation = {
      getState: () => state,
      [method]: jest.fn(() => navigationContainer.props.onUnhandledAction({ type: method }))
    }
    global.__mpxPagesMap = { home: [null, navigation] }
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
    global.__mpxPagesMap = { home: [null, { getState: () => state, replace: navigate, reset: navigate }] }
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
    global.__mpxPagesMap = { home: [null, { getState: () => state, replace }] }
    const success = jest.fn()
    redirectTo({ url: '/pages/missing', fail: () => redirectTo({ url: '/pages/index', success }) })
    expect(replace).toHaveBeenCalledTimes(2)
    expect(global.__navigationHelper.lastSuccessCallback).toEqual(expect.any(Function))
    expect(global.__navigationHelper.lastFailCallback).toEqual(expect.any(Function))
    navigationContainer.props.onStateChange(state)
    expect(success).toHaveBeenCalledTimes(1)
  })
})
