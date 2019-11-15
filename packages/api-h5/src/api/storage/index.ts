import { handleSuccess, handleFail } from '../../common/ts/utils'

function setStorage (options: WechatMiniprogram.SetStorageOption = { key: '', data: ''}) {
  const { key, data, success, fail, complete } = options

  try {
    setStorageSync(key, data)

    const res = { errMsg: 'setStorage:ok' }
    handleSuccess(res, success, complete)
    return Promise.resolve(res)
  } catch (err) {
    const res = { errMsg: `setStorage:fail ${err}` }
    handleFail(res, fail, complete)
    return Promise.reject(res)
  }
}

function setStorageSync (key: string = '', data: any = '') {
  let obj = {}

  if (typeof data === 'symbol') {
    obj = { data: '' }
  } else {
    obj = { data }
  }
  window.localStorage.setItem(key, JSON.stringify(obj))
}

function getStorage (options: WechatMiniprogram.GetStorageOption = { key: '' }) {
  const { key, success, fail, complete } = options
  const { result, data } = getItem(key)

  if (result) {
    const res = { errMsg: 'getStorage:ok', data: data }
    handleSuccess(res, success, complete)
    return Promise.resolve(res)
  } else {
    const res = { errMsg: 'getStorage:fail', data: null }
    handleFail(res, fail, complete)
    return Promise.reject(res)
  }
}

function getStorageSync (key: string) {
  let res = getItem(key)
  if (res.result) return res.data

  return ''
}

function getItem (key: string) {
  let item
  try {
    item = JSON.parse(window.localStorage.getItem(key))
  } catch (e) {}

  if (item && typeof item === 'object' && item.hasOwnProperty('data')) {
    return { result: true, data: item.data }
  } else {
    return { result: false }
  }
}

function getStorageInfo (options: WechatMiniprogram.GetStorageInfoOption = {}) {
  const { success, fail, complete } = options

  try {
    const info = getStorageInfoSync()

    const res = Object.assign({}, { errMsg: 'getStorageInfo:ok' }, info)
    handleSuccess(res, success, complete)
    return Promise.resolve(res)
  } catch (err) {
    const res = { errMsg: `getStorageInfo:fail ${err}` }
    handleFail(res, fail, complete)
    return Promise.reject(res)
  }
}

function getStorageInfoSync () {
  return {
    keys: Object.keys(window.localStorage),
    limitSize: null,
    currentSize: null
  }
}

function removeStorage (options: WechatMiniprogram.RemoveStorageOption = { key: '' }) {
  const { key, success, fail, complete } = options

  try {
    removeStorageSync(key)

    const res = { errMsg: 'removeStorage:ok' }
    handleSuccess(res, success, complete)
    return Promise.resolve(res)
  } catch (err) {
    const res = { errMsg: `removeStorage:fail ${err}` }
    handleFail(res, fail, complete)
    return Promise.reject(res)
  }
}

function removeStorageSync (key) {
  window.localStorage.removeItem(key)
}

function clearStorage (options: WechatMiniprogram.ClearStorageOption = {}) {
  const { success, fail, complete } = options

  try {
    clearStorageSync()

    const res = { errMsg: 'clearStorage:ok' }
    handleSuccess(res, success, complete)
    return Promise.resolve(res)
  } catch (err) {
    const res = { errMsg: `clearStorage:fail ${err}` }
    handleFail(res, fail, complete)
    return Promise.reject(res)
  }
}

function clearStorageSync () {
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
