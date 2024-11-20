import DeviceInfo from 'react-native-device-info'
import { PixelRatio } from 'react-native'
import { successHandle, failHandle, defineUnsupportedProps } from '../../../common/js'
import { getWindowInfo } from './rnWindowInfo'

const getSystemInfoSync = function () {
  const windowInfo = getWindowInfo()
  const { screenWidth, screenHeight, safeArea } = windowInfo

  const result = {
    // brand: DeviceInfo.getBrand(),
    // model: DeviceInfo.getModel(),
    // system: `${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}`,
    // platform: DeviceInfo.isEmulatorSync() ? 'emulator' : DeviceInfo.getSystemName(),
    brand: 'Apple',
    model: '?',
    system: 'iOS 11.0',
    platform: 'iOS',
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
  if (Platform.OS === 'android') {
    const deviceAbi = DeviceInfo.supported64BitAbisSync() || []
    deviceInfo.deviceAbi = deviceAbi[0] || null
  }
  defineUnsupportedProps(deviceInfo, ['benchmarkLevel', 'abi', 'cpuType'])
  Object.assign(deviceInfo, {
    // brand: DeviceInfo.getBrand(),
    // model: DeviceInfo.getModel(),
    // system: `${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}`,
    // platform: DeviceInfo.isEmulatorSync() ? 'emulator' : DeviceInfo.getSystemName(),
    // memorySize: DeviceInfo.getTotalMemorySync() / (1024 * 1024)
    brand: 'Apple',
    model: '?',
    system: 'iOS 11.0',
    platform: 'emulator',
    memorySize: 8192
  })
  return deviceInfo
}

export {
  getSystemInfo,
  getSystemInfoSync,
  getDeviceInfo,
  getWindowInfo
}
