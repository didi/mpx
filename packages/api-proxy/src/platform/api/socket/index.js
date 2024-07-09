import { ENV_OBJ, envError } from '../../../common/js'

const connectSocket = ENV_OBJ.connectSocket || envError('connectSocket')

export {
  connectSocket
}
