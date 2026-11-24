import { setFocusedNavigation } from '@mpxjs/utils'
import { navigateTo, redirectTo, navigateBack, reLaunch, switchTab } from '../../src/platform/api/route/index.ios'

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
