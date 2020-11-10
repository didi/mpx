import geolocation from 'qAppLocation'
import { successHandler, failHandler } from '../../common/js'

// 获取地理位置
function getLocation ({
  type,
  success,
  fail,
  complete
} = {}) {
  try {
    geolocation.getLocation({
      coordType: type,
      success (data) {
        const responseData = Object.assign({
          errMsg: 'getLocation:ok',
          speed: null,
          altitude: null,
          verticalAccuracy: null,
          horizontalAccuracy: null
        }, data)
        successHandler(responseData, success, complete)
      },
      fail (data, code) {
        failHandler({
          errCode: code,
          errMsg: `getLocation:fail ${data}`
        }, fail, complete)
      }
    })
  } catch (error) {
    failHandler({
      errMsg: `getLocation:fail ${error}`
    }, fail, complete)
  }
}

// 使用内置地图查看位置
function openLocation ({
  latitude,
  longitude,
  scale,
  name,
  address,
  success,
  fail,
  complete
} = {}) {
  try {
    geolocation.openLocation({
      latitude,
      longitude,
      scale,
      name,
      address,
      success () {
        successHandler({
          errMsg: 'openLocation:ok'
        }, success, complete)
      },
      fail (data, code) {
        failHandler({
          errCode: code,
          errMsg: `openLocation:fail ${data}`
        }, fail, complete)
      }
    })
  } catch (error) {
    failHandler({
      errMsg: `openLocation:fail ${error}`
    }, fail, complete)
  }
}

// 打开内置地图选择位置
function chooseLocation ({
  latitude,
  longitude,
  success,
  fail,
  complete
} = {}) {
  try {
    geolocation.chooseLocation({
      latitude,
      longitude,
      success (data) {
        const responseData = Object.assign({
          errMsg: 'chooseLocation:ok'
        }, data)
        successHandler(responseData, success, complete)
      },
      fail (data, code) {
        failHandler({
          errCode: code,
          errMsg: `chooseLocation:fail ${data}`
        }, fail, complete)
      }
    })
  } catch (error) {
    failHandler({
      errMsg: `chooseLocation:fail ${error}`
    }, fail, complete)
  }
}

// 监听地理位置
function onLocationChange (callback = '') {
  try {
    geolocation.subscribe({
      callback (data) {
        const responseData = Object.assign({
          errMsg: 'onLocationChange:ok',
          speed: null,
          altitude: null,
          verticalAccuracy: null,
          horizontalAccuracy: null
        }, data)
        successHandler(responseData, callback)
      },
      fail (data, code) {
        failHandler({
          errCode: code,
          errMsg: `onLocationChange:fail ${data}`
        }, callback)
      }
    })
  } catch (error) {
    failHandler({
      errMsg: `onLocationChange:fail ${error}`
    }, callback)
  }
}

// 取消监听地理位置
function stopLocationUpdate ({
  success,
  fail,
  complete
} = {}) {
  try {
    geolocation.unsubscribe()
    successHandler({
      errMsg: 'stopLocationUpdate:ok'
    }, success, complete)
  } catch (error) {
    failHandler({
      errMsg: `stopLocationUpdate:fail ${error}`
    }, fail, complete)
  }
}

export {
  getLocation,
  openLocation,
  chooseLocation,
  onLocationChange,
  stopLocationUpdate
}
