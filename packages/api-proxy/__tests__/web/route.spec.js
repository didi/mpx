import {
  navigateTo,
  redirectTo,
  reLaunch,
  switchTab
} from '../../src/platform/api/route/index.web'

function createRouter () {
  return {
    currentRoute: {
      path: '/pages/current/index',
      query: {}
    },
    history: {
      current: {}
    },
    stack: [{}],
    match: jest.fn(url => ({ path: url, matched: [{}] })),
    resolve: jest.fn(url => ({ route: { path: url, matched: [{}] } })),
    push: jest.fn((location, onComplete) => onComplete()),
    replace: jest.fn((location, onComplete) => onComplete()),
    go: jest.fn()
  }
}

function createCallbacks () {
  return {
    success: jest.fn(),
    fail: jest.fn(),
    complete: jest.fn()
  }
}

describe('Web route APIs', () => {
  beforeEach(() => {
    global.__tabBarPagesMap = {
      'pages/tab/index': true
    }
    global.__mpxRouter = createRouter()
  })

  afterEach(() => {
    delete global.__tabBarPagesMap
    delete global.__mpxRouter
    delete global.__mpxEventChannel
  })

  describe('invalid route target', () => {
    test.each([
      ['navigateTo', navigateTo, 'push'],
      ['redirectTo', redirectTo, 'replace']
    ])('%s should stop after rejecting a tabBar page', (name, api, routerMethod) => {
      const callbacks = createCallbacks()

      api(Object.assign({
        url: '/pages/tab/index'
      }, callbacks))

      expect(callbacks.fail).toHaveBeenCalledTimes(1)
      expect(callbacks.success).not.toHaveBeenCalled()
      expect(callbacks.complete).toHaveBeenCalledTimes(1)
      expect(global.__mpxRouter[routerMethod]).not.toHaveBeenCalled()
    })

    test('switchTab should stop after rejecting a non-tabBar page', () => {
      const callbacks = createCallbacks()

      switchTab(Object.assign({
        url: '/pages/detail/index'
      }, callbacks))

      expect(callbacks.fail).toHaveBeenCalledTimes(1)
      expect(callbacks.success).not.toHaveBeenCalled()
      expect(callbacks.complete).toHaveBeenCalledTimes(1)
      expect(global.__mpxRouter.replace).not.toHaveBeenCalled()
    })
  })

  describe('single callback settlement', () => {
    test('reLaunch should invoke success and complete only once', () => {
      const callbacks = createCallbacks()

      reLaunch(Object.assign({
        url: '/pages/detail/index'
      }, callbacks))

      expect(callbacks.success).toHaveBeenCalledTimes(1)
      expect(callbacks.fail).not.toHaveBeenCalled()
      expect(callbacks.complete).toHaveBeenCalledTimes(1)
    })

    test('switchTab should invoke success and complete only once', () => {
      const callbacks = createCallbacks()

      switchTab(Object.assign({
        url: '/pages/tab/index'
      }, callbacks))

      expect(callbacks.success).toHaveBeenCalledTimes(1)
      expect(callbacks.fail).not.toHaveBeenCalled()
      expect(callbacks.complete).toHaveBeenCalledTimes(1)
    })
  })

  test.each([
    ['navigateTo', navigateTo],
    ['redirectTo', redirectTo],
    ['reLaunch', reLaunch],
    ['switchTab', switchTab]
  ])('%s rejects a missing page before any navigation side effects', (name, api) => {
    const router = global.__mpxRouter
    router.stack = [{}, {}, {}]
    router.resolve.mockReturnValue({ route: { path: '/pages/missing', matched: [] } })
    const calls = []
    const callbacks = createCallbacks()
    callbacks.fail.mockImplementation(() => calls.push('fail'))
    callbacks.complete.mockImplementation(() => calls.push('complete'))
    api(Object.assign({ url: '/pages/missing?foo=bar' }, callbacks))
    expect(calls).toEqual(['fail', 'complete'])
    expect(callbacks.fail).toHaveBeenCalledWith({ errMsg: `${name}:fail page "/pages/missing" is not found` })
    expect(callbacks.success).not.toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
    expect(router.go).not.toHaveBeenCalled()
    expect(router.stack).toHaveLength(3)
    expect(router.__mpxAction).toBeUndefined()
    expect(global.__mpxEventChannel).toBeUndefined()
  })
})
