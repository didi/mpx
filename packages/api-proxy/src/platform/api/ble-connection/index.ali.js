function closeBLEConnection (options = {}) {
  my.disconnectBLEDevice(options)
}

function createBLEConnection (options = {}) {
  my.connectBLEDevice(options)
}

function onBLEConnectionStateChange (callback) {
  my.onBLEConnectionStateChanged(callback)
}

export {
  closeBLEConnection,
  createBLEConnection,
  onBLEConnectionStateChange
}
