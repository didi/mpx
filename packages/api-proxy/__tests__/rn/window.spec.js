const mockSubscriptions = []
const mockAddEventListener = jest.fn(() => {
  const subscription = { remove: jest.fn() }
  mockSubscriptions.push(subscription)
  return subscription
})

jest.mock('react-native', () => ({
  Dimensions: {
    addEventListener: mockAddEventListener
  }
}), { virtual: true })

const {
  offWindowResize,
  onWindowResize
} = require('../../src/platform/api/window/rnWindow')

describe('RN window resize', () => {
  beforeEach(() => {
    offWindowResize()
    mockSubscriptions.length = 0
    mockAddEventListener.mockClear()
  })

  test('should remove native subscription without callback', () => {
    onWindowResize(jest.fn())
    const subscription = mockSubscriptions[0]

    // 不传回调时，清空业务回调并释放 Dimensions 底层订阅。
    offWindowResize()

    expect(subscription.remove).toHaveBeenCalledTimes(1)
  })

  test('should keep subscription until the last callback is removed', () => {
    const firstCallback = jest.fn()
    const secondCallback = jest.fn()
    onWindowResize(firstCallback)
    onWindowResize(secondCallback)
    const subscription = mockSubscriptions[0]

    offWindowResize(firstCallback)
    expect(subscription.remove).not.toHaveBeenCalled()

    // 最后一个业务回调移除后才释放共用的底层订阅。
    offWindowResize(secondCallback)
    expect(subscription.remove).toHaveBeenCalledTimes(1)
  })
})
