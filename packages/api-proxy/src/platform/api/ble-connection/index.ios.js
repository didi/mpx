import { BleManager } from 'react-native-ble-plx'
import { noop } from '@mpxjs/utils'
import { Platform, PermissionsAndroid } from 'react-native'
import { base64ToArrayBuffer } from '../base/index'
global.__mpx_mode__ = 'android'
let manager
let deviceFoundCallbacks = []
let onStateChangeCallbacks = []
let discovering = false
let stateSubscription = null
let getDevices = [] // 记录已扫描的设备列表
let characteristicSubscriptions = {}
let characteristicCallbacks = []
let createBLEConnectionIsReady = false
const BLEDeviceCharacteristics = {} // 记录已连接设备的特征值

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
    }).catch((error) => {
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
    discovering = true
    if (sannnedDevice) {
      deviceFoundCallbacks.forEach((callback) => {
        const device = {
          name: sannnedDevice.name || '',
          id: sannnedDevice.id,
          RSSI: sannnedDevice.rssi || 0,
          advertisData: base64ToArrayBuffer(sannnedDevice.manufacturerData || ''),
          advertisServiceUUIDs: sannnedDevice.serviceUUIDs || [],
          localName: sannnedDevice.localName || '',
          serviceData: sannnedDevice.serviceData,
          connectable: sannnedDevice.isConnectable
        }
        if (getDevices.indexOf(device) === -1) {
          getDevices.push(device) // 记录扫描到的设备
        }
        const result = {
          devices: [device]
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

function onBluetoothDeviceFound(callback) {
  if (deviceFoundCallbacks.indexOf(callback) === -1) {
    deviceFoundCallbacks.push(callback)
  }
}

function offBluetoothDeviceFound(callback) {
  const index = deviceFoundCallbacks.indexOf(callback)
  if (index > -1) {
    deviceFoundCallbacks.splice(index, 1)
  }
}

function getConnectedBluetoothDevices (options = {}) {
  if (!manager) {
    return
  }
  const { services = [],success = noop, fail = noop, complete = noop } = options
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

function getBluetoothAdapterState(options = {}) {
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

function onBluetoothAdapterStateChange(callback) {
  if (!manager) {
    return
  }
  if (!stateSubscription) {
    manager.onStateChange((newState) => {
      onStateChangeCallbacks.forEach((callback) => {
        callback({
          available: newState === 'PoweredOn',
          discovering
        })
      })
    }, true)
  }
  if (onStateChangeCallbacks.indexOf(callback) === -1) {
    onStateChangeCallbacks.push(callback)
  }
}

function offBluetoothAdapterStateChange(callback) {
  const index = deviceFoundCallbacks.indexOf(callback)
  if (index > -1) {
    deviceFoundCallbacks.splice(index, 1)
  }
  if (deviceFoundCallbacks.length === 0 && stateSubscription) {
    stateSubscription.remove()
    stateSubscription = null
  }
}

function getBluetoothDevices(options = {}) {
  if (!manager) {
    return
  }
  const { success = noop, complete = noop } = options
  const result = {
    errMsg: 'getBluetoothDevices:ok',
    devices: getDevices // 返回已扫描的设备列表
  }
  success(result)
  complete(result)
}

function writeBLECharacteristicValue (options = {}) {
  if (!manager) {
    return
  }
  const { deviceId, serviceId, characteristicId, value, success = noop, fail = noop, complete = noop } = options  // todo 验证一下为空的情况
  manager.writeCharacteristicWithResponseForDevice(
    deviceId,
    serviceId,
    characteristicId,
    value
  ).then(() => {
    const result = {
      errMsg: 'writeBLECharacteristicValue:ok'
    }
    success(result)
    complete(result)
  }).catch((error) => {
    const result = {
      errMsg: 'writeBLECharacteristicValue:fail ' + (error?.message || '')
    }
    fail(result)
    complete(result)
  })
}

function readBLECharacteristicValue (options = {}) {
  if (!manager) {
    return
  }
  const { deviceId, serviceId, characteristicId, success = noop, fail = noop, complete = noop } = options  // todo 验证一下为空的情况
  manager.readCharacteristicForDevice(
    deviceId,
    serviceId,
    characteristicId
  ).then((characteristic) => {
    const result = {
      errMsg: 'readBLECharacteristicValue:ok',
      value: characteristic.value
    }
    success(result)
    complete(result)
  }).catch((error) => {
    const result = {
      errMsg: 'readBLECharacteristicValue:fail ' + (error?.message || '')
    }
    fail(result)
    complete(result)
  })
}

function notifyBLECharacteristicValueChange (options = {}) {
  if (!manager) {
    return
  }
  const { deviceId, serviceId, characteristicId, state = true, success = noop, fail = noop, complete = noop } = options  // todo 验证一下为空的情况
  const key = `${deviceId}-${serviceId}-${characteristicId}`
  if (state) {
    if (characteristicSubscriptions[key]) {
      const result = {
        errMsg: 'notifyBLECharacteristicValueChange:ok'
      }
      success(result)
      complete(result)
      return
    }
    characteristicSubscriptions[key] = manager.monitorCharacteristicForDevice(
      deviceId,
      serviceId,
      characteristicId,
      (error, characteristic) => {
        if (characteristic && characteristic.value) {
          const res = {
            deviceId,
            serviceId,
            characteristicId,
            value: base64ToArrayBuffer(characteristic.value)
          }
          if (characteristicCallbacks.length > 0) {
            characteristicCallbacks.forEach((callback) => {
              callback(res)
            })
          }
        }
      }
    ).then(() => {
      const result = {
        errMsg: 'notifyBLECharacteristicValueChange:ok'
      }
      success(result)
      complete(result)
    }).catch((error) => {
      const result = {
        errMsg: 'notifyBLECharacteristicValueChange:fail ' + (error?.message || '')
      }
      fail(result)
      complete(result)
    })
  } else {
    if (characteristicSubscriptions[key]) {
      characteristicSubscriptions[key].remove()
      delete characteristicSubscriptions[key]
      const result = {
        errMsg: 'notifyBLECharacteristicValueChange:ok'
      }
      success(result)
      complete(result)
    } else {
      const result = {
        errMsg: 'notifyBLECharacteristicValueChange:ok'
      }
      success(result)
      complete(result)
    }
  }
}

function onBLECharacteristicValueChange (callback) {
  if (characteristicCallbacks.indexOf(callback) === -1) {
    characteristicCallbacks.push(callback)
  }
}

function offBLECharacteristicValueChange (callback) {
  const index = characteristicCallbacks.indexOf(callback)
  if (index > -1) {
    characteristicCallbacks.splice(index, 1)
  }
}

function setBLEMTU (options = {}) {
  if (!createBLEConnectionIsReady) { // 需要验证是否需要前置openBluetoothAdapter
    return
  }
  const { deviceId, mtu, success = noop, fail = noop, complete = noop } = options  // todo 验证一下为空的情况
  manager.requestMTUForDevice(deviceId, mtu).then((device) => {
    const result = {
      errMsg: 'setBLEMTU:ok',
      mtu: device.mtu
    }
    success(result)
    complete(result)
  }).catch((error) => {
    const result = {
      errMsg: 'setBLEMTU:fail ' + (error?.message || '')
    }
    fail(result)
    complete(result)
  })
}

function getBLEDeviceRSSI (options = {}) {
  const { deviceId, success = noop, fail = noop, complete = noop } = options
  manager.readRSSIForDevice(deviceId).then((rssi) => {
    const result = {
      errMsg: 'getBLEDeviceRSSI:ok',
      RSSI: rssi
    }
    success(result)
    complete(result)
  }).catch((error) => {
    const result = {
      errMsg: 'getBLEDeviceRSSI:fail ' + (error?.message || '')
    }
    fail(result)
    complete(result)
  })
}

function getBLEDeviceServices (options = {}) {
  if (!createBLEConnectionIsReady) { // 需要验证是否需要前置openBluetoothAdapter
    return
  }
  const { deviceId, success = noop, fail = noop, complete = noop } = options  // todo 验证一下为空的情况
  manager.servicesForDevice(deviceId).then((services) => {
    const result = {
      errMsg: 'getBLEDeviceServices:ok',
      services: services.map(service => ({
        uuid: service.uuid,
        isPrimary: service.isPrimary
      }))
    }

    // 获取
    services.forEach(service => {
      BLEDeviceCharacteristics[`${deviceId}-${service.uuid}`] = {
        uuid: service.uuid,
        properties: '' // 先置空，等获取特征值后再赋值
      }
    })
    success(result)
    complete(result)
  }).catch((error) => {
    const result = {
      errMsg: 'getBLEDeviceServices:fail ' + (error?.message || '')
    }
    fail(result)
    complete(result)
  })
}

function getBLEDeviceCharacteristics (options = {}) {
  if (!createBLEConnectionIsReady) { // 需要验证是否需要前置openBluetoothAdapter
    return
  }
  const { deviceId, serviceId, success = noop, complete = noop } = options  // todo 验证一下为空的情况
  const result = {
    errMsg: 'getBLEDeviceCharacteristics:ok',
    characteristics: BLEDeviceCharacteristics[`${deviceId}-${serviceId}`] || []
  }
  success(result)
  complete(result)
}

function createBLEConnection (options = {}) {
  const { deviceId, timeout, success = noop, fail = noop, complete = noop } = options
  const connectionOptions = {}
  if (timeout) {
    connectionOptions.timeout = timeout
  }
  manager.connectToDevice(deviceId, connectionOptions).then((device) => {
    const result = {
      errMsg: 'createBLEConnection:ok'
    }
    success(result)
    complete(result)
  }).catch((error) => {
    const result = {
      errMsg: 'createBLEConnection:fail ' + (error?.message || '')
    }
    fail(result)
    complete(result)
  })
}

function closeBLEConnection (options = {}) {
  const { deviceId, success = noop, fail = noop, complete = noop } = options
  manager.cancelDeviceConnection(deviceId).then(() => {
    const result = {
      errMsg: 'closeBLEConnection:ok'
    }
    success(result)
    complete(result)
  }).catch((error) => {
    const result = {
      errMsg: 'closeBLEConnection:fail ' + (error?.message || '')
    }
    fail(result)
    complete(result)
  })
}

export {
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
  getBLEDeviceCharacteristics,
  createBLEConnection,
  closeBLEConnection
}