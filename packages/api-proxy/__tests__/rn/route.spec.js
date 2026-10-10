import { reLaunch, switchTab } from '../../src/platform/api/route/index.ios'

describe('RN route APIs', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    global.mpxGlobal = global
    global.__navigationHelper = {}
    global.__mpxPagesMap = {
      main: [null, {
        getState: () => ({
          index: 0,
          routes: [{ name: 'pages/current' }]
        }),
        reset: jest.fn()
      }]
    }
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    jest.restoreAllMocks()
    delete global.mpxGlobal
    delete global.__navigationHelper
    delete global.__mpxPagesMap
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
