import { webHandleSuccess } from '../../../common/js'
const { Hummer } = __GLOBAL__

function getSystemInfoSync () {
  const {
    platform,
    osVersion,
    deviceWidth,
    deviceHeight,
    availableWidth,
    availableHeight,
    safeAreaBottom
  } = Hummer.env || {}
  return {
    brand: platform,
    model: platform,
    pixelRatio: null,
    screenWidth: deviceWidth,
    screenHeight: deviceHeight,
    windowWidth: availableWidth,
    windowHeight: availableHeight,
    statusBarHeight: null,
    language: null,
    version: null,
    system: platform + osVersion,
    platform: platform,
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
    wifiEnabled: null,
    safeArea: safeAreaBottom
  }
}

function getSystemInfo (options = {}) {
  const info = getSystemInfoSync()
  const res = Object.assign({ errMsg: 'getSystemInfo:ok' }, info)
  webHandleSuccess(res, options.success, options.complete)
  return Promise.resolve(res)
}

export { getSystemInfo, getSystemInfoSync }
