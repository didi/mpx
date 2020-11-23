/**
*@file 本地缓存相关API
**/
import storage from 'qStorage'
import { successHandler, failHandler } from '../../common/js'

function setStorageSync(key, data) {
  let obj = Object.create(null)
  obj[key] = data

  try {
    storage.set(obj)
  } catch (e) {
    const error = Object.assign({ errMsg: 'setStorageSync:error' }, e)
    console.log(error)
  }
}

function setStorage(options) {
  return new Promise((resolve, reject) => {
    storage.set(options)
  }).then(res => {
    successHandler(res, options.success, options.complete)
    resolve()
  }).catch(err => {
    failHandler(err, options.fail, options.complete)
    reject()
  })
}

function removeStorageSync(key) {
  let obj = Object.create(null)
  obj['key'] = key

  try {
    storage.delete(obj)
  } catch (e) {
    const error = Object.assign({ errMsg: 'removeStorageSync:error' }, e)
    console.log(error)
  }
}

function removeStorage(options) {
  return new Promise((resolve, reject) => {
    storage.set(options)
  }).then(res => {
    successHandler(res, options.success, options.complete)
    resolve()
  }).catch(e => {
    const error = Object.assign({ errMsg: 'removeStorage:error' }, e)
    failHandler(error, options.fail, options.complete)
    reject()
  })
}

function getStorageSync(key) {
  let obj = Object.create(null)
  obj['key'] = key

  try {
    storage.get(obj)
  } catch (e) {
    const error = Object.assign({ errMsg: 'getStorageSync:error' }, e)
    console.log(error)
  }
}

function getStorage(options) {
  return new Promise((resolve, reject) => {
    storage.get(options)
  }).then(res => {
    successHandler(res, options.success, options.complete)
    resolve()
  }).catch(e => {
    const error = Object.assign({ errMsg: 'getStorage:error' }, e)
    failHandler(error, options.fail, options.complete)
    reject()
  })
}

function getStorageInfo() {
  let storageInfo = Object.create(null)
  let keys = []

  try {
    let length = storage.length
    for (let i = 0; i < length; i++) {
      storage.key({
        index: i,
        success: function(data) {
          keys.push(data)
        }
      })
    }
    storageInfo['keys'] = keys
    storageInfo = Object.assign({}, storageInfo, {
      currentSize: 'It does not support for getting storage limitSize on quick app',
      limitSize: 'It does not support for getting storage limitSize on quick app'
    })
    successHandler(storageInfo, options.success, options.complete)
    return storageInfo
  } catch(e) {
    const error = Object.assign({ errMsg: 'getStorageInfo:error' }, e)
    failHandler(error, options.fail, options.complete)
  }
}

function clearStorageSync() {
  try {
    storage.clear({})
  } catch (e) {
    const error = Object.assign({ errMsg: 'removeStorageSync:error' }, e)
    console.log(error)
  }
}

function clearStorage() {
  return new Promise((resolve, reject) => {
    storage.clear(options)
  }).then(res => {
    successHandler(res, options.success, options.complete)
    resolve()
  }).catch(e => {
    const error = Object.assign({ errMsg: 'clearStorage:error' }, e)
    failHandler(error, options.fail, options.complete)
    reject()
  })
}

export {
  setStorageSync,
  setStorage,
  removeStorageSync,
  removeStorage,
  getStorageSync,
  getStorage,
  getStorageInfo,
  clearStorageSync,
  clearStorage
}

