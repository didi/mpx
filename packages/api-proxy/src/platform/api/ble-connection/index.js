import { ENV_OBJ, envError } from '../../../common/js'

const closeBLEConnection = ENV_OBJ.closeBLEConnection || envError('closeBLEConnection')

const createBLEConnection = ENV_OBJ.createBLEConnection || envError('createBLEConnection')

const onBLEConnectionStateChange = ENV_OBJ.onBLEConnectionStateChange || envError('onBLEConnectionStateChange')

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
