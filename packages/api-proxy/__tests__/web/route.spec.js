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
    match: jest.fn(url => ({ path: url })),
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
})
