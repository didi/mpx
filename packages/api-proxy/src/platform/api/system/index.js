import { ENV_OBJ, envError } from '../../../common/js'

const getSystemInfo = ENV_OBJ.getSystemInfo || envError('getSystemInfo')

const getSystemInfoSync = ENV_OBJ.getSystemInfoSync || envError('getSystemInfoSync')

const getDeviceInfo = ENV_OBJ.getDeviceInfo || envError('getDeviceInfo')

const getWindowInfo = ENV_OBJ.getWindowInfo || envError('getWindowInfo')

export {
  getSystemInfo,
  getSystemInfoSync,
  getDeviceInfo,
  getWindowInfo
}
