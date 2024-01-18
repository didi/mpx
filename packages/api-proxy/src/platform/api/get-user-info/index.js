import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const getUserInfo = ENV_OBJ.getUserInfo || envError('getUserInfo')

export {
  getUserInfo
}
