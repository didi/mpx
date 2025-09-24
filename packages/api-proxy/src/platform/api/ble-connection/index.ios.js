import BleManager from 'react-native-ble-manager'
import { noop } from '@mpxjs/utils'
import mpx from '@mpxjs/core'
import { Platform, PermissionsAndroid } from 'react-native'
import { base64ToArrayBuffer } from '../base/index'

// BleManager 相关

// 全局状态管理
let bleManagerInitialized = false
let DiscoverPeripheralSubscription = null
let updateStateSubscription = null
let discovering = false
let getDevices = [] // 记录已扫描的设备列表
let deviceFoundCallbacks = []
let onStateChangeCallbacks = []
let characteristicCallbacks = []
let onBLEConnectionStateCallbacks = []
let characteristicSubscriptions = {}
let connectedDevices = new Set()
let createBLEConnectionTimeout = null
const BLEDeviceCharacteristics = {} // 记录已连接设备的特征值
const connectedDeviceId = []

// 请求蓝牙权限
const requestBluetoothPermission = async () => {
  if (__mpx_mode__ === 'android') {
    const permissions = [];
    if (Platform.Version >= 23 && Platform.Version <= 30) {
      permissions.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
    } else if (Platform.Version >= 31) {
      permissions.push(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      )
    }

    if (permissions.length === 0) {
      return true
    }
    const granted = await PermissionsAndroid.requestMultiple(permissions)
    return Object.values(granted).every(
      result => result === PermissionsAndroid.RESULTS.GRANTED,
    )
  }
  return true
}

const removeBluetoothDevicesDiscovery = function () {
  if (DiscoverPeripheralSubscription) {
    DiscoverPeripheralSubscription.remove()
    DiscoverPeripheralSubscription = null
  }
}
const removeUpdateStateSubscription = function () {
  if (updateStateSubscription && onStateChangeCallbacks.length === 0 && onBLEConnectionStateCallbacks.length === 0) {
    updateStateSubscription.remove()
    updateStateSubscription = null
  }
}
const commonFailHandler = function (errMsg, fail, complete) {
    const result = {
        errMsg
      }
    fail(result)
    complete(result)
  }
function openBluetoothAdapter (options = {}) {
  const { success = noop, fail = noop, complete = noop } = options
  let bluetoothPermission = requestBluetoothPermission
  if (__mpx_env__ === 'android' && mpx.rnConfig?.bluetoothPermission) { // 安卓需要验证权限，开放给用户可以自定义验证权限的方法
    bluetoothPermission = mpx.rnConfig.bluetoothPermission
  }
  // 先请求权限，再初始化蓝牙管理器
  bluetoothPermission().then((hasPermissions) => {
    if (!hasPermissions) {
      commonFailHandler('openBluetoothAdapter:fail no permission', fail, complete)
      return
    }

    if (bleManagerInitialized) {
      commonFailHandler('openBluetoothAdapter:fail already opened', fail, complete)
      return
    }
    
    BleManager.start({ showAlert: false }).then(() => {
      
      bleManagerInitialized = true
      
      // 检查蓝牙状态
      setTimeout(() => {
        BleManager.checkState().then((state) => {
          if (state === 'on') {
            const result = {
              errno: 0,
              errMsg: 'openBluetoothAdapter:ok'
            }
            success(result)
            complete(result)
          } else {
            commonFailHandler('openBluetoothAdapter:fail bluetooth not enabled', fail, complete)
          }
        }).catch((error) => {
          commonFailHandler('openBluetoothAdapter:fail ' + (error?.message || ''), fail, complete)
        })
      }, 1000)
    }).catch((error) => {
      commonFailHandler('openBluetoothAdapter:fail ' + (error?.message || ''), fail, complete)
    })
  }).catch(() => {
    commonFailHandler('openBluetoothAdapter:fail no permission', fail, complete)
  })
}

