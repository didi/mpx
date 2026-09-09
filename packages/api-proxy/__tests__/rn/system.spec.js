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

describe('RN window info API', () => {
  beforeEach(() => {
    jest.resetModules()
    global.mpxGlobal = global
    global.__mpx = {
      config: {
        rnConfig: {
          customDimensions: jest.fn()
        }
      }
    }
  })

  afterEach(() => {
    delete global.mpxGlobal
    delete global.__mpx
    delete global.__getMpxAppDimensionsInfo
  })

  test('should use the dimensions processed by customDimensions', () => {
    const dimensions = {
      window: { width: 390, height: 844 },
      screen: { width: 390, height: 844 }
    }
    jest.doMock('react-native', () => ({
      Dimensions: {
        get: jest.fn((type) => dimensions[type])
      },
      PixelRatio: {
        get: jest.fn(() => 3)
      }
    }))
    jest.doMock('react-native-safe-area-context', () => ({
      initialWindowMetrics: {
        insets: { top: 44, left: 0, bottom: 34, right: 0 }
      }
    }), { virtual: true })
    global.__getMpxAppDimensionsInfo = jest.fn(() => ({
      window: { width: 320, height: 844 },
      screen: { width: 320, height: 844 }
    }))

    const { getWindowInfo } = jest.requireActual('../../src/platform/api/system/rnSystem')
    const windowInfo = getWindowInfo()

    expect(global.__getMpxAppDimensionsInfo).toHaveBeenCalled()
    expect(global.__mpx.config.rnConfig.customDimensions).not.toHaveBeenCalled()
    expect(windowInfo).toEqual(expect.objectContaining({
      windowWidth: 320,
      windowHeight: 844,
      screenWidth: 320,
      screenHeight: 844,
      safeArea: {
        left: 0,
        right: 390,
        top: 44,
        bottom: 810,
        height: 766,
        width: 390
      }
    }))
  })
})
