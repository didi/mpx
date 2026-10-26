import { isBrowser, throwSSRWarning, successHandle, defineUnsupportedProps } from '../../../common/js'

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
  const result = {
    brand,
    model: brand,
    system,
    platform: navigator.platform
  }
  defineUnsupportedProps(result, ['abi', 'deviceAbi', 'benchmarkLevel', 'cpuType', 'memorySize'])
  return result
}

const getWindowInfo = function () {
  const result = {
    pixelRatio: window.devicePixelRatio,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    windowWidth: document.documentElement.clientWidth,
    windowHeight: document.documentElement.clientHeight
  }
  defineUnsupportedProps(result, ['statusBarHeight', 'safeArea', 'screenTop'])
  return result
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
    windowHeight
  } = getWindowInfo()
  const {
    brand,
    model,
    system,
    platform
  } = getDeviceInfo()
  const result = {
    language: navigator.language,
    pixelRatio,
    screenWidth,
    screenHeight,
    windowWidth,
    windowHeight,
    brand,
    model,
    system,
    platform
  }
  defineUnsupportedProps(result, [
    'version',
    'fontSizeSetting',
    'SDKVersion',
    'benchmarkLevel',
    'albumAuthorized',
    'cameraAuthorized',
    'locationAuthorized',
    'microphoneAuthorized',
    'notificationAlertAuthorized',
    'notificationAuthorized',
    'notificationBadgeAuthorized',
    'notificationSoundAuthorized',
    'bluetoothEnabled',
    'locationEnabled',
    'wifiEnabled',
    'statusBarHeight',
    'safeArea',
    'deviceOrientation',
    'enableDebug',
    'host',
    'locationReducedAccuracy',
    'phoneCalendarAuthorized',
    'theme'
  ])
  return result
}

function getSystemInfo (options = {}) {
  if (!isBrowser) {
    throwSSRWarning('getSystemInfo API is running in non browser environments')
    return
  }
  const info = getSystemInfoSync()
  const res = Object.defineProperties({ errMsg: 'getSystemInfo:ok' }, Object.getOwnPropertyDescriptors(info))
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
