import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const closeBLEConnection = ENV_OBJ.closeBLEConnection || envError('closeBLEConnection')

const createBLEConnection = ENV_OBJ.createBLEConnection || envError('createBLEConnection')

const onBLEConnectionStateChange = ENV_OBJ.onBLEConnectionStateChange || envError('onBLEConnectionStateChange')

export {
  closeBLEConnection,
  createBLEConnection,
  onBLEConnectionStateChange
}
