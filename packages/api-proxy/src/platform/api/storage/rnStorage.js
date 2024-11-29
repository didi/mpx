import AsyncStorage from '@react-native-async-storage/async-storage'
import { envError, successHandle, failHandle, defineUnsupportedProps } from '../../../common/js'
import { hasOwn } from '@mpxjs/utils'
function setStorage (options = {}) {
  const { key, data, success, fail, complete } = options
  let obj = {}
  if (typeof data === 'symbol') {
    obj = { data: '' }
  } else {
    obj = { data }
  }
  AsyncStorage.setItem(key, JSON.stringify(obj), (err) => {
    if (err) {
      const result = {
        errMsg: `setStorage:fail ${err}`
      }
      failHandle(result, fail, complete)
      return
    }
    const result = {
      errMsg: 'setStorage:ok'
    }
    successHandle(result, success, complete)
  })
}

const setStorageSync = envError('setStorageSync')

function getStorage (options = {}) {
  const { key, success, fail, complete } = options
  if (!key) {
    const result = {
      errMsg: 'getStorage:fail parameter error: parameter.key should be String instead of Undefined;'
    }
    failHandle(result, fail, complete)
    return
  }
  AsyncStorage.getItem(key, (err, res) => {
    if (err || !res) {
      const result = {
        errMsg: `getStorage:fail ${err || 'data not found'}`
      }
      failHandle(result, fail, complete)
      return
    }
    let item
    let data = null
    try {
      item = JSON.parse(res)
    } catch (e) {
    }
    if (item && typeof item === 'object' && hasOwn(item, 'data')) {
      data = item.data
    }
    const result = {
      errMsg: 'getStorage:ok',
      data
    }
    successHandle(result, success, complete)
  })
}

const getStorageSync = envError('getStorageSync')

function getStorageInfo (options = {}) {
  const { success, fail, complete } = options
  AsyncStorage.getAllKeys((err, keys) => {
    if (err) {
      const result = {
        errMsg: `getStorage:fail ${err}`
      }
      failHandle(result, fail, complete)
      return
    }
    const result = {
      keys,
      errMsg: 'getStorageInfo:ok'
    }
    defineUnsupportedProps(result, ['currentSize', 'limitSize'])
    successHandle(result, success, complete)
  })
}

const getStorageInfoSync = envError('getStorageInfoSync')

function removeStorage (options = {}) {
  const { key, success, fail, complete } = options
  AsyncStorage.removeItem(key, (err) => {
    if (err) {
      const result = {
        errMsg: `removeStorage:fail ${err}`
      }
      failHandle(result, fail, complete)
      return
    }
    const result = {
      errMsg: 'removeStorage:ok'
    }
    successHandle(result, success, complete)
  })
}

function removeStorageSync (key) {
  AsyncStorage.removeItem(key)
}

function clearStorage (options = {}) {
  const { success, fail, complete } = options
  AsyncStorage.clear((err) => {
    if (err) {
      const result = {
        errMsg: `clearStorage:fail ${err}`
      }
      failHandle(result, fail, complete)
      return
    }
    const result = {
      errMsg: 'clearStorage:ok'
    }
    successHandle(result, success, complete)
  })
}

function clearStorageSync () {
  AsyncStorage.clear()
}

export {
  setStorage,
  setStorageSync,
  getStorage,
  getStorageSync,
  getStorageInfo,
  getStorageInfoSync,
  removeStorage,
  removeStorageSync,
  clearStorage,
  clearStorageSync
}
