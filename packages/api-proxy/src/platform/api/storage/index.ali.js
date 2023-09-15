import { getEnvObj } from '../../../common/js'

const ALI_OBJ = getEnvObj()

function setStorage (options) {
  ALI_OBJ.setStorage(options)
}

function setStorageSync (key, data) {
  ALI_OBJ.setStorageSync({
    key,
    data
  })
}

function getStorage (options) {
  ALI_OBJ.getStorage(options)
}

function getStorageSync (key) {
  return ALI_OBJ.getStorageSync({
    key
  }).data
}

function getStorageInfo (options) {
  return ALI_OBJ.getStorageInfo(options)
}

function getStorageInfoSync () {
  return ALI_OBJ.getStorageInfoSync()
}

function removeStorage (options) {
  return ALI_OBJ.removeStorage(options)
}

function removeStorageSync (key) {
  ALI_OBJ.removeStorageSync({
    key
  })
}

function clearStorage (options) {
  ALI_OBJ.clearStorage(options)
}

function clearStorageSync (options) {
  ALI_OBJ.clearStorageSync(options)
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
