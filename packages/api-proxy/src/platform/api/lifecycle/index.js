import { ENV_OBJ, envError } from '../../../common/js'

const getEnterOptionsSync = ENV_OBJ.getEnterOptionsSync || envError('getEnterOptionsSync')

export {
  getEnterOptionsSync
}
