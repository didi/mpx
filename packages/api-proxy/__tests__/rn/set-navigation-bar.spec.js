import { setNavigationBarTitle, setNavigationBarColor } from '../../src/platform/api/set-navigation-bar/index.ios'
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

  test('updates the built-in titlebar without requiring setOptions', () => {
    const success = jest.fn()
    setNavigationBarTitle({ title: 'Updated title', success })

    expect(navigation.setPageConfig).toHaveBeenCalledWith({ navigationBarTitleText: 'Updated title' })
    expect(success).toHaveBeenCalledWith({ errMsg: 'setNavigationBarTitle:ok' })
  })

  test.each([
    ['setNavigationBarTitle', setNavigationBarTitle, { title: 'Updated' }],
    ['setNavigationBarColor', setNavigationBarColor, { frontColor: '#ffffff', backgroundColor: '#123456' }]
  ])('%s reports failure when the built-in titlebar updater is unavailable', (name, api, options) => {
    delete navigation.setPageConfig
    navigation.setOptions = jest.fn()
    const fail = jest.fn()
    const complete = jest.fn()
    expect(() => api(Object.assign({}, options, { fail, complete }))).not.toThrow()
    expect(fail).toHaveBeenCalledWith({ errMsg: name + ':fail' })
    expect(complete).toHaveBeenCalledWith({ errMsg: name + ':fail' })
    expect(navigation.setOptions).not.toHaveBeenCalled()
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
