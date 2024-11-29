import { ENV_OBJ, envError } from '../../../../common/js'

const getNetworkType = ENV_OBJ.getNetworkType || envError('getNetworkType')

const onNetworkStatusChange = ENV_OBJ.onNetworkStatusChange || envError('onNetworkStatusChange')

const offNetworkStatusChange = ENV_OBJ.offNetworkStatusChange || envError('offNetworkStatusChange')

export {
  getNetworkType,
  onNetworkStatusChange,
  offNetworkStatusChange
}
