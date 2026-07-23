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

const {
  offNetworkStatusChange,
  onNetworkStatusChange
} = require('../../src/platform/api/device/network/rnNetwork')

describe('RN network events', () => {
  beforeEach(() => {
    offNetworkStatusChange()
    mockAddEventListener.mockClear()
    mockUnsubscribe.mockClear()
  })

  test('should clear callbacks and native subscription when callback is null', () => {
    onNetworkStatusChange(jest.fn())

    // null 与 undefined 含义一致，都应清空回调并释放 NetInfo 底层订阅。
    offNetworkStatusChange(null)

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })

  test('should subscribe again after all callbacks are removed', () => {
    onNetworkStatusChange(jest.fn())
    offNetworkStatusChange()

    // 底层订阅释放后再次调用 on，需要重新向 NetInfo 注册。
    onNetworkStatusChange(jest.fn())

    expect(mockAddEventListener).toHaveBeenCalledTimes(2)
  })
})
