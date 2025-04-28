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
  let res
  if (ENV_OBJ.canIUse('getDeviceBaseInfo')) {
    res = ENV_OBJ.getDeviceBaseInfo()
  } else {
    const systemInfo = getSystemInfoSync()
    res = {
      abi: systemInfo.abi || null,
      benchmarkLevel: systemInfo.benchmarkLevel || null,
      brand: systemInfo.brand,
      model: systemInfo.model,
      system: systemInfo.system,
      platform: systemInfo.platform,
      memorySize: systemInfo.memorySize || null
    }
  }
  defineUnsupportedProps(res, ['deviceAbi', 'benchmarkLevel', 'cpuType'])
  return res
}

const getWindowInfo = function () {
  let res
  if (ENV_OBJ.canIUse('getWindowInfo')) {
    res = ENV_OBJ.getWindowInfo()
  } else {
    const systemInfo = getSystemInfoSync()
    res = {
      pixelRatio: systemInfo.pixelRatio,
      screenWidth: systemInfo.screenWidth,
      screenHeight: systemInfo.screenHeight,
      windowWidth: systemInfo.windowWidth,
      windowHeight: systemInfo.windowHeight,
      statusBarHeight: systemInfo.statusBarHeight,
      safeArea: systemInfo.safeArea || null,
      screenTop: systemInfo.screenTop || null
    }
  }
  return res
}

// const getWindowInfo = ENV_OBJ.getWindowInfo || envError('getWindowInfo')

const getLaunchOptionsSync = ENV_OBJ.getLaunchOptionsSync || envError('getLaunchOptionsSync')

const getEnterOptionsSync = ENV_OBJ.getEnterOptionsSync || envError('getEnterOptionsSync')

export {
  getSystemInfo,
  getSystemInfoSync,
  getDeviceInfo,
  getWindowInfo,
  getLaunchOptionsSync,
  getEnterOptionsSync
}
