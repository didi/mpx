import { ENV_OBJ } from '../../../common/js'

function closeBLEConnection (options = {}) {
  return ENV_OBJ.disconnectBLEDevice(options)
}

function createBLEConnection (options = {}) {
  return ENV_OBJ.connectBLEDevice(options)
}

function onBLEConnectionStateChange (callback) {
  return ENV_OBJ.onBLEConnectionStateChanged(callback)
}

export {
  closeBLEConnection,
  createBLEConnection,
  onBLEConnectionStateChange
}
