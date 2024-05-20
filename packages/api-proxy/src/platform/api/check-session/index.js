import { ENV_OBJ, envError } from '../../../common/js'

const checkSession = ENV_OBJ.checkSession || envError('checkSession')

export {
  checkSession
}
