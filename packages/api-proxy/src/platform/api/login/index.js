import { ENV_OBJ, envError } from '../../../common/js'

const login = ENV_OBJ.login || envError('login')

export {
  login
}
