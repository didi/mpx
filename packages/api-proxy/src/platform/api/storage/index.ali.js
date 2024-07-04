import { ENV_OBJ } from '../../../common/js'

function setStorage (options) {
  return ENV_OBJ.setStorage(options)
}

function setStorageSync (key, data) {
  return ENV_OBJ.setStorageSync({
    key,
    data
  })
}

function getStorage (options) {
  return ENV_OBJ.getStorage(options)
}

function getStorageSync (key) {
  return ENV_OBJ.getStorageSync({
    key
  }).data
}

function getStorageInfo (options) {
  return ENV_OBJ.getStorageInfo(options)
}

function getStorageInfoSync () {
  return ENV_OBJ.getStorageInfoSync()
}

function removeStorage (options) {
  return ENV_OBJ.removeStorage(options)
}

function removeStorageSync (key) {
  return ENV_OBJ.removeStorageSync({
    key
  })
}

function clearStorage (options) {
  return ENV_OBJ.clearStorage(options)
}

function clearStorageSync (options) {
  return ENV_OBJ.clearStorageSync(options)
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
