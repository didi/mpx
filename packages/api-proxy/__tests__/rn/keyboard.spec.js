const mockSubscriptions = []
const mockAddListener = jest.fn(eventName => {
  // RN 新版 addListener 返回订阅对象，业务代码只能移除自己持有的订阅。
  const subscription = {
    eventName,
    remove: jest.fn()
  }
  mockSubscriptions.push(subscription)
  return subscription
})
const mockRemoveAllListeners = jest.fn()

jest.mock('react-native', () => ({
  Keyboard: {
    addListener: mockAddListener,
    removeAllListeners: mockRemoveAllListeners
  }
}), { virtual: true })

const {
  onKeyboardHeightChange,
  offKeyboardHeightChange
} = require('../../src/platform/api/keyboard/index.ios')

describe('RN keyboard', () => {
  beforeEach(() => {
    offKeyboardHeightChange()
    mockSubscriptions.length = 0
    mockAddListener.mockClear()
    mockRemoveAllListeners.mockClear()
  })

  it('should only remove owned subscriptions when called without callback', () => {
    onKeyboardHeightChange(jest.fn())

    offKeyboardHeightChange()

    // 不传回调会清空业务回调，但不能调用 removeAllListeners 误删外部监听。
    expect(mockSubscriptions).toHaveLength(2)
    mockSubscriptions.forEach(subscription => {
      expect(subscription.remove).toHaveBeenCalledTimes(1)
    })
    expect(mockRemoveAllListeners).not.toHaveBeenCalled()
  })

  it('should only remove owned subscriptions when the last callback is removed', () => {
    const callback = jest.fn()
    onKeyboardHeightChange(callback)

    offKeyboardHeightChange(callback)

    // 最后一个业务回调移除后，键盘显示和隐藏两个底层订阅都应释放。
    mockSubscriptions.forEach(subscription => {
      expect(subscription.remove).toHaveBeenCalledTimes(1)
    })
    expect(mockRemoveAllListeners).not.toHaveBeenCalled()
  })

  it('should subscribe again after all callbacks are removed', () => {
    const callback = jest.fn()
    onKeyboardHeightChange(callback)
    offKeyboardHeightChange(callback)

    onKeyboardHeightChange(jest.fn())

    // 首轮订阅释放后再次注册，需要重新创建两个底层订阅。
    expect(mockAddListener).toHaveBeenCalledTimes(4)
  })
})
