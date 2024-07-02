import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const login = ENV_OBJ.login || envError('login')

export {
  login
}
