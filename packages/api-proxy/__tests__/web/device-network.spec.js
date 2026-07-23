import {
  getNetworkType,
  offNetworkStatusChange,
  onNetworkStatusChange
} from '../../src/platform/api/device/network/index.web'

describe('test getNetworkType', () => {
  test('should be enums value', () => {
    getNetworkType(function ({ networkType }) {
      expect(['wifi', '2g', '3g', '4g', '5g', 'unknown', 'none'].includes(networkType)).toBe(true)
    })
  })
})

describe('test onNetworkStatusChange', () => {
  test('should remove all proxy callbacks when the same callback is registered repeatedly', () => {
    // 模拟浏览器 Network Information API，并记录监听的注册和移除情况。
    const addEventListener = jest.fn()
    const removeEventListener = jest.fn()
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: {
        addEventListener,
        removeEventListener
      }
    })
    const callback = jest.fn()

    onNetworkStatusChange(callback)
    onNetworkStatusChange(callback)
    offNetworkStatusChange()

    // 同一个业务回调重复注册时会生成不同的代理回调，清空监听时二者都应被移除。
    const firstProxyCallback = addEventListener.mock.calls[0][1]
    const secondProxyCallback = addEventListener.mock.calls[1][1]
    expect(firstProxyCallback).not.toBe(secondProxyCallback)
    expect(removeEventListener).toHaveBeenCalledTimes(2)
    expect(removeEventListener).toHaveBeenCalledWith('change', firstProxyCallback)
    expect(removeEventListener).toHaveBeenCalledWith('change', secondProxyCallback)
  })

  test('should remove all proxy callbacks for the specified callback', () => {
    const addEventListener = jest.fn()
    const removeEventListener = jest.fn()
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: {
        addEventListener,
        removeEventListener
      }
    })
    const callback = jest.fn()

    // 指定业务回调注销时，也要移除该回调重复注册产生的全部代理回调。
    onNetworkStatusChange(callback)
    onNetworkStatusChange(callback)
    offNetworkStatusChange(callback)

    expect(removeEventListener).toHaveBeenCalledTimes(2)
    addEventListener.mock.calls.forEach(([, proxyCallback]) => {
      expect(removeEventListener).toHaveBeenCalledWith('change', proxyCallback)
    })
  })
})
