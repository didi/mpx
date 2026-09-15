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
})
