import { BleManager } from 'react-native-ble-plx'
import { noop } from '@mpxjs/utils'
import { Platform, PermissionsAndroid } from 'react-native'
import { base64ToArrayBuffer } from '../base/index'
import { envError } from '../../../common/js'

let manager
let deviceFoundCallbacks = []
let discovering = false

const requestBluetoothPermission = async () => {
  if (__mpx_mode__ === 'ios') {
    return true
  }
  if (__mpx_mode__ === 'android' && PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION) {
    const apiLevel = parseInt(Platform.Version.toString(), 10)

    if (apiLevel < 31) {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
      return granted === PermissionsAndroid.RESULTS.GRANTED
    }
    if (PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN && PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT) {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      ])

      return (
        result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
        result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
        result['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
      )
    }
  }

  return false
}

function openBluetoothAdapter (options = {}) {
  const { success = noop, fail = noop, complete = noop } = options
  if (manager) {
    fail({
      errMsg: 'openBluetoothAdapter:fail already opened'
    })
    complete({
      errMsg: 'openBluetoothAdapter:fail already opened'
    })
    return
  }
  manager = new BleManager()
  const checkState = function () {
    manager.state().then((newState) => {
      if (newState === 'PoweredOn') {
        const result = {
          errno: 0,
          errMsg: 'openBluetoothAdapter:ok'
        }
        success(result)
        complete(result)
      } else {
        manager = null
        if (__mpx_mode__ === 'ios') {
          let state = 0
          switch (newState) {
            case 'Unknown':
              state = 0
              break
            case 'Resetting':
              state = 1
              break
            case 'Unsupported':
              state = 2
              break
            case 'Unauthorized':
              state = 3
              break
            case 'PoweredOff':
              state = 4
              break
          }
          const result = {
            state,
            errMsg: 'openBluetoothAdapter:fail'
          }
          fail(result)
          complete(result)
        } else {
          fail && fail({
            errMsg: 'openBluetoothAdapter:fail'
          })
          complete && complete({
            errMsg: 'openBluetoothAdapter:fail'
          })
        }
      }
    }).catch((error) => {
      manager = null
      fail({
        errMsg: 'openBluetoothAdapter:fail ' + error.message
      })
      complete({
        errMsg: 'openBluetoothAdapter:fail ' + error.message
      })
    })
  }
  // 先请求权限，再初始化蓝牙管理器
  requestBluetoothPermission().then((hasPermissions) => {
    if (!hasPermissions) {
      const result = {
        errMsg: 'openBluetoothAdapter:fail no permission'
      }
      fail(result)
      complete(result)
      return
    }
    manager.connectedDevices().then((devices) => {
      if (devices.length > 0) {
        const result = {
          errno: -1,
          errMsg: 'openBluetoothAdapter:ok'
        }
        success(result)
        complete(result)
        return
      }
      checkState()
    }).catch(() => {
      checkState()
    })
  })
}

function closeBluetoothAdapter (options = {}) {
  const { success = noop, fail = noop, complete = noop } = options
  if (manager) {
    manager.destroy().then((res) => {
      deviceFoundCallbacks = []
      manager = null
      const result = {
        errMsg: 'closeBluetoothAdapter:ok'
      }
      success(result)
      complete(result)
    }).catch((error) => {
      const result = {
        errMsg: 'closeBluetoothAdapter:fail ' + error.message
      }
      fail(result)
      complete(result)
    })
  } else {
    const result = {
      errMsg: 'closeBluetoothAdapter:ok'
    }
    success(result)
    complete(result)
  }
}

function startBluetoothDevicesDiscovery (options = {}) {
  if (!manager) {
    return
  }
  const {
    services = [],
    allowDuplicatesKey = false,
    powerLevel = 'medium',
    success = noop,
    fail = noop,
    complete = noop
  } = options
  const scanMode = {
    low: 'LowPower',
    medium: 'Balanced',
    high: 'LowLatency'
  }
  manager.startDeviceScan(services, {
    scanMode: scanMode[powerLevel],
    allowDuplicates: allowDuplicatesKey
  }, (error, sannnedDevice) => {
    if (error) {
      return
    }
    discovering = true
    if (sannnedDevice) {
      deviceFoundCallbacks.forEach((callback) => {
        const result = {
          devices: [{
            name: sannnedDevice.name || '',
            id: sannnedDevice.id,
            RSSI: sannnedDevice.rssi || 0,
            advertisData: base64ToArrayBuffer(sannnedDevice.manufacturerData || ''),
            advertisServiceUUIDs: sannnedDevice.serviceUUIDs || [],
            localName: sannnedDevice.localName || '',
            serviceData: sannnedDevice.serviceData,
            connectable: sannnedDevice.isConnectable
          }]
        }
        callback(result)
      })
    }
    // if (sannnedDevice) {
      // const result = {
      //   errMsg: 'startBluetoothDevicesDiscovery:ok',
      //   isDiscovering: true
      // }
      // success(result)
      // complete(result)
    // }
  }).then(() => {
    const result = {
      errMsg: 'startBluetoothDevicesDiscovery:ok',
      isDiscovering: true
    }
    success(result)
    complete(result)
  }).catch((error) => {
    const result = {
      errMsg: 'startBluetoothDevicesDiscovery:fail ' + (error?.message || '')
    }
    fail(result)
    complete(result)
  })
}

function stopBluetoothDevicesDiscovery (options = {}) {
  if (!manager) {
    return
  }
  const { success = noop, fail = noop, complete = noop } = options
  manager.stopDeviceScan().then(() => {
    discovering = false
    const result = {
      errMsg: 'stopBluetoothDevicesDiscovery:ok'
    }
    success(result)
    complete(result)
  }).catch((error) => {
    const result = {
      errMsg: 'stopBluetoothDevicesDiscovery:fail ' + (error?.message || '')
    }
    fail(result)
    complete(result)
  })
}

function onBluetoothDeviceFound (callback) {
  deviceFoundCallbacks.push(callback)
}

function offBluetoothDeviceFound (callback) {
  const index = deviceFoundCallbacks.indexOf(callback)
  if (index > -1) {
    deviceFoundCallbacks.splice(index, 1)
  }
}

function getConnectedBluetoothDevices (options = {}) {
  if (!manager) {
    return
  }
  const { services = [], success = noop, fail = noop, complete = noop } = options
  manager.connectedDevices(services).then((devices) => {
    const connectedDevices = devices.map(device => ({
      deviceId: device.id,
      name: device.name
    }))
    const result = {
      errMsg: 'getConnectedBluetoothDevices:ok',
      devices: connectedDevices
    }
    success(result)
    complete(result)
  }).catch((error) => {
    const result = {
      errMsg: 'getConnectedBluetoothDevices:fail ' + (error?.message || '')
    }
    fail(result)
    complete(result)
  })
}

function getBluetoothAdapterState (options = {}) {
  if (!manager) {
    return
  }
  const { success = noop, fail = noop, complete = noop } = options
  manager.state().then((state) => {
    const result = {
      errmsg: 'getBluetoothAdapterState:ok',
      discovering,
      available: state === 'PoweredOn'
    }
    success(result)
    complete(result)
  }).catch((error) => {
    const result = {
      errMsg: 'getBluetoothAdapterState:fail ' + (error?.message || '')
    }
    fail(result)
    complete(result)
  })
}

const closeBLEConnection = envError('closeBLEConnection')

const createBLEConnection = envError('createBLEConnection')

const onBLEConnectionStateChange = envError('onBLEConnectionStateChange')

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
