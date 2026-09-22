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

// eslint-disable-next-line import/first
import Mpx from '../../src/index'
// eslint-disable-next-line import/first
import { ONRESIZE } from '../../src/core/innerLifecycle'
// eslint-disable-next-line import/first
import { getDimensionsBase, getSystemInfo, initDimensionsInfo, syncDimensions, triggerResizeEvent } from '../../src/platform/dimensionsHelper'

const dimensions = {
  window: { width: 360, height: 640 },
  screen: { width: 720, height: 1280 }
}

describe('RN dimensions helper', () => {
  beforeEach(() => {
    Mpx.config.rnConfig = {
      dimensionsBase: 'window'
    }
    global.__classCaches = new Set()
    global.__mpxSizeCount = 0
    global.__mpxPageSizeCountMap = {}
    global.__mpxPageStatusMap = {}
    initDimensionsInfo(dimensions)
  })

  it('uses customDimensions for the initial onResize size snapshot', () => {
    const customDimensions = jest.fn((dimensions) => {
      dimensions.window.width /= 2
      return dimensions
    })
    Mpx.config.rnConfig.customDimensions = customDimensions

    expect(getSystemInfo().size.windowWidth).toBe(180)
    expect(customDimensions).toHaveBeenCalledTimes(1)
  })

  it('applies runtime dimension config only after dimensions are synchronized', () => {
    expect(getSystemInfo().size.windowWidth).toBe(360)
    const customDimensions = jest.fn((dimensions) => {
      dimensions.window.width /= 2
      return dimensions
    })

    Mpx.config.rnConfig.customDimensions = customDimensions

    expect(getSystemInfo().size.windowWidth).toBe(360)
    expect(customDimensions).not.toHaveBeenCalled()

    syncDimensions(dimensions)

    expect(getSystemInfo().size.windowWidth).toBe(180)
    expect(customDimensions).toHaveBeenCalledTimes(1)
  })

  it('does not expose the dimensions object retained by customDimensions', () => {
    let retainedDimensions
    Mpx.config.rnConfig.customDimensions = (dimensions) => {
      retainedDimensions = dimensions
      return dimensions
    }

    expect(getSystemInfo().size.windowWidth).toBe(360)

    retainedDimensions.window.width = 180

    expect(getSystemInfo().size.windowWidth).toBe(360)
  })

  it('keeps the last effective dimensions when customDimensions throws', () => {
    expect(getSystemInfo().size.windowWidth).toBe(360)
    Mpx.config.rnConfig.customDimensions = () => {
      throw new Error('custom dimensions failed')
    }

    expect(() => syncDimensions(dimensions)).toThrow('custom dimensions failed')
    expect(getSystemInfo().size.windowWidth).toBe(360)
  })

  it('rejects dimensions-dependent APIs called while applying customDimensions', () => {
    Mpx.config.rnConfig.customDimensions = () => getSystemInfo()

    expect(() => getSystemInfo()).toThrow(
      'Do not call getWindowInfo, getSystemInfo, or other APIs that depend on customDimensions results inside rnConfig.customDimensions.'
    )

    delete Mpx.config.rnConfig.customDimensions
    expect(getSystemInfo().size.windowWidth).toBe(360)
  })

  it('rejects dimensions-dependent APIs during later customDimensions synchronization', () => {
    expect(getSystemInfo().size.windowWidth).toBe(360)
    Mpx.config.rnConfig.customDimensions = () => getSystemInfo()

    expect(() => syncDimensions(dimensions)).toThrow(
      'Do not call getWindowInfo, getSystemInfo, or other APIs that depend on customDimensions results inside rnConfig.customDimensions.'
    )
    expect(getSystemInfo().size.windowWidth).toBe(360)
  })

  function createPageResizeContext () {
    const target = {
      onResize: jest.fn()
    }
    return {
      target,
      mpxProxy: {
        options: { __type__: 'page' },
        target,
        callHook: jest.fn()
      },
      sizeRef: {
        current: Object.assign(getSystemInfo(), { dimensionsBase: getDimensionsBase() })
      }
    }
  }

  it('triggers onResize only when Window changes in window mode', () => {
    const { target, mpxProxy, sizeRef } = createPageResizeContext()

    global.__mpxAppDimensionsInfo.screen = { width: 800, height: 1400 }
    triggerResizeEvent(mpxProxy, sizeRef)

    expect(mpxProxy.callHook).not.toHaveBeenCalled()
    expect(target.onResize).not.toHaveBeenCalled()

    global.__mpxAppDimensionsInfo.window = { width: 700, height: 400 }
    triggerResizeEvent(mpxProxy, sizeRef)

    const systemInfo = getSystemInfo()
    expect(systemInfo.deviceOrientation).toBe('landscape')
    expect(mpxProxy.callHook).toHaveBeenCalledWith(ONRESIZE, [systemInfo])
    expect(target.onResize).toHaveBeenCalledWith(systemInfo)
  })

  it('triggers onResize only when Screen changes in screen mode', () => {
    Mpx.config.rnConfig.dimensionsBase = 'screen'
    const { target, mpxProxy, sizeRef } = createPageResizeContext()

    global.__mpxAppDimensionsInfo.window = { width: 700, height: 400 }
    triggerResizeEvent(mpxProxy, sizeRef)

    expect(mpxProxy.callHook).not.toHaveBeenCalled()
    expect(target.onResize).not.toHaveBeenCalled()

    global.__mpxAppDimensionsInfo.screen = { width: 1400, height: 800 }
    triggerResizeEvent(mpxProxy, sizeRef)

    const systemInfo = getSystemInfo()
    expect(systemInfo.deviceOrientation).toBe('landscape')
    expect(mpxProxy.callHook).toHaveBeenCalledWith(ONRESIZE, [systemInfo])
    expect(target.onResize).toHaveBeenCalledWith(systemInfo)
  })

  it('triggers onResize when the effective dimensions base changes', () => {
    const { target, mpxProxy, sizeRef } = createPageResizeContext()

    Mpx.config.rnConfig.dimensionsBase = 'screen'
    syncDimensions(dimensions)
    triggerResizeEvent(mpxProxy, sizeRef)

    const systemInfo = getSystemInfo()
    expect(mpxProxy.callHook).toHaveBeenCalledWith(ONRESIZE, [systemInfo])
    expect(target.onResize).toHaveBeenCalledWith(systemInfo)
  })
})
