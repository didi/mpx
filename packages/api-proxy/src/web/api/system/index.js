import { webHandleSuccess } from '../../../common/js'

function getSystemInfoSync () {
  const ua = navigator.userAgent.split('(')[1].split(')')[0]
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

  for (let item of phones.entries()) {
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
    brand: brand,
    model: brand,
    pixelRatio: window.devicePixelRatio,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    windowWidth: document.documentElement.clientWidth,
    windowHeight: document.documentElement.clientHeight,
    statusBarHeight: null,
    language: navigator.language,
    version: null,
    system,
    platform: navigator.platform,
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
    safeArea: null
  }
}

function getSystemInfo (options = {}) {
  const info = getSystemInfoSync()
  const res = Object.assign({ errMsg: 'getSystemInfo:ok' }, info)
  webHandleSuccess(res, options.success, options.complete)
  return Promise.resolve(res)
}

export {
  getSystemInfo,
  getSystemInfoSync
}
