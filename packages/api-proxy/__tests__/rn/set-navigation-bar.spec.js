import { setNavigationBarColor } from '../../src/platform/api/set-navigation-bar/index.ios'
import { setFocusedNavigation } from '@mpxjs/utils'

jest.mock('../../src/platform/api/next-tick', () => ({
  nextTick: (fn) => fn()
}))

describe('RN navigation bar APIs', () => {
  let navigation

  beforeEach(() => {
    setFocusedNavigation(null)
    navigation = {
      isFocused: () => true,
      setOptions: jest.fn(),
      setPageConfig: jest.fn()
    }
    global.mpxGlobal = global
    global.__mpxPagesMap = {
      current: [null, navigation]
    }
  })

  afterEach(() => {
    delete global.mpxGlobal
    delete global.__mpxPagesMap
  })

  test.each(['#fff', '#ff0000'])('setNavigationBarColor should accept the hex background color %s', async (backgroundColor) => {
    const success = jest.fn()
    const complete = jest.fn()

    setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor,
      success,
      complete
    })
    await Promise.resolve()

    expect(navigation.setPageConfig).toHaveBeenCalledWith({
      navigationBarBackgroundColor: backgroundColor,
      navigationBarTextStyle: '#ffffff'
    })
    const result = { errMsg: 'setNavigationBarColor:ok' }
    expect(success).toHaveBeenCalledWith(result)
    expect(complete).toHaveBeenCalledWith(result)
  })

  test.each([
    { frontColor: '#FFFFFF', backgroundColor: '#ff0000' },
    { frontColor: '#000000', backgroundColor: 'red' }
  ])('setNavigationBarColor should reject invalid colors', (options) => {
    const fail = jest.fn()
    const complete = jest.fn()

    setNavigationBarColor(Object.assign({}, options, { fail, complete }))

    const result = { errMsg: 'setNavigationBarColor:fail invalid color' }
    expect(fail).toHaveBeenCalledWith(result)
    expect(complete).toHaveBeenCalledWith(result)
    expect(navigation.setPageConfig).not.toHaveBeenCalled()
  })
})
