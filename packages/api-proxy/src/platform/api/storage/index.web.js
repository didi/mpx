import { successHandle, failHandle, isBrowser, throwSSRWarning } from '../../../common/js'
import { hasOwn } from '@mpxjs/utils'

function setStorage (options = {}) {
  if (!isBrowser) {
    throwSSRWarning('setStorage API is running in non browser environments')
    return
  }
  const { key, data, success, fail, complete } = options

  try {
    setStorageSync(key, data)

    const res = { errMsg: 'setStorage:ok' }
    successHandle(res, success, complete)
  } catch (err) {
    const res = { errMsg: `setStorage:fail ${err}` }
    failHandle(res, fail, complete)
  }
}

function setStorageSync (key = '', data) {
  if (!isBrowser) {
    throwSSRWarning('setStorageSync API is running in non browser environments')
    return
  }
  let obj = {}

  if (typeof data === 'symbol') {
    obj = { data: '' }
  } else {
    obj = { data }
  }
  window.localStorage.setItem(key, JSON.stringify(obj))
}

function getStorage (options = {}) {
  if (!isBrowser) {
    throwSSRWarning('getStorage API is running in non browser environments')
    return
  }
  const { key, success, fail, complete } = options
  const { result, data } = getItem(key)

  if (result) {
    const res = { errMsg: 'getStorage:ok', data: data }
    successHandle(res, success, complete)
  } else {
    const res = { errMsg: 'getStorage:fail', data: null }
    failHandle(res, fail, complete)
  }
}

function getStorageSync (key) {
  if (!isBrowser) {
    throwSSRWarning('getStorageSync API is running in non browser environments')
    return
  }
  const res = getItem(key)
  if (res.result) return res.data

  return ''
}

function getItem (key) {
  let item
  try {
    item = JSON.parse(window.localStorage.getItem(key))
  } catch (e) {
  }

  if (hasOwn(item, 'data')) {
    return { result: true, data: item.data }
  } else {
    return { result: false }
  }
}

function getStorageInfo (options = {}) {
  if (!isBrowser) {
    throwSSRWarning('getStorageInfo API is running in non browser environments')
    return
  }
  const { success, fail, complete } = options

  try {
    const info = getStorageInfoSync()

    const res = Object.assign({}, { errMsg: 'getStorageInfo:ok' }, info)
    successHandle(res, success, complete)
  } catch (err) {
    const res = { errMsg: `getStorageInfo:fail ${err}` }
    failHandle(res, fail, complete)
  }
}

function getStorageInfoSync () {
  if (!isBrowser) {
    throwSSRWarning('getStorageInfoSync API is running in non browser environments')
    return
  }
  return {
    keys: Object.keys(window.localStorage),
    limitSize: null,
    currentSize: null
  }
}

function removeStorage (options = { key: '' }) {
  if (!isBrowser) {
    throwSSRWarning('removeStorage API is running in non browser environments')
    return
  }
  const { key, success, fail, complete } = options

  try {
    removeStorageSync(key)

    const res = { errMsg: 'removeStorage:ok' }
    successHandle(res, success, complete)
  } catch (err) {
    const res = { errMsg: `removeStorage:fail ${err}` }
    failHandle(res, fail, complete)
  }
}

function removeStorageSync (key) {
  if (!isBrowser) {
    throwSSRWarning('getStorageInfoSync API is running in non browser environments')
    return
  }
  window.localStorage.removeItem(key)
}

function clearStorage (options = {}) {
  if (!isBrowser) {
    throwSSRWarning('clearStorage API is running in non browser environments')
    return
  }
  const { success, fail, complete } = options

  try {
    clearStorageSync()

    const res = { errMsg: 'clearStorage:ok' }
    successHandle(res, success, complete)
  } catch (err) {
    const res = { errMsg: `clearStorage:fail ${err}` }
    failHandle(res, fail, complete)
  }
}

function clearStorageSync () {
  if (!isBrowser) {
    throwSSRWarning('clearStorageSync API is running in non browser environments')
    return
  }
  window.localStorage.clear()
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
