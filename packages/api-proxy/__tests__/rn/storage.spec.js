import AsyncStorage from '@react-native-async-storage/async-storage'
import { getStorageInfo, removeStorageSync, clearStorageSync } from '../../src/platform/api/storage/rnStorage'

jest.mock('@react-native-async-storage/async-storage', () => ({
  getAllKeys: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}), { virtual: true })

describe('RN storage APIs', () => {
  beforeEach(() => {
    global.mpxGlobal = global
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    delete global.mpxGlobal
  })

  test('sync APIs should report unsupported environment errors', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation()

    removeStorageSync('key')
    clearStorageSync()

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('环境不支持removeStorageSync方法'))
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('环境不支持clearStorageSync方法'))
    expect(AsyncStorage.removeItem).not.toHaveBeenCalled()
    expect(AsyncStorage.clear).not.toHaveBeenCalled()
  })

  test('getStorageInfo should use the correct API name when it fails', () => {
    const error = new Error('get keys failed')
    const fail = jest.fn()
    const complete = jest.fn()
    AsyncStorage.getAllKeys.mockImplementation(callback => callback(error))

    getStorageInfo({
      fail,
      complete
    })

    const result = {
      errMsg: 'getStorageInfo:fail Error: get keys failed'
    }
    expect(fail).toHaveBeenCalledWith(result)
    expect(complete).toHaveBeenCalledWith(result)
  })
})
