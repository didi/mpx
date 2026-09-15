import BleManager from 'react-native-ble-manager'
import {
  writeBLECharacteristicValue,
  readBLECharacteristicValue,
  notifyBLECharacteristicValueChange,
  setBLEMTU,
  getBLEDeviceRSSI,
  getBLEDeviceServices,
  getBLEDeviceCharacteristics,
  createBLEConnection,
  closeBLEConnection
} from '../../src/platform/api/ble-connection/index.ios'

jest.mock('react-native', () => ({
  Platform: {
    Version: 30
  },
  PermissionsAndroid: {
    PERMISSIONS: {},
    RESULTS: {},
    requestMultiple: jest.fn()
  }
}), { virtual: true })

jest.mock('react-native-ble-manager', () => ({
  __esModule: true,
  default: {
    write: jest.fn(),
    writeWithoutResponse: jest.fn(),
    read: jest.fn(),
    startNotification: jest.fn(),
    stopNotification: jest.fn(),
    requestMTU: jest.fn(),
    readRSSI: jest.fn(),
    retrieveServices: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn()
  }
}), { virtual: true })

describe('RN BLE connection APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test.each([
    ['writeBLECharacteristicValue', writeBLECharacteristicValue, {
      errMsg: 'writeBLECharacteristicValue:fail parameter error',
      errno: 1001
    }],
    ['readBLECharacteristicValue', readBLECharacteristicValue, {
      errMsg: 'readBLECharacteristicValue:fail parameter error',
      errno: 1509000
    }],
    ['notifyBLECharacteristicValueChange', notifyBLECharacteristicValueChange, {
      errMsg: 'notifyBLECharacteristicValueChange:fail parameter error',
      errno: 1509000
    }],
    ['getBLEDeviceRSSI', getBLEDeviceRSSI, {
      errMsg: 'getBLEDeviceRSSI:fail parameter error',
      errno: 1509000
    }],
    ['getBLEDeviceServices', getBLEDeviceServices, {
      errMsg: 'getBLEDeviceServices:fail parameter error',
      errno: 1509000,
      services: []
    }],
    ['getBLEDeviceCharacteristics', getBLEDeviceCharacteristics, {
      errMsg: 'getBLEDeviceCharacteristics:fail parameter error',
      errno: 1509000,
      characteristics: []
    }],
    ['createBLEConnection', createBLEConnection, {
      errMsg: 'createBLEConnection:fail parameter error',
      errno: 1509000
    }],
    ['closeBLEConnection', closeBLEConnection, {
      errMsg: 'closeBLEConnection:fail parameter error',
      errno: 1509000
    }]
  ])('%s should fail when required parameters are missing', (apiName, api, result) => {
    const success = jest.fn()
    const fail = jest.fn()
    const complete = jest.fn()

    api({ success, fail, complete })

    expect(success).not.toHaveBeenCalled()
    expect(fail).toHaveBeenCalledWith(result)
    expect(complete).toHaveBeenCalledWith(result)
    Object.values(BleManager).forEach((method) => {
      expect(method).not.toHaveBeenCalled()
    })
  })

  test('setBLEMTU should fail when deviceId and mtu are missing', () => {
    const success = jest.fn()
    const fail = jest.fn()
    const complete = jest.fn()

    setBLEMTU({ success, fail, complete })

    expect(success).not.toHaveBeenCalled()
    expect(fail).toHaveBeenCalledWith(expect.objectContaining({
      errMsg: expect.stringMatching(/^setBLEMTU:fail parameter error/)
    }))
    expect(complete).toHaveBeenCalledWith(expect.objectContaining({
      errMsg: expect.stringMatching(/^setBLEMTU:fail parameter error/)
    }))
    expect(BleManager.requestMTU).not.toHaveBeenCalled()
  })
})
