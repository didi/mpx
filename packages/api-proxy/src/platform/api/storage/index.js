import { ENV_OBJ, envError } from '../../../common/js'

const setStorage = ENV_OBJ.setStorage || envError('setStorage')

const setStorageSync = ENV_OBJ.setStorageSync || envError('setStorageSync')

const getStorage = ENV_OBJ.getStorage || envError('getStorage')

const getStorageSync = ENV_OBJ.getStorageSync || envError('getStorageSync')

const getStorageInfo = ENV_OBJ.getStorageInfo || envError('getStorageInfo')

const getStorageInfoSync = ENV_OBJ.getStorageInfoSync || envError('getStorageInfoSync')

const removeStorage = ENV_OBJ.removeStorage || envError('removeStorage')

const removeStorageSync = ENV_OBJ.removeStorageSync || envError('removeStorageSync')

const clearStorage = ENV_OBJ.clearStorage || envError('clearStorage')

const clearStorageSync = ENV_OBJ.clearStorageSync || envError('clearStorageSync')

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
