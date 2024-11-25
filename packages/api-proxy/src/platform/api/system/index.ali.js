import { ENV_OBJ, changeOpts, envError, handleSuccess, defineUnsupportedProps } from '../../../common/js'

function getSystemInfo (options = {}) {
  const opts = changeOpts(options)

  handleSuccess(opts, res => {
    res.system = `${res.platform} ${res.system}`
    res.SDKVersion = ENV_OBJ.SDKVersion

    // 支付宝 windowHeight 可能为 0
    if (!res.windowHeight) {
      res.windowHeight = Math.floor(res.screenHeight * res.windowWidth / res.screenWidth) - 50
    }

    return res
  })

  return ENV_OBJ.getSystemInfo(opts)
}

function getSystemInfoSync () {
  const res = ENV_OBJ.getSystemInfoSync() || {}

  res.system = `${res.platform} ${res.system}`
  res.SDKVersion = ENV_OBJ.SDKVersion

  // 支付宝 windowHeight 可能为 0
  if (!res.windowHeight) {
    res.windowHeight = Math.floor(res.screenHeight * res.windowWidth / res.screenWidth) - 50
  }

  return res
}

const getDeviceInfo = function () {
  const res = ENV_OBJ.getDeviceBaseInfo
  defineUnsupportedProps(res, ['deviceAbi', 'benchmarkLevel', 'cpuType'])
  return res
}

const getWindowInfo = ENV_OBJ.getWindowInfo || envError('getWindowInfo')

const getLaunchOptionsSync = ENV_OBJ.getLaunchOptionsSync || envError('getLaunchOptionsSync')

export {
  getSystemInfo,
  getSystemInfoSync,
  getDeviceInfo,
  getWindowInfo,
  getLaunchOptionsSync
}
