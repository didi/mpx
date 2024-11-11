import DeviceInfo from 'react-native-device-info'
import { Platform, PixelRatio, Dimensions, StatusBar } from 'react-native'
import { initialWindowMetrics } from 'react-native-safe-area-context'
import { successHandle, failHandle, defineUnsupportedProps, getFocusedNavigation } from '../../../common/js'

const getWindowInfo = function () {
  const dimensionsScreen = Dimensions.get('screen')
  const navigation = getFocusedNavigation()
  const insets = {
    ...initialWindowMetrics?.insets,
    ...navigation?.insets
  }
  let safeArea = {}
  let { top = 0, bottom = 0, left = 0, right = 0 } = insets
  if (Platform.OS === 'android' || Platform.OS === 'harmony') {
    top = StatusBar.currentHeight || 0
  }
  const screenHeight = dimensionsScreen.height
  const screenWidth = dimensionsScreen.width
  const layout = navigation?.layout || {}
  const layoutHeight = layout.height || 0
  const layoutWidth = layout.width || 0
  const windowHeight = layoutHeight || screenHeight
  try {
    safeArea = {
      left,
      right: screenWidth - right,
      top,
      bottom: screenHeight - bottom,
      height: screenHeight - top - bottom,
      width: screenWidth - left - right
    }
  } catch (error) {
  }
  const result = {
    pixelRatio: PixelRatio.get(),
    windowWidth: layoutWidth || screenWidth,
    windowHeight, // 取不到layout的时候有个兜底
    screenWidth: screenWidth,
    screenHeight: screenHeight,
    screenTop: screenHeight - windowHeight,
    safeArea
  }
  return result
}

const getSystemInfoSync = function () {
  const windowInfo = getWindowInfo()
  const { screenWidth, screenHeight, safeArea } = windowInfo

  const result = {
    brand: DeviceInfo.getBrand(),
    model: DeviceInfo.getModel(),
    system: `${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}`,
    platform: DeviceInfo.isEmulatorSync() ? 'emulator' : DeviceInfo.getSystemName(),
    deviceOrientation: screenWidth > screenHeight ? 'portrait' : 'landscape',
    statusBarHeight: safeArea.top,
    fontSizeSetting: PixelRatio.getFontScale(),
    ...windowInfo
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
  if (Platform.OS === 'android' || Platform.OS === 'harmony') {
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
