import DeviceInfo from 'react-native-device-info'
import { Platform, PixelRatio, Dimensions, StatusBar } from 'react-native'
import { initialWindowMetrics } from 'react-native-safe-area-context'
import { webHandleSuccess, webHandleFail } from '../../../common/js/web'

const getWindowInfo = function () {
  const dimensionsWindow = Dimensions.get('window')
  const dimensionsScreen = Dimensions.get('screen')
  return {
    pixelRatio: PixelRatio.get(),
    windowWidth: dimensionsWindow.width,
    windowHeight: dimensionsWindow.height,
    screenWidth: dimensionsScreen.width,
    screenHeight: dimensionsScreen.height
  }
}

const getSystemInfoSync = function () {
  const windowInfo = getWindowInfo()
  const { screenWidth, screenHeight } = windowInfo
  let safeArea = {}
  let { top = 0, bottom = 0 } = initialWindowMetrics?.insets || {}
  if (Platform.OS === 'android') {
    top = StatusBar.currentHeight || 0
  }

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
  return {
    brand: DeviceInfo.getBrand(),
    model: DeviceInfo.getModel(),
    system: `${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}`,
    platform: DeviceInfo.isEmulatorSync() ? 'emulator' : DeviceInfo.getSystemName(),
    deviceOrientation: screenWidth > screenHeight ? 'portrait' : 'landscape',
    fontSizeSetting: PixelRatio.getFontScale(),
    safeArea,
    ...windowInfo
  }
}

const getSystemInfo = function (options) {
  const { success, fail, complete } = options
  try {
    const systemInfo = getSystemInfoSync()
    const result = {
      errMsg: 'setStorage:ok',
      ...systemInfo
    }
    webHandleSuccess(result, success, complete)
  } catch (err) {
    const result = {
      errMsg: `getSystemInfo:fail ${err}`
    }
    webHandleFail(result, fail, complete)
  }
}

const getDeviceInfo = function () {
  const androidInfo = {}
  if (Platform.OS === 'android') {
    const deviceAbi = DeviceInfo.supported64BitAbisSync() || []
    androidInfo.deviceAbi = deviceAbi[0] || null
  }
  return {
    brand: DeviceInfo.getBrand(),
    model: DeviceInfo.getModel(),
    system: `${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}`,
    platform: DeviceInfo.isEmulatorSync() ? 'emulator' : DeviceInfo.getSystemName(),
    memorySize: DeviceInfo.getTotalMemorySync() / (1024 * 1024),
    ...androidInfo
  }
}

export {
  getSystemInfo,
  getSystemInfoSync,
  getDeviceInfo,
  getWindowInfo
}
