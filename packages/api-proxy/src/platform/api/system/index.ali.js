import {changeOpts, envError, handleSuccess} from '../../../common/js'

function getSystemInfo (options = {}) {
  const opts = changeOpts(options)

  handleSuccess(opts, res => {
    res.system = `${res.platform} ${res.system}`
    res.SDKVersion = my.SDKVersion

    // 支付宝 windowHeight 可能为 0
    if (!res.windowHeight) {
      res.windowHeight = Math.floor(res.screenHeight * res.windowWidth / res.screenWidth) - 50
    }

    return res
  })

  my.getSystemInfo(opts)
}

function getSystemInfoSync () {
  const res = my.getSystemInfoSync() || {}

  res.system = `${res.platform} ${res.system}`
  res.SDKVersion = my.SDKVersion

  // 支付宝 windowHeight 可能为 0
  if (!res.windowHeight) {
    res.windowHeight = Math.floor(res.screenHeight * res.windowWidth / res.screenWidth) - 50
  }

  return res
}

const getDeviceInfo = ENV_OBJ.getDeviceInfo || envError('getDeviceInfo')

const getWindowInfo = ENV_OBJ.getWindowInfo || envError('getWindowInfo')

export {
  getSystemInfo,
  getSystemInfoSync,
  getDeviceInfo,
  getWindowInfo
}
