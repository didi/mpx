import { ENV_OBJ, envError } from '../../../common/js'

const getSystemInfo = ENV_OBJ.getSystemInfo || envError('getSystemInfo')

const getSystemInfoSync = ENV_OBJ.getSystemInfoSync || envError('getSystemInfoSync')

const getDeviceInfo = ENV_OBJ.getDeviceInfo || envError('getDeviceInfo')

const getWindowInfo = ENV_OBJ.getWindowInfo || envError('getWindowInfo')

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