function closeBluetoothAdapter (options = {}) {
  const { success = noop, fail = noop, complete = noop } = options
  if (!bleManagerInitialized) {
    const result = {
      errMsg: 'closeBluetoothAdapter:fail 请先调用 wx.openBluetoothAdapter 接口进行初始化操作'
    }
    fail(result)
    complete(result)
    return
  }
  try {
    // 停止扫描
    if (discovering) {
      BleManager.stopScan()
      discovering = false
    }

    if (createBLEConnectionTimeout) { // 清除掉正在连接的蓝牙设备
      clearTimeout(createBLEConnectionTimeout)
    }
    
    removeUpdateStateSubscription()
    // 清理状态
    bleManagerInitialized = false
    discovering = false
    getDevices = []
    connectedDevices.clear()
    deviceFoundCallbacks.length = 0
    onStateChangeCallbacks.length = 0
    characteristicCallbacks.length = 0
    onBLEConnectionStateCallbacks.length = 0

    removeBluetoothDevicesDiscovery()

    // 清理订阅
    Object.keys(characteristicSubscriptions).forEach(key => {
      if (characteristicSubscriptions[key]) {
        characteristicSubscriptions[key].remove()
      }
    })
    characteristicSubscriptions = {}
    
    const result = {
      errMsg: 'closeBluetoothAdapter:ok'
    }
    success(result)
    complete(result)
  } catch (error) {
    const result = {
      errMsg: 'closeBluetoothAdapter:fail ' + error.message
    }
    fail(result)
    complete(result)
  }
}

function startBluetoothDevicesDiscovery (options = {}) {
  const {
    services = [],
    allowDuplicatesKey = false,
    success = noop,
    fail = noop,
    complete = noop
  } = options
  
  if (!bleManagerInitialized) {
    commonFailHandler('startBluetoothDevicesDiscovery:fail 请先调用 wx.openBluetoothAdapter 接口进行初始化操作', fail, complete)
    return
  }
  DiscoverPeripheralSubscription = BleManager.onDiscoverPeripheral((device) => {
    const advertising = device.advertising || {}
    const advertisData = advertising.manufacturerData?.data || null
    const deviceInfo = {
      deviceId: device.id,
      name: device.name || advertising.localName || '未知设备',
      RSSI: device.rssi || 0,
      advertisData: advertisData ? base64ToArrayBuffer(advertisData) : advertisData, // todo需要转换
      advertisServiceUUIDs: advertising.serviceUUIDs || [],
      localName: advertising.localName || '',
      serviceData: advertising.serviceData || {},
      connectable: advertising.isConnectable ? true : false
    }
    if (allowDuplicatesKey === false) {
      const existingDeviceIndex = getDevices.findIndex(existingDevice => existingDevice.deviceId === deviceInfo.deviceId)
      if (existingDeviceIndex > -1) {
        return
      }
    }
    deviceFoundCallbacks.forEach(cb => {cb({
      devices: [deviceInfo]
    })})
    getDevices.push(deviceInfo)
    // 处理设备发现逻辑
  })
  BleManager.scan(services, 0, allowDuplicatesKey).then((res) => { // 必须，没有开启扫描，onDiscoverPeripheral回调不会触发
    onStateChangeCallbacks.forEach(cb => {
      cb({
        available: true,
        discovering: true
      })
    })
    discovering = true
    getDevices = [] // 清空之前的发现设备列表
    const result = {
      errMsg: 'startBluetoothDevicesDiscovery:ok',
      isDiscovering: true
    }
    success(result)
    complete(result)
  }).catch((error) => {
    commonFailHandler('startBluetoothDevicesDiscovery:fail ' + (error?.message || ''), fail, complete)
  })
}

