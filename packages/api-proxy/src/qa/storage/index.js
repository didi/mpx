/**
*@file 本地缓存相关API
*@export 
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
  }).catch(err => {
    failHandler(err, options.fail, options.complete)
    reject()
  })
}

