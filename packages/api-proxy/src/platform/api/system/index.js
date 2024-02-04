import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const getSystemInfo = ENV_OBJ.getSystemInfo || envError('getSystemInfo')

const getSystemInfoSync = ENV_OBJ.getSystemInfoSync || envError('getSystemInfoSync')

export {
  getSystemInfo,
  getSystemInfoSync
}