function stopBluetoothDevicesDiscovery (options = {}) {
  const { success = noop, fail = noop, complete = noop } = options
  
  if (!bleManagerInitialized) {
    commonFailHandler('stopBluetoothDevicesDiscovery:fail 请先调用 wx.openBluetoothAdapter 接口进行初始化操作', fail, complete)
    return
  }
  removeBluetoothDevicesDiscovery()
  BleManager.stopScan().then(() => {
    discovering = false
    onStateChangeCallbacks.forEach(cb => {
      cb({
        available: true,
        discovering: false
      })
    })
    const result = {
      errMsg: 'stopBluetoothDevicesDiscovery:ok'
    }
    success(result)
    complete(result)
  }).catch((error) => {
    commonFailHandler('stopBluetoothDevicesDiscovery:fail ' + (error?.message || ''), fail, complete)
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
  const { services = [], success = noop, fail = noop, complete = noop } = options
  
  if (!bleManagerInitialized) {
    commonFailHandler('getConnectedBluetoothDevices:fail 请先调用 wx.openBluetoothAdapter 接口进行初始化操作', fail, complete)
    return
  }
  
  BleManager.getConnectedPeripherals(services).then((peripherals) => {
    const devices = peripherals.map(peripheral => ({
      deviceId: peripheral.id,
      name: peripheral.name || '未知设备'
    }))
    const result = {
      errMsg: 'getConnectedBluetoothDevices:ok',
      devices: devices
    }
    success(result)
    complete(result)
  }).catch((error) => {
    commonFailHandler('getConnectedBluetoothDevices:fail ' + (error?.message || ''), fail, complete)
  })
}

function getBluetoothAdapterState(options = {}) {
  const { success = noop, fail = noop, complete = noop } = options
  
  if (!bleManagerInitialized) {
    commonFailHandler('getBluetoothAdapterState:fail bluetooth adapter not opened', fail, complete)
    return
  }
  
  BleManager.checkState().then((state) => {
    const result = {
      errMsg: 'getBluetoothAdapterState:ok',
      discovering,
      available: state === 'on'
    }
    success(result)
    complete(result)
  }).catch((error) => {
    commonFailHandler('getBluetoothAdapterState:fail ' + (error?.message || ''), fail, complete)
  })
}
function onDidUpdateState() {
  updateStateSubscription = BleManager.onDidUpdateState((state) => {
    onStateChangeCallbacks.forEach(cb => {
      cb({
        available: state.state === 'on',
        discovering: state.state === 'on' ? discovering : false
      })
    })
    if (onBLEConnectionStateCallbacks.length && connectedDeviceId.length && state.state !== 'on') {
      connectedDeviceId.forEach((id) => {
        onBLEConnectionStateCallbacks.forEach(cb => {
          cb({
            deviceId: id,
            connected: false
          })
        })
      })
    }
  })
}

function onBluetoothAdapterStateChange(callback) {
  if (!updateStateSubscription) {
    onDidUpdateState()
  }
  if (onStateChangeCallbacks.indexOf(callback) === -1) {
    onStateChangeCallbacks.push(callback)
  }
}

function offBluetoothAdapterStateChange(callback) {
  const index = onStateChangeCallbacks.indexOf(callback)
  if (index > -1) {
    onStateChangeCallbacks.splice(index, 1)
  }
  if (deviceFoundCallbacks.length === 0) {
    removeUpdateStateSubscription()
  }
}

function getBluetoothDevices(options = {}) { // 该能力只是获取应用级别已连接设备列表，非手机级别的已连接设备列表
  const { success = noop, complete = noop } = options
  
  const result = {
    errMsg: 'getBluetoothDevices:ok',
    devices: getDevices // 返回已扫描的设备列表
  }
  success(result)
  complete(result)
}

function writeBLECharacteristicValue (options = {}) {
  const { deviceId, serviceId, characteristicId, value, success = noop, fail = noop, complete = noop } = options
  
  if (!bleManagerInitialized) {
    const result = {
      errMsg: 'writeBLECharacteristicValue:fail bluetooth adapter not opened'
    }
    fail(result)
    complete(result)
    return
  }
  
  if (!deviceId || !serviceId || !characteristicId || !value) {
    const result = {
      errMsg: 'writeBLECharacteristicValue:fail invalid parameters'
    }
    fail(result)
    complete(result)
    return
  }

  // 将ArrayBuffer转换为byte array
  const bytes = Array.from(new Uint8Array(value))
  BleManager.write(deviceId, serviceId, characteristicId, bytes).then(() => {
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
  const { deviceId, serviceId, characteristicId, success = noop, fail = noop, complete = noop } = options
  
  if (!bleManagerInitialized) {
    const result = {
      errMsg: 'readBLECharacteristicValue:fail bluetooth adapter not opened'
    }
    fail(result)
    complete(result)
    return
  }
  
  if (!deviceId || !serviceId || !characteristicId) {
    const result = {
      errMsg: 'readBLECharacteristicValue:fail invalid parameters'
    }
    fail(result)
    complete(result)
    return
  }

  BleManager.read(deviceId, serviceId, characteristicId).then((data) => {
    // 将byte array转换为ArrayBuffer
    const buffer = new ArrayBuffer(data.length)
    const view = new Uint8Array(buffer)
    data.forEach((byte, index) => {
      view[index] = byte
    })
    
    const result = {
      errMsg: 'readBLECharacteristicValue:ok',
      value: buffer
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
  const { deviceId, serviceId, characteristicId, state = true, type = 'notification', success = noop, fail = noop, complete = noop } = options
  
  if (!bleManagerInitialized) {
    const result = {
      errMsg: 'notifyBLECharacteristicValueChange:fail bluetooth adapter not opened'
    }
    fail(result)
    complete(result)
    return
  }
  
  if (!deviceId || !serviceId || !characteristicId) {
    const result = {
      errMsg: 'notifyBLECharacteristicValueChange:fail invalid parameters'
    }
    fail(result)
    complete(result)
    return
  }

  const subscriptionKey = `${deviceId}_${serviceId}_${characteristicId}`
  
  if (state) {
    // 启用监听
    BleManager.startNotification(deviceId, serviceId, characteristicId).then(() => {
      characteristicSubscriptions[subscriptionKey] = true
      
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
    // 停止监听
    BleManager.stopNotification(deviceId, serviceId, characteristicId).then(() => {
      delete characteristicSubscriptions[subscriptionKey]
      
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
  const { deviceId, mtu, success = noop, fail = noop, complete = noop } = options
  
  // if (!bleManagerInitialized) {
  //   const result = {
  //     errMsg: 'setBLEMTU:fail bluetooth adapter not opened'
  //   }
  //   fail(result)
  //   complete(result)
  //   return
  // }
  if (!mtu) {
    commonFailHandler('setBLEMTU:fail parameter error: parameter.mtu should be Number instead of Undefined;', fail, complete)
    return
  }
  if (!deviceId) {
    commonFailHandler('setBLEMTU:fail parameter error: parameter.deviceId should be String instead of Undefined;', fail, complete)
    return
  }
  if (!deviceId && !mtu) {
    commonFailHandler('setBLEMTU:fail parameter error: parameter.deviceId should be String instead of Undefined;parameter.mtu should be Number instead of Undefined;', fail, complete)
    return
  }

  BleManager.requestMTU(deviceId, mtu).then((actualMtu) => {
    const result = {
      errMsg: 'setBLEMTU:ok',
      mtu: actualMtu
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
  
  if (!bleManagerInitialized) {
    const result = {
      errMsg: 'getBLEDeviceRSSI:fail bluetooth adapter not opened'
    }
    fail(result)
    complete(result)
    return
  }
  
  if (!deviceId) {
    const result = {
      errMsg: 'getBLEDeviceRSSI:fail parameter error: parameter.deviceId should be String instead of Undefined;'
    }
    fail(result)
    complete(result)
    return
  }

  BleManager.readRSSI(deviceId).then((rssi) => {
    const result = {
      errMsg: 'getBLEDeviceRSSI:ok',
      RSSI: rssi
    }
    success(result)
    complete(result)
  }).catch((error) => {
    const errmsg = typeof error === 'string' ? error : (error?.message || '')
    const result = {
      errMsg: 'getBLEDeviceRSSI:fail ' + errmsg
    }
    fail(result)
    complete(result)
  })
}

function getBLEDeviceServices (options = {}) {
  const { deviceId, success = noop, fail = noop, complete = noop } = options
  
  if (!bleManagerInitialized) {
    const result = {
      errMsg: 'getBLEDeviceServices:fail bluetooth adapter not opened'
    }
    fail(result)
    complete(result)
    return
  }
  
  if (!deviceId) {
    const result = {
      errMsg: 'getBLEDeviceServices:fail invalid parameters'
    }
    fail(result)
    complete(result)
    return
  }
  BleManager.retrieveServices(deviceId).then((peripheralInfo) => {
    const services = peripheralInfo.services.map(service => ({
      uuid: service.uuid,
      isPrimary: true
    }))
    
    // 存储服务信息
    BLEDeviceCharacteristics[deviceId] = peripheralInfo
    
    const result = {
      errMsg: 'getBLEDeviceServices:ok',
      services: services
    }
    success(result)
    complete(result)
  }).catch((error) => {
    const errmsg = typeof error === 'string' ? error : (error?.message || '')
    const result = {
      errMsg: 'getBLEDeviceServices:fail ' + errmsg
    }
    fail(result)
    complete(result)
  })
}

function getBLEDeviceCharacteristics (options = {}) {
  const { deviceId, serviceId, success = noop, fail = noop, complete = noop } = options
  
  if (!bleManagerInitialized) {
    const result = {
      errMsg: 'getBLEDeviceCharacteristics:fail 请先调用 wx.openBluetoothAdapter 接口进行初始化操作'
    }
    fail(result)
    complete(result)
    return
  }
  
  if (!deviceId || !serviceId) {
    const result = {
      errMsg: 'getBLEDeviceCharacteristics:fail invalid parameters'
    }
    fail(result)
    complete(result)
    return
  }

  const peripheralInfo = BLEDeviceCharacteristics[deviceId]
  if (!peripheralInfo) {
    const result = {
      errMsg: 'getBLEDeviceCharacteristics:fail device services not retrieved'
    }
    fail(result)
    complete(result)
    return
  }
  const characteristicsList = peripheralInfo.characteristics || []
  const service = characteristicsList.find(c => c.service.toLowerCase() === serviceId.toLowerCase())
  if (!service && !characteristicsList.length) {
    const result = {
      errMsg: 'getBLEDeviceCharacteristics:fail service not found'
    }
    fail(result)
    complete(result)
    return
  }

  const characteristics = characteristicsList.map(char => ({
    uuid: char.uuid,
    properties: char.properties
  }))

  const result = {
    errMsg: 'getBLEDeviceCharacteristics:ok',
    characteristics
  }
  success(result)
  complete(result)
}

function createBLEConnection (options = {}) {
  const { deviceId, timeout, success = noop, fail = noop, complete = noop } = options

  if (!bleManagerInitialized) {
    commonFailHandler('getConnectedBluetoothDevices:fail 请先调用 wx.openBluetoothAdapter 接口进行初始化操作', fail, complete)
    return
  }

  if (!deviceId) {
    const result = {
      errMsg: 'createBLEConnection:fail parameter error: parameter.deviceId should be String instead of Undefined;'
    }
    fail(result)
    complete(result)
    return
  }

  BleManager.connect(deviceId).then(() => {
    if (connectedDeviceId.indexOf(deviceId) !== -1) {
      connectedDeviceId.push(deviceId) // 记录一下已连接的设备id
    }
    clearTimeout(createBLEConnectionTimeout)
    onBLEConnectionStateCallbacks.forEach(cb => {
      cb({
        deviceId,
        connected: true
      })
    })
    connectedDevices.add(deviceId)
    const result = {
      errMsg: 'createBLEConnection:ok'
    }
    success(result)
    complete(result)
  }).catch((error) => {
    clearTimeout(createBLEConnectionTimeout)
    const result = {
      errMsg: 'createBLEConnection:fail ' + (error?.message || '')
    }
    fail(result)
    complete(result)
  })
  if (timeout) {
    createBLEConnectionTimeout = setTimeout(() => { // 超时处理，仅ios会一直连接，android不会 
      BleManager.disconnect(deviceId).catch(() => {})
    }, timeout)
  }
}

function closeBLEConnection (options = {}) {
  const { deviceId, success = noop, fail = noop, complete = noop } = options
  
  if (!bleManagerInitialized) {
    commonFailHandler('getConnectedBluetoothDevices:fail 请先调用 wx.openBluetoothAdapter 接口进行初始化操作', fail, complete)
    return
  }
  
  if (!deviceId) {
    const result = {
      errMsg: 'closeBLEConnection:fail parameter error: parameter.deviceId should be String instead of Undefined;'
    }
    fail(result)
    complete(result)
    return
  }

  BleManager.disconnect(deviceId).then(() => {
    const index = connectedDeviceId.indexOf(deviceId)
    if (index !== -1) {
      connectedDeviceId.splice(index, 1) // 记录一下已连接的设备id
    }
    onBLEConnectionStateCallbacks.forEach(cb => {
      cb({
        deviceId,
        connected: false
      })
    })
    connectedDevices.delete(deviceId)
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

function onBLEConnectionStateChange(callback) {
  if (!updateStateSubscription) {
    onDidUpdateState()
  }
  if (onBLEConnectionStateCallbacks.indexOf(callback) === -1) {
    onBLEConnectionStateCallbacks.push(callback)
  }
}

function offBLEConnectionStateChange(callback) {
  const index = onBLEConnectionStateCallbacks.indexOf(callback)
  if (index !== -1) {
    onBLEConnectionStateCallbacks.splice(index, 1)
  }
  if (onBLEConnectionStateCallbacks.length === 0) {
    removeUpdateStateSubscription()
  }
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
  closeBLEConnection,
  onBLEConnectionStateChange,
  offBLEConnectionStateChange
}