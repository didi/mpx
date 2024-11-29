import { ENV_OBJ, envError } from '../../../common/js'

const getUserInfo = ENV_OBJ.getUserInfo || envError('getUserInfo')

export {
  getUserInfo
}
