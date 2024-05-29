import { ENV_OBJ, envError } from '../../../common/js'

const getSystemInfo = ENV_OBJ.getSystemInfo || envError('getSystemInfo')

const getSystemInfoSync = ENV_OBJ.getSystemInfoSync || envError('getSystemInfoSync')

export {
  getSystemInfo,
  getSystemInfoSync
}
