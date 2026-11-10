import { getWindowInfo } from '../../src/platform/api/system/rnSystem'
import { getSystemInfoSync } from '../../src/platform/api/system/index.ios'

jest.mock('react-native-device-info', () => ({
  getBrand: jest.fn(() => 'brand'),
  getModel: jest.fn(() => 'model'),
  getSystemName: jest.fn(() => 'iOS'),
  getSystemVersion: jest.fn(() => '18.0'),
  isEmulatorSync: jest.fn(() => false)
}), { virtual: true })

jest.mock('react-native', () => ({
  PixelRatio: {
    getFontScale: jest.fn(() => 1)
  }
}), { virtual: true })

jest.mock('../../src/platform/api/system/rnSystem', () => ({
  getWindowInfo: jest.fn(),
  getLaunchOptionsSync: jest.fn(),
  getEnterOptionsSync: jest.fn()
}))

describe('RN system API', () => {
  test.each([
    [{ screenWidth: 844, screenHeight: 390 }, 'landscape'],
    [{ screenWidth: 390, screenHeight: 844 }, 'portrait']
  ])('should return the device orientation for the screen size', (windowInfo, deviceOrientation) => {
    getWindowInfo.mockReturnValue(windowInfo)

    expect(getSystemInfoSync().deviceOrientation).toBe(deviceOrientation)
  })
})
