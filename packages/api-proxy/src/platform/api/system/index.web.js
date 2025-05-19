import { isBrowser, throwSSRWarning, successHandle } from '../../../common/js'

const getDeviceInfo = function () {
  const ua = navigator.userAgent.split('(')[1]?.split(')')[0] || ''
  const phones = new Map([
    ['iPhone', /iPhone|iPad|iPod|iOS/i],
    ['Huawei', /huawei/i],
    ['Xiaomi', /mi/i],
    ['Vivo', /vivo/i],
    ['Oppo', /OPPO/i],
    ['Samsung', /samsung/i],
    ['Sony', /SONY/i],
    ['Nokia', /Nokia/i],
    ['HTC', /HTC/i],
    ['ZTE', /ZTE/i],
    ['Lenovo', /Lenovo|ZUK/i]
  ])

  let brand = ''
  let system = ''

  for (const item of phones.entries()) {
    if (item[1].test(ua)) {
      brand = item[0]
      break
    }
  }

  !brand && (brand = 'Android')

  if (brand === 'iPhone') {
    system = `iOS ${ua.replace(/^.*OS ([\d_]+) like.*$/, '$1').replace(/_/g, '.')}`
  } else {
    system = `Android ${ua.replace(/^.*Android ([\d.]+);.*$/, '$1')}`
  }
  return {
    abi: null,
    deviceAbi: null,
    benchmarkLevel: null,
    brand,
    model: brand,
    system,
    platform: navigator.platform,
    cpuType: null,
    memorySize: null
  }
}

const getWindowInfo = function () {
  return {
    pixelRatio: window.devicePixelRatio,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    windowWidth: document.documentElement.clientWidth,
    windowHeight: document.documentElement.clientHeight,
    statusBarHeight: null,
    safeArea: null,
    screenTop: null
  }
}

function getSystemInfoSync () {
  if (!isBrowser) {
    throwSSRWarning('getSystemInfoSync API is running in non browser environments')
    return
  }

  const {
    pixelRatio,
    screenWidth,
    screenHeight,
    windowWidth,
    windowHeight,
    statusBarHeight,
    safeArea
  } = getWindowInfo()
  const {
    benchmarkLevel,
    brand,
    model,
    system,
    platform
  } = getDeviceInfo()
  const result = Object.assign({
    language: navigator.language,
    version: null,
    fontSizeSetting: null,
    SDKVersion: null,
    benchmarkLevel: null,
    albumAuthorized: null,
    cameraAuthorized: null,
    locationAuthorized: null,
    microphoneAuthorized: null,
    notificationAlertAuthorized: null,
    notificationAuthorized: null,
    notificationBadgeAuthorized: null,
    notificationSoundAuthorized: null,
    bluetoothEnabled: null,
    locationEnabled: null,
    wifiEnabled: null
  }, {
    pixelRatio,
    screenWidth,
    screenHeight,
    windowWidth,
    windowHeight,
    statusBarHeight,
    safeArea
  }, {
    benchmarkLevel,
    brand,
    model,
    system,
    platform
  })
  return result
}

function getSystemInfo (options = {}) {
  if (!isBrowser) {
    throwSSRWarning('getSystemInfo API is running in non browser environments')
    return
  }
  const info = getSystemInfoSync()
  const res = Object.assign({ errMsg: 'getSystemInfo:ok' }, info)
  successHandle(res, options.success, options.complete)
}

const getEnterOptionsSync = function () {
  if (!isBrowser) {
    throwSSRWarning('getEnterOptionsSync API is running in non browser environments')
    return
  }
  return global.__mpxEnterOptions || {}
}

const getLaunchOptionsSync = function () {
  if (!isBrowser) {
    throwSSRWarning('getLaunchOptionsSync API is running in non browser environments')
    return
  }
  return global.__mpxLaunchOptions || {}
}

export {
  getSystemInfo,
  getSystemInfoSync,
  getDeviceInfo,
  getWindowInfo,
  getLaunchOptionsSync,
  getEnterOptionsSync
}
