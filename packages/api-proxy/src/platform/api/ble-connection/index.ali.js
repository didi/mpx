import { ENV_OBJ, envError } from '../../../common/js'

function closeBLEConnection (options = {}) {
  return ENV_OBJ.disconnectBLEDevice(options)
}

function createBLEConnection (options = {}) {
  return ENV_OBJ.connectBLEDevice(options)
}

function onBLEConnectionStateChange (callback) {
  return ENV_OBJ.onBLEConnectionStateChanged(callback)
}

const openBluetoothAdapter = ENV_OBJ.openBluetoothAdapter || envError('openBluetoothAdapter')

const closeBluetoothAdapter = ENV_OBJ.closeBluetoothAdapter || envError('closeBluetoothAdapter')

const startBluetoothDevicesDiscovery = ENV_OBJ.startBluetoothDevicesDiscovery || envError('startBluetoothDevicesDiscovery')

const stopBluetoothDevicesDiscovery = ENV_OBJ.stopBluetoothDevicesDiscovery || envError('stopBluetoothDevicesDiscovery')

const onBluetoothDeviceFound = ENV_OBJ.onBluetoothDeviceFound || envError('onBluetoothDeviceFound')

const offBluetoothDeviceFound = ENV_OBJ.offBluetoothDeviceFound || envError('offBluetoothDeviceFound')

const getConnectedBluetoothDevices = ENV_OBJ.getConnectedBluetoothDevices || envError('getConnectedBluetoothDevices')

const getBluetoothAdapterState = ENV_OBJ.getBluetoothAdapterState || envError('getBluetoothAdapterState')

export {
  closeBLEConnection,
  createBLEConnection,
  onBLEConnectionStateChange,
  openBluetoothAdapter,
  closeBluetoothAdapter,
  startBluetoothDevicesDiscovery,
  stopBluetoothDevicesDiscovery,
  onBluetoothDeviceFound,
  offBluetoothDeviceFound,
  getConnectedBluetoothDevices,
  getBluetoothAdapterState
}
