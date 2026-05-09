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

function offBLEConnectionStateChange (callback) {
  return ENV_OBJ.offBLEConnectionStateChanged(callback)
}

const openBluetoothAdapter = ENV_OBJ.openBluetoothAdapter || envError('openBluetoothAdapter')

const closeBluetoothAdapter = ENV_OBJ.closeBluetoothAdapter || envError('closeBluetoothAdapter')

const startBluetoothDevicesDiscovery = ENV_OBJ.startBluetoothDevicesDiscovery || envError('startBluetoothDevicesDiscovery')

const stopBluetoothDevicesDiscovery = ENV_OBJ.stopBluetoothDevicesDiscovery || envError('stopBluetoothDevicesDiscovery')

const onBluetoothDeviceFound = ENV_OBJ.onBluetoothDeviceFound || envError('onBluetoothDeviceFound')

const offBluetoothDeviceFound = ENV_OBJ.offBluetoothDeviceFound || envError('offBluetoothDeviceFound')

const getConnectedBluetoothDevices = ENV_OBJ.getConnectedBluetoothDevices || envError('getConnectedBluetoothDevices')

const getBluetoothAdapterState = ENV_OBJ.getBluetoothAdapterState || envError('getBluetoothAdapterState')

const onBluetoothAdapterStateChange = ENV_OBJ.onBluetoothAdapterStateChange || envError('onBluetoothAdapterStateChange')

const offBluetoothAdapterStateChange = ENV_OBJ.offBluetoothAdapterStateChange || envError('offBluetoothAdapterStateChange')

const getBluetoothDevices = ENV_OBJ.getBluetoothDevices || envError('getBluetoothDevices')

const writeBLECharacteristicValue = ENV_OBJ.writeBLECharacteristicValue || envError('writeBLECharacteristicValue')

const readBLECharacteristicValue = ENV_OBJ.readBLECharacteristicValue || envError('readBLECharacteristicValue')

const notifyBLECharacteristicValueChange = ENV_OBJ.notifyBLECharacteristicValueChange || envError('notifyBLECharacteristicValueChange')

const onBLECharacteristicValueChange = ENV_OBJ.onBLECharacteristicValueChange || envError('onBLECharacteristicValueChange')

const offBLECharacteristicValueChange = ENV_OBJ.offBLECharacteristicValueChange || envError('offBLECharacteristicValueChange')

const setBLEMTU = ENV_OBJ.setBLEMTU || envError('setBLEMTU')

const getBLEDeviceRSSI = ENV_OBJ.getBLEDeviceRSSI || envError('getBLEDeviceRSSI')

const getBLEDeviceServices = ENV_OBJ.getBLEDeviceServices || envError('getBLEDeviceServices')

const getBLEDeviceCharacteristics = ENV_OBJ.getBLEDeviceCharacteristics || envError('getBLEDeviceCharacteristics')

export {
  closeBLEConnection,
  createBLEConnection,
  onBLEConnectionStateChange,
  offBLEConnectionStateChange,
  openBluetoothAdapter,
  closeBluetoothAdapter,
  startBluetoothDevicesDiscovery,
  stopBluetoothDevicesDiscovery,
  onBluetoothDeviceFound,
  offBluetoothDeviceFound,
  getConnectedBluetoothDevices,
  getBluetoothAdapterState,
  onBluetoothAdapterStateChange,
  offBluetoothAdapterStateChange,
  getBluetoothDevices,
  writeBLECharacteristicValue,
  readBLECharacteristicValue,
  notifyBLECharacteristicValueChange,
  onBLECharacteristicValueChange,
  offBLECharacteristicValueChange,
  setBLEMTU,
  getBLEDeviceRSSI,
  getBLEDeviceServices,
  getBLEDeviceCharacteristics
}
