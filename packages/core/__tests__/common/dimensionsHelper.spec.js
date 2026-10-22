jest.mock('../../src/index', () => ({
  __esModule: true,
  default: {
    config: {
      rnConfig: {
        dimensionsBase: 'window'
      }
    }
  }
}))

jest.mock('@mpxjs/utils', () => ({
  getFocusedNavigation: jest.fn(),
  hasOwn: (value, key) => Object.prototype.hasOwnProperty.call(value, key)
}))

jest.mock('react-native', () => ({
  Dimensions: {
    get: jest.fn(type => type === 'window'
      ? { width: 360, height: 640 }
      : { width: 720, height: 1280 })
  }
}), { virtual: true })

let Mpx
let getDimensionsInfo
let syncDimensions

const dimensions = {
  window: { width: 360, height: 640 },
  screen: { width: 720, height: 1280 }
}

describe('RN dimensions helper', () => {
  beforeEach(() => {
    jest.resetModules()
    Mpx = require('../../src/index').default
    const dimensionsHelper = require('../../src/platform/dimensionsHelper')
    getDimensionsInfo = dimensionsHelper.getDimensionsInfo
    syncDimensions = dimensionsHelper.syncDimensions
    Mpx.config.rnConfig = {
      dimensionsBase: 'window'
    }
    global.__classCaches = new Set()
    global.__mpxSizeCount = 0
    global.__mpxPageSizeCountMap = {}
    global.__mpxPageStatusMap = {}
  })

  it('uses customDimensions for the initial style dimensions', () => {
    const customDimensions = jest.fn((dimensions) => {
      dimensions.window.width /= 2
      return dimensions
    })
    Mpx.config.rnConfig.customDimensions = customDimensions

    expect(getDimensionsInfo().width).toBe(180)
    expect(customDimensions).toHaveBeenCalledTimes(1)
  })

  it('handles Dimensions changes before the first dimensions read', () => {
    syncDimensions({
      window: { width: 400, height: 700 },
      screen: { width: 800, height: 1400 }
    })

    expect(getDimensionsInfo('window')).toEqual({ width: 400, height: 700 })
    expect(getDimensionsInfo('screen')).toEqual({ width: 800, height: 1400 })
  })

  it('applies runtime dimension config only after dimensions are synchronized', () => {
    expect(getDimensionsInfo().width).toBe(360)
    const customDimensions = jest.fn((dimensions) => {
      dimensions.window.width /= 2
      return dimensions
    })

    Mpx.config.rnConfig.customDimensions = customDimensions

    expect(getDimensionsInfo().width).toBe(360)
    expect(customDimensions).not.toHaveBeenCalled()

    syncDimensions(dimensions)

    expect(getDimensionsInfo().width).toBe(180)
    expect(customDimensions).toHaveBeenCalledTimes(1)
  })

  it('does not expose the dimensions object retained by customDimensions', () => {
    let retainedDimensions
    Mpx.config.rnConfig.customDimensions = (dimensions) => {
      retainedDimensions = dimensions
      return dimensions
    }

    expect(getDimensionsInfo().width).toBe(360)

    retainedDimensions.window.width = 180

    expect(getDimensionsInfo().width).toBe(360)
  })

  it('keeps the last effective dimensions when customDimensions throws', () => {
    expect(getDimensionsInfo().width).toBe(360)
    Mpx.config.rnConfig.customDimensions = () => {
      throw new Error('custom dimensions failed')
    }

    expect(() => syncDimensions(dimensions)).toThrow('custom dimensions failed')
    expect(getDimensionsInfo().width).toBe(360)
  })

  it('rejects dimensions-dependent APIs called while applying customDimensions', () => {
    Mpx.config.rnConfig.customDimensions = () => getDimensionsInfo()

    expect(() => getDimensionsInfo()).toThrow(
      'Do not call getDimensionsInfo, getWindowInfo, getSystemInfo, or other APIs that depend on customDimensions results inside rnConfig.customDimensions.'
    )

    delete Mpx.config.rnConfig.customDimensions
    expect(getDimensionsInfo().width).toBe(360)
  })

  it('rejects dimensions-dependent APIs during later customDimensions synchronization', () => {
    expect(getDimensionsInfo().width).toBe(360)
    Mpx.config.rnConfig.customDimensions = () => getDimensionsInfo()

    expect(() => syncDimensions(dimensions)).toThrow(
      'Do not call getDimensionsInfo, getWindowInfo, getSystemInfo, or other APIs that depend on customDimensions results inside rnConfig.customDimensions.'
    )
    expect(getDimensionsInfo().width).toBe(360)
  })

  it('keeps the initial dimensions base after the config changes', () => {
    expect(getDimensionsInfo().width).toBe(360)

    Mpx.config.rnConfig.dimensionsBase = 'screen'
    syncDimensions({
      window: dimensions.window,
      screen: { width: 1400, height: 800 }
    })

    expect(getDimensionsInfo().width).toBe(360)
  })
})
