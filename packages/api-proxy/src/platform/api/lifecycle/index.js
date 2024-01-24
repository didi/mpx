import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const getEnterOptionsSync = ENV_OBJ.getEnterOptionsSync || envError('getEnterOptionsSync')

export {
  getEnterOptionsSync
}
