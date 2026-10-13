const mockUnsubscribe = jest.fn()
const mockAddEventListener = jest.fn(() => mockUnsubscribe)

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: mockAddEventListener,
    fetch: jest.fn()
  },
  NetInfoStateType: {
    cellular: 'cellular',
    none: 'none',
    wifi: 'wifi'
  }
}), { virtual: true })

jest.mock('../../src/common/js', () => ({
  successHandle: jest.fn(),
  failHandle: jest.fn(),
  defineUnsupportedProps: jest.fn()
}))

const {
  getNetworkType,
  offNetworkStatusChange,
  onNetworkStatusChange
} = require('../../src/platform/api/device/network/rnNetwork')
const NetInfo = require('@react-native-community/netinfo').default
const { failHandle } = require('../../src/common/js')

describe('RN network events', () => {
  beforeEach(() => {
    offNetworkStatusChange()
    mockAddEventListener.mockClear()
    mockUnsubscribe.mockClear()
    NetInfo.fetch.mockReset()
    failHandle.mockClear()
  })

  test('should clear callbacks and native subscription when callback is null', () => {
    onNetworkStatusChange(jest.fn())

    // null 与 undefined 含义一致，都应清空回调并释放 NetInfo 底层订阅。
    offNetworkStatusChange(null)

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })

  test('should release native subscription after the last callback is removed', () => {
    const callbackA = jest.fn()
    const callbackB = jest.fn()
    onNetworkStatusChange(callbackA)
    onNetworkStatusChange(callbackB)

    offNetworkStatusChange(callbackA)
    expect(mockUnsubscribe).not.toHaveBeenCalled()

    offNetworkStatusChange(callbackB)
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })

  test('should subscribe again after all callbacks are removed', () => {
    onNetworkStatusChange(jest.fn())
    offNetworkStatusChange()

    // 底层订阅释放后再次调用 on，需要重新向 NetInfo 注册。
    onNetworkStatusChange(jest.fn())

    expect(mockAddEventListener).toHaveBeenCalledTimes(2)
  })

  test('getNetworkType should include API name when fetching fails', async () => {
    const fail = jest.fn()
    const complete = jest.fn()
    NetInfo.fetch.mockRejectedValue(new Error('fetch failed'))

    getNetworkType({ fail, complete })
    await Promise.resolve()
    await Promise.resolve()

    expect(failHandle).toHaveBeenCalledWith({
      errMsg: 'getNetworkType:fail fetch failed'
    }, fail, complete)
  })
})
