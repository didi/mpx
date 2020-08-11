/** 
*@file 系统信息相关API
*@export getSystemInfo、getSystemInfoSync
**/

// 此处引入先用webpack externals处理
import app from 'qApp'
import { successHandler, failHandler } from '../../common/js'

function getSystemInfoSync(options = {}) {
  let systemInfo
  try{
    systemInfo = app.getInfo()
    const response = Object.assign({ msg: 'getSystemInfo:ok' }, systemInfo)
    successHandler(response, options.success, options.complete)
    return systemInfo
  } catch (e) {
    const error = Object.assign({ errMsg: 'getSystemInfo:error' }, e)
    failHandler(error, options.fail, options.complete)
  }
}

function getSystemInfo(options = {}) {
  try {
    const systemInfo = getSystemInfoSync(options)
    return Promise.resolve(systemInfo)
  } catch (e) {
    return Promise.reject(e)
  }
}

export {
  getSystemInfoSync,
  getSystemInfo
}


