/**
*@file 本地缓存相关API
**/
import storage from 'qStorage'
import { successHandler, failHandler } from '../../common/js'

function setStorageSync(key, data) {
  let obj = Object.create(null)
  obj['key'] = key
  obj['value'] = data

  try {
    storage.set(obj)
  } catch (e) {
    const error = Object.assign({ errMsg: 'setStorageSync:error' }, e)
    console.log(error)
  }
}

function setStorage(options) {
  return new Promise((resolve, reject) => {
    try {
      storage.set({
        key: options.key,
        value: options.data,
        success: function(data) {
          successHandler(data, options.success, options.complete)
          return resolve(data)
        },
        fail: function (data, code) {
          failHandler(code, options.fail, options.complete)
          return reject(code)
        }
      })
    } catch (e) {
      const error = Object.assign({ errMsg: 'setStorage:error' }, e)
      console.log(error)
    }
  })
}

function getStorageSync(key) {
  try {
    let info = storage.get({
      key: key,
      default: key || ''
    })
    return info
  } catch (e) {
    const error = Object.assign({ errMsg: 'getStorageSync:error' }, e)
    console.log('getStorageSync error', error)
  }
}

function getStorage(options) {
  return new Promise((resolve, reject) => {
    try {
      storage.get({
        key: options.key,
        default: options.key || '',
        success: function(data) {
          successHandler(data, options.success, options.complete)
          return resolve(data)
        },
        fail: function (data, code) {
          failHandler(code, options.fail, options.complete)
          return reject(code)
        }
      })
    } catch (e) {
      const error = Object.assign({ errMsg: 'getStorage:error' }, e)
      console.log('getStorage error', error)
    }
  })
}

function removeStorageSync(key) {
  try {
    storage.delete({
      key: key
    })
    console.log(storage.length)
  } catch (e) {
    const error = Object.assign({ errMsg: 'removeStorageSync:error' }, e)
    console.log('removeStorageSync error', error)
  }
}

function removeStorage(options) {
  return new Promise((resolve, reject) => {
    try {
      storage.delete({
        key: options.key,
        success: function(data) {
          console.log(storage.length)
          successHandler(data, options.success, options.complete)
          return resolve(data)
        },
        fail: function (data, code) {
          failHandler(code, options.fail, options.complete)
          return reject(code)
        }
      })
    } catch (e) {
      const error = Object.assign({ errMsg: 'removeStorage:error' }, e)
      console.log('removeStorage error', error)
    }
  })
}

function getStorageInfoSync() {
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
    return storageInfo
  } catch(e) {
    const error = Object.assign({ errMsg: 'getStorageInfoSync:error' }, e)
    console.log('getStorageInfoSync error', error)
  }
}

function getStorageInfo(options) {
  return new Promise((resolve, reject) => {
    try {
      let storageInfo = getStorageInfoSync(options.key)
      successHandler(storageInfo, options.success, options.complete)
      return resolve(storageInfo)
    } catch (e) {
      const error = Object.assign({ errMsg: 'getStorageInfo:error' }, e)
      console.log('getStorageInfo error', error)
      failHandler(error, options.fail, options.complete)
      return reject(error)
    }
  })
}

function clearStorageSync() {
  try {
    storage.clear({})
  } catch (e) {
    const error = Object.assign({ errMsg: 'clearStorageSync:error' }, e)
    console.log(error)
  }
}

function clearStorage(options) {
  return new Promise((resolve, reject) => {
    try {
      storage.clear({
        success: function(data) {
          successHandler(data, options.success, options.complete)
          return resolve(data)
        },
        fail: function (data, code) {
          failHandler(code, options.fail, options.complete)
          return reject(code)
        }
      })
    } catch (e) {
      const error = Object.assign({ errMsg: 'clearStorage:error' }, e)
      console.log(error)
    }
  })
}

export {
  setStorageSync,
  setStorage,
  removeStorageSync,
  removeStorage,
  getStorageSync,
  getStorage,
  getStorageInfoSync,
  getStorageInfo,
  clearStorageSync,
  clearStorage
}

