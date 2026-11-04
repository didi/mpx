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

  test.each(['ios', 'android', 'harmony'])('should use Dimensions change on %s', mode => {
    global.__mpx_mode__ = mode
    const callback = jest.fn()
    onWindowResize(callback)
    const [event, listener] = mockAddEventListener.mock.calls[0]
    expect(event).toBe('change')
    listener({ window: { width: 390, height: 844 } })
    expect(callback).toHaveBeenCalledWith({ size: { windowWidth: 390, windowHeight: 844 } })
    offWindowResize(callback)
  })

  test('should remove native subscription without callback', () => {
    onWindowResize(jest.fn())
    const subscription = mockSubscriptions[0]

    // 不传回调时，清空业务回调并释放 Dimensions 底层订阅。
    offWindowResize()

    expect(subscription.remove).toHaveBeenCalledTimes(1)
  })

  test('should not remove the same native subscription repeatedly', () => {
    onWindowResize(jest.fn())
    const subscription = mockSubscriptions[0]

    offWindowResize()
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
