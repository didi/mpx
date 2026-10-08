import WifiManager from 'react-native-wifi-reborn'
import { PermissionsAndroid } from 'react-native'
import {
  startWifi,
  stopWifi,
  getWifiList,
  onGetWifiList,
  offGetWifiList
} from '../../src/platform/api/device/wifi/index.ios'

jest.mock('react-native', () => ({
  PermissionsAndroid: {
    PERMISSIONS: {
      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION'
    },
    RESULTS: {
      GRANTED: 'granted'
    },
    request: jest.fn()
  }
}), { virtual: true })

jest.mock('@mpxjs/core', () => ({
  __esModule: true,
  default: {
    config: {}
  }
}))

jest.mock('@mpxjs/utils', () => ({
  noop: jest.fn(),
  type: value => Object.prototype.toString.call(value).slice(8, -1)
}))

jest.mock('react-native-wifi-reborn', () => ({
  __esModule: true,
  default: {
    isEnabled: jest.fn(),
    reScanAndLoadWifiList: jest.fn()
  }
}), { virtual: true })

describe('RN Wi-Fi APIs', () => {
  beforeEach(() => {
    global.__mpx_mode__ = 'android'
    stopWifi()
    offGetWifiList()
    jest.clearAllMocks()
    PermissionsAndroid.request.mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED)
    WifiManager.isEnabled.mockResolvedValue(true)
  })

  test('startWifi should return the WeChat-compatible success errMsg', async () => {
    const complete = jest.fn()
    const result = await new Promise((resolve, reject) => {
      startWifi({ success: resolve, fail: reject, complete })
    })

    expect(result).toEqual({ errMsg: 'startWifi:ok' })
    expect(complete).toHaveBeenCalledWith(result)
  })

  test('stopWifi should return the WeChat-compatible success errMsg', () => {
    const success = jest.fn()
    const complete = jest.fn()

    stopWifi({ success, complete })

    const result = { errMsg: 'stopWifi:ok' }
    expect(success).toHaveBeenCalledWith(result)
    expect(complete).toHaveBeenCalledWith(result)
  })

  test('stopWifi should preserve Wi-Fi list listeners', async () => {
    const listener = jest.fn()

    await new Promise((resolve, reject) => {
      startWifi({ success: resolve, fail: reject })
    })
    onGetWifiList(listener)
    stopWifi()
    await new Promise((resolve, reject) => {
      startWifi({ success: resolve, fail: reject })
    })
    WifiManager.reScanAndLoadWifiList.mockResolvedValue([])
    await new Promise((resolve, reject) => {
      getWifiList({ success: resolve, fail: reject })
    })

    expect(listener).toHaveBeenCalledWith({ wifiList: [] })
    offGetWifiList(listener)
  })

  test('offGetWifiList should remove the specified listener after stopWifi', async () => {
    const removedListener = jest.fn()
    const retainedListener = jest.fn()

    await new Promise((resolve, reject) => {
      startWifi({ success: resolve, fail: reject })
    })
    onGetWifiList(removedListener)
    onGetWifiList(retainedListener)
    stopWifi()
    offGetWifiList(removedListener)
    await new Promise((resolve, reject) => {
      startWifi({ success: resolve, fail: reject })
    })
    WifiManager.reScanAndLoadWifiList.mockResolvedValue([])
    await new Promise((resolve, reject) => {
      getWifiList({ success: resolve, fail: reject })
    })

    expect(removedListener).not.toHaveBeenCalled()
    expect(retainedListener).toHaveBeenCalledWith({ wifiList: [] })
  })

  test('offGetWifiList should remove all listeners without callback', async () => {
    const firstListener = jest.fn()
    const secondListener = jest.fn()

    await new Promise((resolve, reject) => {
      startWifi({ success: resolve, fail: reject })
    })
    onGetWifiList(firstListener)
    onGetWifiList(secondListener)
    offGetWifiList()
    WifiManager.reScanAndLoadWifiList.mockResolvedValue([])
    await new Promise((resolve, reject) => {
      getWifiList({ success: resolve, fail: reject })
    })

    expect(firstListener).not.toHaveBeenCalled()
    expect(secondListener).not.toHaveBeenCalled()
  })

  test('onGetWifiList should not register the same callback repeatedly', async () => {
    const listener = jest.fn()

    await new Promise((resolve, reject) => {
      startWifi({ success: resolve, fail: reject })
    })
    onGetWifiList(listener)
    onGetWifiList(listener)
    WifiManager.reScanAndLoadWifiList.mockResolvedValue([])
    await new Promise((resolve, reject) => {
      getWifiList({ success: resolve, fail: reject })
    })

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith({ wifiList: [] })
  })

  test('getWifiList should return the WeChat-compatible success errMsg', async () => {
    await new Promise((resolve, reject) => {
      startWifi({ success: resolve, fail: reject })
    })
    WifiManager.reScanAndLoadWifiList.mockResolvedValue([])
    const complete = jest.fn()
    const result = await new Promise((resolve, reject) => {
      getWifiList({ success: resolve, fail: reject, complete })
    })

    expect(result).toEqual({
      errMsg: 'getWifiList:ok',
      errno: 0,
      errCode: 0
    })
    expect(complete).toHaveBeenCalledWith(result)
  })

  test('getWifiList should normalize native scan failures', async () => {
    await new Promise((resolve, reject) => {
      startWifi({ success: resolve, fail: reject })
    })
    WifiManager.reScanAndLoadWifiList.mockRejectedValue(new Error('native scan error'))
    const fail = jest.fn()
    const complete = jest.fn()

    await new Promise(resolve => {
      getWifiList({
        fail (result) {
          fail(result)
          resolve()
        },
        complete
      })
    })

    const result = {
      errMsg: 'getWifiList:fail'
    }
    expect(fail).toHaveBeenCalledWith(result)
    expect(complete).toHaveBeenCalledWith(result)
  })
})
