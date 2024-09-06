import DeviceInfo from 'react-native-device-info'
import { Platform, PixelRatio, Dimensions, StatusBar } from 'react-native'
import { initialWindowMetrics } from 'react-native-safe-area-context'
import { successHandle, failHandle, defineUnsupportedProps } from '../../../common/js'

const getWindowInfo = function () {
  const dimensionsWindow = Dimensions.get('window')
  const dimensionsScreen = Dimensions.get('screen')
  const result = {
    pixelRatio: PixelRatio.get(),
    windowWidth: dimensionsWindow.width,
    windowHeight: dimensionsWindow.height,
    screenWidth: dimensionsScreen.width,
    screenHeight: dimensionsScreen.height
  }
  defineUnsupportedProps(result, ['screenTop'])
  return result
}

const getSystemInfoSync = function () {
  const windowInfo = getWindowInfo()
  const { screenWidth, screenHeight } = windowInfo
  let safeArea = {}
  let { top = 0, bottom = 0 } = initialWindowMetrics?.insets || {}
  if (Platform.OS === 'android') {
    top = StatusBar.currentHeight || 0
  }
  const iosRes = {}

  try {
    const width = Math.min(screenWidth, screenHeight)
    const height = Math.max(screenWidth, screenHeight)
    safeArea = {
      left: 0,
      right: width,
      top,
      bottom: height - bottom,
      height: height - bottom - top,
      width
    }
  } catch (error) {
  }
  const result = {
    brand: DeviceInfo.getBrand(),
    model: DeviceInfo.getModel(),
    system: `${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}`,
    platform: DeviceInfo.isEmulatorSync() ? 'emulator' : DeviceInfo.getSystemName(),
    deviceOrientation: screenWidth > screenHeight ? 'portrait' : 'landscape',
    statusBarHeight: top,
    fontSizeSetting: PixelRatio.getFontScale(),
    safeArea,
    ...windowInfo,
    ...iosRes
  }
  defineUnsupportedProps(result, [
    'language',
    'version',
    'SDKVersion',
    'benchmarkLevel',
    'albumAuthorized',
    'cameraAuthorized',
    'locationAuthorized',
    'microphoneAuthorized',
    'notificationAuthorized',
    'phoneCalendarAuthorized',
    'host',
    'enableDebug',
    'notificationAlertAuthorized',
    'notificationBadgeAuthorized',
    'notificationSoundAuthorized',
    'bluetoothEnabled',
    'locationEnabled',
    'wifiEnabled',
    'locationReducedAccuracy',
    'theme'
  ])
  return result
}

const getSystemInfo = function (options = {}) {
  const { success, fail, complete } = options
  try {
    const systemInfo = getSystemInfoSync()
    Object.assign(systemInfo, {
      errMsg: 'setStorage:ok'
    })
    successHandle(systemInfo, success, complete)
  } catch (err) {
    const result = {
      errMsg: `getSystemInfo:fail ${err}`
    }
    failHandle(result, fail, complete)
  }
}

const getDeviceInfo = function () {
  const deviceInfo = {}
  if (Platform.OS === 'android') {
    const deviceAbi = DeviceInfo.supported64BitAbisSync() || []
    deviceInfo.deviceAbi = deviceAbi[0] || null
  }
  defineUnsupportedProps(deviceInfo, ['benchmarkLevel', 'abi', 'cpuType'])
  Object.assign(deviceInfo, {
    brand: DeviceInfo.getBrand(),
    model: DeviceInfo.getModel(),
    system: `${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}`,
    platform: DeviceInfo.isEmulatorSync() ? 'emulator' : DeviceInfo.getSystemName(),
    memorySize: DeviceInfo.getTotalMemorySync() / (1024 * 1024)
  })
  return deviceInfo
}

export {
  getSystemInfo,
  getSystemInfoSync,
  getDeviceInfo,
  getWindowInfo
}
