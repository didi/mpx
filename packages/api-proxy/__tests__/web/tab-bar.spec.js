import {
  setTabBarItem,
  setTabBarStyle,
  showTabBar,
  hideTabBar
} from '../../src/platform/api/tab-bar/index.web'

describe('Web tabBar APIs', () => {
  afterEach(() => {
    delete global.__tabBar
  })

  test.each([
    ['setTabBarStyle', setTabBarStyle, { color: '#000000' }],
    ['setTabBarItem', setTabBarItem, { index: 0, text: 'home' }],
    ['showTabBar', showTabBar, {}],
    ['hideTabBar', hideTabBar, {}]
  ])('%s should not invoke fail after success', (name, api, options) => {
    global.__tabBar = {
      custom: false,
      isShow: true,
      list: [{}]
    }
    const success = jest.fn()
    const fail = jest.fn()
    const complete = jest.fn()

    api(Object.assign({}, options, {
      success,
      fail,
      complete
    }))

    expect(success).toHaveBeenCalledWith({
      errMsg: `${name}:ok`
    })
    expect(fail).not.toHaveBeenCalled()
    expect(complete).toHaveBeenCalledTimes(1)
  })
})
