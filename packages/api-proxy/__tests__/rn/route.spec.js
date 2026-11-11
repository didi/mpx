import { setFocusedNavigation } from '@mpxjs/utils'
import { navigateTo, redirectTo, navigateBack, reLaunch, switchTab } from '../../src/platform/api/route/index.ios'
import promisify from '../../src/common/js/promisify'

describe('RN route APIs', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    setFocusedNavigation(null)
    global.mpxGlobal = global
    global.__navigationHelper = {}
    global.__mpxPagesMap = {
      main: [null, {
        isFocused: () => true,
        getState: () => ({
          index: 0,
          routes: [{ name: 'pages/current' }]
        }),
        push: jest.fn(),
        replace: jest.fn(),
        pop: jest.fn(),
        reset: jest.fn()
      }]
    }
  })

  afterEach(() => {
    setFocusedNavigation(null)
    jest.clearAllTimers()
    jest.useRealTimers()
    jest.restoreAllMocks()
    delete global.mpxGlobal
    delete global.__navigationHelper
    delete global.__mpxPagesMap
    delete global.__mpxEventChannel
  })

  test.each([
    ['navigateTo', navigateTo, 'push'],
    ['redirectTo', redirectTo, 'replace'],
    ['navigateBack', navigateBack, 'pop'],
    ['reLaunch', reLaunch, 'reset']
  ])('%s uses the focused navigation instead of the first cached page', (name, api, method) => {
    const inactive = global.__mpxPagesMap.main[1]
    inactive.isFocused = () => false
    inactive.getState = () => ({ index: 1, routes: [{ name: 'pages/home' }, { name: 'pages/current' }] })
    setFocusedNavigation(inactive)
    const active = Object.assign({}, inactive, { isFocused: () => true, [method]: jest.fn() })
    global.__mpxPagesMap.current = [null, active]

    api({ url: './target', delta: 1 })

    expect(active[method]).toHaveBeenCalledTimes(1)
    expect(inactive[method]).not.toHaveBeenCalled()
  })

  test.each([
    ['navigateTo', navigateTo, 'push'],
    ['redirectTo', redirectTo, 'replace']
  ])('%s resolves relative URLs without a business page instance', (name, api, method) => {
    api({ url: './target?foo=bar' })
    expect(global.__mpxPagesMap.main[1][method]).toHaveBeenCalledWith('pages/target', { foo: 'bar' })
    expect(global.__mpxPagesMap.main[0]).toBeNull()
  })

  test('navigateBack can pop while the current business page is loading', () => {
    global.__mpxPagesMap.main[1].getState = () => ({
      index: 1,
      routes: [{ name: 'pages/home' }, { name: 'pages/current' }]
    })
    navigateBack({ delta: 1 })
    expect(global.__mpxPagesMap.main[1].pop).toHaveBeenCalledWith(1)
  })

  describe('redirectTo with preloaded routes', () => {
    let navigation
    let state

    beforeEach(() => {
      state = {
        stale: false,
        type: 'stack',
        key: 'stack-key',
        index: 1,
        routeNames: ['pages/home', 'pages/current', 'pages/other', 'pages/target'],
        routes: [
          { key: 'home-key', name: 'pages/home' },
          { key: 'current-key', name: 'pages/current' },
          { key: 'other-key', name: 'pages/other', params: { keep: 'stack' } }
        ],
        preloadedRoutes: [
          { key: 'target-key', name: 'pages/target', params: { id: 'old', preloadOnly: 'yes' } },
          { key: 'other-preload-key', name: 'pages/other', params: { keep: 'preload' } }
        ]
      }
      navigation = global.__mpxPagesMap.main[1]
      navigation.getState = () => state
      navigation.preload = jest.fn()
    })

    test.each([
      ['./target?id=new&text=a%20b', { id: 'new', text: 'a%20b' }],
      ['/pages/target', {}]
    ])('reuses the preload key and replaces params for %s without changing other routes', (url, params) => {
      const originalState = JSON.parse(JSON.stringify(state))

      redirectTo({ url })

      expect(navigation.replace).not.toHaveBeenCalled()
      expect(navigation.reset).toHaveBeenCalledTimes(1)
      const nextState = navigation.reset.mock.calls[0][0]
      expect(nextState).toEqual(Object.assign({}, state, {
        routes: [state.routes[0], { key: 'target-key', name: 'pages/target', params }, state.routes[2]],
        preloadedRoutes: [state.preloadedRoutes[1]]
      }))
      expect(nextState.routes[0]).toBe(state.routes[0])
      expect(nextState.routes[2]).toBe(state.routes[2])
      expect(nextState.preloadedRoutes[0]).toBe(state.preloadedRoutes[1])
      expect(nextState).not.toBe(state)
      expect(state).toEqual(originalState)
    })

    test.each(['miss', 'unsupported'])('keeps replace for a preload %s', (scenario) => {
      if (scenario === 'miss') state.preloadedRoutes = [state.preloadedRoutes[1]]
      else delete navigation.preload

      redirectTo({ url: './target?id=new' })

      expect(navigation.replace).toHaveBeenCalledWith('pages/target', { id: 'new' })
      expect(navigation.reset).not.toHaveBeenCalled()
    })

    test('waits for navigation success, blocks concurrent redirects and resolves the Promise', async () => {
      const complete = jest.fn()
      const pending = promisify({ redirectTo }).redirectTo({ url: './target', complete })
      const fail = jest.fn()
      const blockedComplete = jest.fn()

      redirectTo({ url: './other', fail, complete: blockedComplete })

      expect(fail).toHaveBeenCalledWith({
        errMsg: "redirectTo:fail the previous routing event didn't complete",
        path: './other'
      })
      expect(blockedComplete).toHaveBeenCalledWith(fail.mock.calls[0][0])
      expect(navigation.reset).toHaveBeenCalledTimes(1)
      expect(navigation.replace).not.toHaveBeenCalled()
      expect(complete).not.toHaveBeenCalled()

      // Simulate createApp's onStateChange settling the pending navigation.
      const callback = global.__navigationHelper.lastSuccessCallback
      global.__navigationHelper.lastSuccessCallback = null
      global.__navigationHelper.lastFailCallback = null
      callback()

      await expect(pending).resolves.toEqual({ errMsg: 'redirectTo:ok' })
      jest.advanceTimersByTime(1000)
      expect(complete).toHaveBeenCalledTimes(1)
      expect(complete).toHaveBeenCalledWith({ errMsg: 'redirectTo:ok' })
      redirectTo({ url: './other' })
      expect(navigation.reset).toHaveBeenCalledTimes(2)
    })

    test('rejects on timeout, completes once and releases the navigation lock', async () => {
      const complete = jest.fn()
      const pending = promisify({ redirectTo }).redirectTo({ url: './target', complete })
      const rejection = expect(pending).rejects.toEqual({ errMsg: 'redirectTo:fail timeout ./target' })

      jest.advanceTimersByTime(2000)
      await rejection

      expect(complete).toHaveBeenCalledTimes(1)
      expect(complete).toHaveBeenCalledWith({ errMsg: 'redirectTo:fail timeout ./target' })
      expect(global.__navigationHelper.lastSuccessCallback).toBeNull()
      expect(global.__navigationHelper.lastFailCallback).toBeNull()
      redirectTo({ url: './other' })
      expect(navigation.reset).toHaveBeenCalledTimes(2)
    })
  })

  test('switchTab should report an unsupported environment error', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation()

    switchTab()

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('环境不支持switchTab方法'))
  })

  test('reLaunch should return the correct success errMsg', () => {
    const success = jest.fn()
    const complete = jest.fn()

    reLaunch({
      url: '/pages/target?foo=bar',
      success,
      complete
    })
    global.__navigationHelper.lastSuccessCallback()

    const res = { errMsg: 'reLaunch:ok' }
    expect(success).toHaveBeenCalledWith(res)
    expect(complete).toHaveBeenCalledWith(res)
  })

  test('reLaunch should return the correct fail errMsg', () => {
    const fail = jest.fn()
    const complete = jest.fn()

    reLaunch({
      url: '/pages/target',
      fail,
      complete
    })
    global.__navigationHelper.lastFailCallback('navigation error')

    const res = { errMsg: 'reLaunch:fail navigation error' }
    expect(fail).toHaveBeenCalledWith(res)
    expect(complete).toHaveBeenCalledWith(res)
  })

  test('timeout settles once and unlocks a recovery navigation from fail', () => {
    const calls = []
    const success = jest.fn()
    reLaunch({
      url: '/pages/missing',
      success,
      fail: (res) => {
        calls.push(res.errMsg)
        reLaunch({ url: '/pages/target', success })
      },
      complete: () => calls.push('complete')
    })
    jest.advanceTimersByTime(1000)
    expect(calls).toEqual(['reLaunch:fail timeout /pages/missing', 'complete'])
    expect(success).not.toHaveBeenCalled()
    expect(global.__mpxPagesMap.main[1].reset).toHaveBeenCalledTimes(2)
    expect(global.__navigationHelper.lastSuccessCallback).toEqual(expect.any(Function))
    expect(global.__navigationHelper.lastFailCallback).toEqual(expect.any(Function))
  })
})
