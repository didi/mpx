import { ENV_OBJ } from '../../../common/js'

function closeBLEConnection (options = {}) {
  ENV_OBJ.disconnectBLEDevice(options)
}

function createBLEConnection (options = {}) {
  ENV_OBJ.connectBLEDevice(options)
}

function onBLEConnectionStateChange (callback) {
  ENV_OBJ.onBLEConnectionStateChanged(callback)
}

export {
  closeBLEConnection,
  createBLEConnection,
  onBLEConnectionStateChange
}
