import { getEnvObj } from '../../../common/js'

const ALI_OBJ = getEnvObj()

function closeBLEConnection (options = {}) {
  ALI_OBJ.disconnectBLEDevice(options)
}

function createBLEConnection (options = {}) {
  ALI_OBJ.connectBLEDevice(options)
}

function onBLEConnectionStateChange (callback) {
  ALI_OBJ.onBLEConnectionStateChanged(callback)
}

export {
  closeBLEConnection,
  createBLEConnection,
  onBLEConnectionStateChange
}
