import WifiManager from 'react-native-wifi-reborn'
import { PermissionsAndroid } from 'react-native'
import {
  startWifi,
  stopWifi,
  getWifiList
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
})
