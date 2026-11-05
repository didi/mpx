import { setFocusedNavigation } from '@mpxjs/utils'
import { preload, navigateTo, redirectTo, navigateBack, reLaunch, switchTab } from '../../src/platform/api/route/index.ios'

import { EventChannel } from '../../src/platform/api/event-channel'
import promisify from '../../src/common/js/promisify'
import { canIUse } from '../../src/platform/api/base/rnCanIUse'

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
    delete global.__mpxEventChannels
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
  test('preload submits a relative URL without callbacks, a Promise or a navigation lock', () => {
    const navigation = global.__mpxPagesMap.main[1]
    const state = { type: 'stack', index: 0, routes: [{ name: 'pages/current' }], routeNames: ['pages/current', 'pages/target'], preloadedRoutes: [] }
    navigation.getState = () => state
    navigation.preload = jest.fn()
    const api = promisify({ preload })
    expect(canIUse('preload')).toBe(true)
    expect(canIUse('preload.url')).toBe(true)
    expect(api.preload({ url: './target?id=2' })).toBeUndefined()
    expect(navigation.preload).toHaveBeenCalledWith('pages/target', { id: '2' })
    expect(global.__navigationHelper).toEqual({})
    expect(jest.getTimerCount()).toBe(0)
    navigateTo({ url: './target?id=3' })
    expect(navigation.push).toHaveBeenCalledWith('pages/target', { id: '3' })
    const callback = global.__navigationHelper.lastSuccessCallback
    const error = jest.spyOn(console, 'error').mockImplementation()
    preload({ url: './target' })
    expect(navigation.preload).toHaveBeenCalledTimes(1)
    expect(global.__navigationHelper.lastSuccessCallback).toBe(callback)
    expect(error).toHaveBeenCalled()
  })

  test('preload rejects unsupported backends and invalid URLs, leaving route registration to the navigator', () => {
    const error = jest.spyOn(console, 'error').mockImplementation()
    const navigation = global.__mpxPagesMap.main[1]
    navigation.preload = jest.fn()
    expect(canIUse('preload')).toBe(true)
    preload({ url: '/pages/target' })
    navigation.getState = () => ({ type: 'stack', routes: [{ name: 'pages/current' }], index: 0, preloadedRoutes: [], routeNames: ['pages/target'] })
    ;[undefined, '', '?id=1', '/pages/target?{id:1}'].forEach(url => {
      expect(() => preload({ url })).not.toThrow()
    })
    expect(navigation.preload).not.toHaveBeenCalled()
    expect(global.__navigationHelper).toEqual({})
    expect(error).toHaveBeenCalledWith(expect.stringContaining('preload:'))
    preload({ url: '/pages/missing' })
    expect(navigation.preload).toHaveBeenCalledTimes(1)
    expect(navigation.preload).toHaveBeenCalledWith('pages/missing', {})
  })

  test.each([false, true])('navigateTo preserves the preload channel and removes only failed-operation listeners (throws=%s)', (throws) => {
    const navigation = global.__mpxPagesMap.main[1]
    const channel = new EventChannel()
    const listener = jest.fn()
    channel.on('ready', listener)
    global.__mpxPagesMap.target = [{ getOpenerEventChannel: () => channel }, { isFocused: () => false }]
    navigation.getState = () => ({ index: 0, routes: [{ name: 'pages/current' }], preloadedRoutes: [{ key: 'target', name: 'pages/target' }] })
    if (throws) navigation.push.mockImplementation(() => { throw new Error('dispatch failed') })
    const fail = jest.fn()
    navigateTo({ url: '/pages/target?id=3', events: { ready: listener }, fail })
    if (!throws) global.__navigationHelper.lastFailCallback('unhandled')
    channel.emit('ready')
    expect(listener).toHaveBeenCalledTimes(1)
    expect(fail).toHaveBeenCalledTimes(1)
    expect(global.__mpxEventChannel).toBeUndefined()
    if (throws) {
      expect(global.__navigationHelper.lastSuccessCallback).toBeNull()
      expect(global.__navigationHelper.lastFailCallback).toBeNull()
    }
  })

  test('navigateTo associates an unmounted candidate by key and returns an existing channel on success', () => {
    const navigation = global.__mpxPagesMap.main[1]
    navigation.getState = () => ({ index: 0, routes: [{ name: 'pages/current' }], preloadedRoutes: [{ key: 'target', name: 'pages/target' }] })
    const success = jest.fn()
    navigateTo({ url: '/pages/target', success })
    const channel = global.__mpxEventChannels.target
    expect(channel).toBeInstanceOf(EventChannel)
    global.__navigationHelper.lastSuccessCallback()
    expect(success).toHaveBeenCalledWith({ errMsg: 'navigateTo:ok', eventChannel: channel })
  })

  test('failed navigation removes only its unmounted candidate channel', () => {
    const navigation = global.__mpxPagesMap.main[1]
    const other = new EventChannel()
    global.__mpxEventChannels = { other }
    navigation.getState = () => ({ index: 0, routes: [{ name: 'pages/current' }], preloadedRoutes: [{ key: 'target', name: 'pages/target' }] })
    navigation.push.mockImplementation(() => { throw new Error('dispatch failed') })
    navigateTo({ url: '/pages/target', fail: jest.fn() })
    expect(global.__mpxEventChannels).toEqual({ other })
  })
})
