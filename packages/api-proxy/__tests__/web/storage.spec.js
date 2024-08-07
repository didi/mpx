import {
  setStorage,
  setStorageSync,
  getStorage,
  getStorageSync,
  getStorageInfo,
  getStorageInfoSync,
  removeStorage,
  clearStorage,
  clearStorageSync
} from '../../src/platform/api/storage/index.web'

const storageKey = 'storage key'
const storageValue = 'storage value'
const storageSyncKey = 'storage sync key'
const storageSyncValue = {
  'test key': 'storage sync value'
}

describe('test storage', () => {
  beforeAll(() => {
    window.localStorage.clear()
  })

  test('setStorageSync & getStorageSync', () => {
    setStorageSync(storageKey, storageValue)
    const getValue = getStorageSync(storageKey)
    expect(getValue).toBe(storageValue)
  })

  test('setStorage', () => {
    const success = jest.fn()
    const fail = jest.fn()
    const complete = jest.fn()

    setStorage({
      key: storageSyncKey,
      data: storageSyncValue,
      success,
      fail,
      complete
    })

    expect(success.mock.calls.length).toBe(1)
    expect(fail.mock.calls.length).toBe(0)
    expect(complete.mock.calls.length).toBe(1)
  })

  test('getStorage', () => {
    const success = jest.fn()
    const fail = jest.fn()
    const complete = jest.fn()

    getStorage({
      key: storageSyncKey,
      success,
      fail,
      complete
    })

    expect(success.mock.calls.length).toBe(1)
    expect(success.mock.calls[0][0].data).toEqual(storageSyncValue)
    expect(fail.mock.calls.length).toBe(0)
    expect(complete.mock.calls.length).toBe(1)
  })

  test('getStorageInfo', () => {
    const success = jest.fn()
    const fail = jest.fn()
    const complete = jest.fn()

    getStorageInfo({
      success,
      fail,
      complete
    })

    expect(success.mock.calls.length).toBe(1)
    expect(success.mock.calls[0][0].keys).toEqual([storageKey, storageSyncKey])
    expect(fail.mock.calls.length).toBe(0)
    expect(complete.mock.calls.length).toBe(1)
  })

  test('removeStorage', () => {
    const success = jest.fn()
    const fail = jest.fn()
    const complete = jest.fn()

    removeStorage({
      key: storageKey,
      success,
      fail,
      complete
    })

    expect(success.mock.calls.length).toBe(1)
    expect(fail.mock.calls.length).toBe(0)
    expect(complete.mock.calls.length).toBe(1)
    expect(getStorageInfoSync()).toEqual({ keys: [storageSyncKey], limitSize: null, currentSize: null })
  })

  test('clearStorage', () => {
    const success = jest.fn()
    const fail = jest.fn()
    const complete = jest.fn()

    clearStorage({
      success,
      fail,
      complete
    })

    expect(success.mock.calls.length).toBe(1)
    expect(fail.mock.calls.length).toBe(0)
    expect(complete.mock.calls.length).toBe(1)
    expect(Object.keys(window.localStorage)).toEqual([])
  })

  test('clearStorageSync', () => {
    setStorageSync(storageKey, storageValue)
    expect(Object.keys(window.localStorage)).toEqual([storageKey])
    clearStorageSync()
    expect(Object.keys(window.localStorage)).toEqual([])
  })
})
