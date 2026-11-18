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
  hasOwn: (value, key) => Object.prototype.hasOwnProperty.call(value, key),
  isFunction: value => typeof value === 'function'
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
let subscribeDimensionsChange
const originalWindowChange = global.__mpxWindowResizeHandler

const dimensions = {
  window: { width: 360, height: 640 },
  screen: { width: 720, height: 1280 }
}

describe('RN dimensions helper', () => {
  beforeEach(() => {
    jest.resetModules()
    delete global.__mpxWindowResizeHandler
    Mpx = require('../../src/index').default
    const dimensionsHelper = require('../../src/platform/dimensionsHelper')
    getDimensionsInfo = dimensionsHelper.getDimensionsInfo
    syncDimensions = dimensionsHelper.syncDimensions
    subscribeDimensionsChange = dimensionsHelper.subscribeDimensionsChange
    Mpx.config.rnConfig = {
      dimensionsBase: 'window'
    }
    global.__classCaches = new Set()
    global.__mpxSizeCount = 0
    global.__mpxPageSizeCountMap = {}
    global.__mpxPageStatusMap = {}
  })

  afterEach(() => {
    global.__mpxWindowResizeHandler = originalWindowChange
  })

  it('keeps layout subscribers silent on initial reads', () => {
    const layoutChange = jest.fn()
    subscribeDimensionsChange(layoutChange)

    getDimensionsInfo()
    getDimensionsInfo('screen')

    expect(layoutChange).not.toHaveBeenCalled()
  })

  it('keeps layout subscribers silent when the first native event initializes dimensions', () => {
    const layoutChange = jest.fn()
    subscribeDimensionsChange(layoutChange)

    syncDimensions(dimensions)

    expect(layoutChange).not.toHaveBeenCalled()
  })

  it.each(['window', 'screen'])('updates layout when only the non-selected dimensions change under the %s base', base => {
    Mpx.config.rnConfig.dimensionsBase = base
    getDimensionsInfo()
    const otherBase = base === 'window' ? 'screen' : 'window'
    const nextDimensions = Object.assign({}, dimensions, { [otherBase]: { width: 640, height: 360 } })
    const layoutChange = jest.fn(() => {
      expect(getDimensionsInfo(otherBase)).toEqual(nextDimensions[otherBase])
    })
    const unsubscribe = subscribeDimensionsChange(layoutChange)
    global.__mpxWindowResizeHandler = jest.fn()

    syncDimensions(nextDimensions)

    expect(layoutChange).toHaveBeenCalledTimes(1)
    expect(global.__mpxWindowResizeHandler).not.toHaveBeenCalled()
    expect(global.__mpxSizeCount).toBe(0)
    unsubscribe()
    syncDimensions(dimensions)
    expect(layoutChange).toHaveBeenCalledTimes(1)
  })

  it.each(['window', 'screen'])('notifies window change after committing processed %s dimensions', base => {
    Mpx.config.rnConfig.dimensionsBase = base
    Mpx.config.rnConfig.customDimensions = value => ({
      window: Object.assign({}, value.window, { width: value.window.width / 2 }),
      screen: Object.assign({}, value.screen, { width: value.screen.width / 2 })
    })
    global.__mpxWindowResizeHandler = jest.fn(value => {
      expect(getDimensionsInfo()).toEqual(value)
    })

    getDimensionsInfo()
    expect(global.__mpxWindowResizeHandler).not.toHaveBeenCalled()
    const nextDimensions = {
      window: { width: 640, height: 360 },
      screen: { width: 1280, height: 720 }
    }
    syncDimensions(nextDimensions)
    syncDimensions(nextDimensions)

    expect(global.__mpxWindowResizeHandler).toHaveBeenCalledTimes(1)
    expect(global.__mpxWindowResizeHandler).toHaveBeenCalledWith({
      width: nextDimensions[base].width / 2,
      height: nextDimensions[base].height
    })
  })

  it('keeps resize silent when customDimensions produces the same effective size', () => {
    Mpx.config.rnConfig.customDimensions = value => {
      value.window = { width: 320, height: 600 }
      return value
    }
    const listener = global.__mpxWindowResizeHandler = jest.fn()
    getDimensionsInfo()
    expect(listener).not.toHaveBeenCalled()
    syncDimensions({
      window: { width: 640, height: 360 },
      screen: { width: 1280, height: 720 }
    })
    expect(global.__mpxSizeCount).toBe(0)
    expect(listener).not.toHaveBeenCalled()
    expect(getDimensionsInfo()).toEqual({ width: 320, height: 600 })
  })

  it('keeps resize silent when the Window changes but the Screen base stays equal', () => {
    Mpx.config.rnConfig.dimensionsBase = 'screen'
    getDimensionsInfo()
    global.__mpxWindowResizeHandler = jest.fn()

    syncDimensions({
      window: { width: 640, height: 360 },
      screen: dimensions.screen
    })

    expect(global.__mpxWindowResizeHandler).not.toHaveBeenCalled()
    expect(getDimensionsInfo('window')).toEqual({ width: 640, height: 360 })
    expect(getDimensionsInfo()).toEqual(dimensions.screen)
    expect(global.__mpxSizeCount).toBe(0)
  })

  it('initializes the first native update as the resize comparison baseline', () => {
    global.__mpxWindowResizeHandler = jest.fn()
    const nextDimensions = {
      window: { width: 640, height: 360 },
      screen: { width: 1280, height: 720 }
    }

    syncDimensions(nextDimensions)

    expect(global.__mpxWindowResizeHandler).not.toHaveBeenCalled()
    expect(getDimensionsInfo()).toEqual(nextDimensions.window)
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
