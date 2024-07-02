import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const connectSocket = ENV_OBJ.connectSocket || envError('connectSocket')

export {
  connectSocket
}
