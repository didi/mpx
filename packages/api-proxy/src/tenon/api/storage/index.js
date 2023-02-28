import { webHandleSuccess, webHandleFail, warn, hasOwn } from '../../../common/js'
const { Storage } = __GLOBAL__

function setStorage (options = {}) {
  const { key, data, success, fail, complete } = options

  try {
    setStorageSync(key, data)

    const res = { errMsg: 'setStorage:ok' }
    webHandleSuccess(res, success, complete)
    return Promise.resolve(res)
  } catch (err) {
    const res = { errMsg: `setStorage:fail ${err}` }
    webHandleFail(res, fail, complete)
    return Promise.reject(res)
  }
}

function setStorageSync (key = '', data) {
  let obj = {}

  if (typeof data === 'symbol') {
    obj = { data: '' }
  } else {
    obj = { data }
  }
  Storage.set(key, JSON.stringify(obj))
}

function getStorage (options = {}) {
  const { key, success, fail, complete } = options
  const { result, data } = getItem(key)

  if (result) {
    const res = { errMsg: 'getStorage:ok', data: data }
    webHandleSuccess(res, success, complete)
    return Promise.resolve(res)
  } else {
    const res = { errMsg: 'getStorage:fail', data: null }
    webHandleFail(res, fail, complete)
    return Promise.reject(res)
  }
}

function getStorageSync (key) {
  const res = getItem(key)
  if (res.result) return res.data

  return ''
}

function getItem (key) {
  let item
  try {
    item = JSON.parse(Storage.get(key))
  } catch (e) {}

  if (item && typeof item === 'object' && hasOwn(item, 'data')) {
    return { result: true, data: item.data }
  } else {
    return { result: false }
  }
}

function getStorageInfo (options = {}) {
  const { success, fail, complete } = options

  try {
    const info = getStorageInfoSync()

    const res = Object.assign({}, { errMsg: 'getStorageInfo:ok' }, info)
    webHandleSuccess(res, success, complete)
    return Promise.resolve(res)
  } catch (err) {
    const res = { errMsg: `getStorageInfo:fail ${err}` }
    webHandleFail(res, fail, complete)
    return Promise.reject(res)
  }
}

function getStorageInfoSync () {
  return {
    keys: Object.keys(Storage),
    limitSize: null,
    currentSize: null
  }
}

function removeStorage (options = { key: '' }) {
  const { key, success, fail, complete } = options

  try {
    removeStorageSync(key)

    const res = { errMsg: 'removeStorage:ok' }
    webHandleSuccess(res, success, complete)
    return Promise.resolve(res)
  } catch (err) {
    const res = { errMsg: `removeStorage:fail ${err}` }
    webHandleFail(res, fail, complete)
    return Promise.reject(res)
  }
}

function removeStorageSync (key) {
  Storage.remove(key)
}

function clearStorage (options = {}) {
  warn('不支持clearStorageSync')
  // const { success, fail, complete } = options

  // try {
  //   clearStorageSync()

  //   const res = { errMsg: 'clearStorage:ok' }
  //   webHandleSuccess(res, success, complete)
  //   return Promise.resolve(res)
  // } catch (err) {
  //   const res = { errMsg: `clearStorage:fail ${err}` }
  //   webHandleFail(res, fail, complete)
  //   return Promise.reject(res)
  // }
}

function clearStorageSync () {
  // Storage.clear()
  warn('不支持clearStorageSync')
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
