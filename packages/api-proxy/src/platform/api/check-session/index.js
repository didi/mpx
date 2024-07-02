import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const checkSession = ENV_OBJ.checkSession || envError('checkSession')

export {
  checkSession
}
