import { ENV_OBJ, envError } from '../../../common/js'

const getExtConfig = ENV_OBJ.getExtConfig || envError('getExtConfig')

const getExtConfigSync = ENV_OBJ.getExtConfigSync || envError('getExtConfigSync')

export {
  getExtConfig,
  getExtConfigSync
}
