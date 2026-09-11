const initialWindow = { width: 360, height: 640 }
const initialScreen = { width: 720, height: 1280 }
let dimensionsChangeHandler

jest.mock('react-native', () => ({
  StyleSheet: {
    hairlineWidth: 0.5
  },
  Dimensions: {
    get: jest.fn(type => type === 'window' ? initialWindow : initialScreen),
    addEventListener: jest.fn((event, handler) => {
      dimensionsChangeHandler = handler
    })
  }
}), { virtual: true })

jest.mock('@mpxjs/utils', () => ({
  isObject: value => value !== null && typeof value === 'object',
  isArray: Array.isArray,
  dash2hump: value => value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()),
  cached: fn => fn,
  isEmptyObject: value => Object.keys(value).length === 0,
  hasOwn: (value, key) => Object.prototype.hasOwnProperty.call(value, key),
  getFocusedNavigation: jest.fn()
}))

jest.mock('../../src/observer/reactive', () => ({
  reactive: value => value
}))

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

// eslint-disable-next-line import/first
import Mpx from '../../src/index'
// eslint-disable-next-line import/first
import styleHelperMixin from '../../src/platform/builtInMixins/styleHelperMixin.ios'
// eslint-disable-next-line import/first
import { initDimensionsInfo } from '../../src/platform/dimensionsHelper'

describe('RN styleHelperMixin window dimensions', () => {
  beforeEach(() => {
    initDimensionsInfo({
      window: initialWindow,
      screen: initialScreen
    })
    global.__mpxSizeCount = 0
    global.__classCaches = []
    Mpx.config.rnConfig = {
      dimensionsBase: 'window'
    }
  })

  it('does not apply customDimensions twice when notified before the first style calculation', () => {
    const customDimensions = jest.fn((dimensions) => {
      dimensions.window.width /= 2
      return dimensions
    })
    Mpx.config.rnConfig.customDimensions = customDimensions
    const dimensions = {
      window: { width: 800, height: 640 },
      screen: initialScreen
    }

    global.notifyDimensionsChange(dimensions)

    expect(dimensions.window.width).toBe(800)
    expect(global.__mpxAppDimensionsInfo.window.width).toBe(400)
    expect(global.__formatValue('750rpx')).toBe(400)
    expect(customDimensions).toHaveBeenCalledTimes(1)
  })

  it('converts responsive units with window dimensions', () => {
    expect(global.__formatValue('750rpx')).toBe(360)
    expect(global.__formatValue('100vw')).toBe(360)
    expect(global.__formatValue('100vh')).toBe(640)
  })

  it('does not expose the mutable dimensions cache through the global getter', () => {
    const dimensions = global.getStyleDimensions()

    dimensions.width = 1

    expect(global.__formatValue('750rpx')).toBe(360)
  })

  it('converts responsive units with screen dimensions when configured', () => {
    Mpx.config.rnConfig.dimensionsBase = 'screen'

    expect(global.__formatValue('750rpx')).toBe(720)
    expect(global.__formatValue('100vw')).toBe(720)
    expect(global.__formatValue('100vh')).toBe(1280)
  })

  it('tracks window dependency for dynamic responsive unit styles', () => {
    const context = {
      __pageId: 'page',
      __mpxProxy: { props: {} },
      __getSizeCount: jest.fn()
    }

    const result = styleHelperMixin().methods.__getStyle.call(context, '', '', '', {
      width: '750rpx'
    })

    expect(result.width).toBe(360)
    expect(context.__getSizeCount).toHaveBeenCalledTimes(1)
  })

  it('does not track window dependency for fixed pixel styles', () => {
    const context = {
      __pageId: 'page',
      __mpxProxy: { props: {} },
      __getSizeCount: jest.fn()
    }

    const result = styleHelperMixin().methods.__getStyle.call(context, '', '', '', {
      width: '240px'
    })

    expect(result.width).toBe(240)
    expect(context.__getSizeCount).not.toHaveBeenCalled()
  })

  it('updates responsive styles when only window dimensions change', () => {
    const cache = { clear: jest.fn() }
    global.__classCaches.push(cache)

    dimensionsChangeHandler({
      window: { width: 400, height: 700 },
      screen: initialScreen
    })

    expect(cache.clear).toHaveBeenCalledTimes(1)
    expect(global.__mpxSizeCount).toBe(1)
    expect(global.__formatValue('750rpx')).toBe(400)

    dimensionsChangeHandler({
      window: { width: 400, height: 700 },
      screen: { width: 800, height: 1400 }
    })

    expect(cache.clear).toHaveBeenCalledTimes(1)
    expect(global.__mpxSizeCount).toBe(1)
  })

  it('updates responsive styles only when screen dimensions change in screen mode', () => {
    Mpx.config.rnConfig.dimensionsBase = 'screen'
    const cache = { clear: jest.fn() }
    global.__classCaches.push(cache)

    global.notifyDimensionsChange({
      window: { width: 400, height: 700 },
      screen: initialScreen
    })

    expect(cache.clear).not.toHaveBeenCalled()
    expect(global.__mpxSizeCount).toBe(0)

    global.notifyDimensionsChange({
      window: { width: 400, height: 700 },
      screen: { width: 800, height: 1400 }
    })

    expect(cache.clear).toHaveBeenCalledTimes(1)
    expect(global.__mpxSizeCount).toBe(1)
    expect(global.__formatValue('750rpx')).toBe(800)
  })

  it('reads current Dimensions and reapplies customDimensions when notified without arguments', () => {
    let widthOffset = 10
    const customDimensions = jest.fn((dimensions) => {
      dimensions.window.width -= widthOffset
      return dimensions
    })
    Mpx.config.rnConfig.customDimensions = customDimensions

    global.notifyDimensionsChange()

    expect(global.__mpxAppDimensionsInfo.window.width).toBe(350)

    widthOffset = 20
    global.notifyDimensionsChange()

    expect(global.__mpxAppDimensionsInfo.window.width).toBe(340)
    expect(customDimensions).toHaveBeenCalledTimes(2)
  })

  it('tracks media queries as a window dependency', () => {
    const style = {
      _default: { color: 'red' },
      _media: [{
        options: { minWidth: 500 },
        value: { color: 'green' }
      }]
    }
    const context = {
      __pageId: 'page',
      __mpxProxy: { props: {} },
      __getClassStyle: jest.fn(() => style),
      __getSizeCount: jest.fn()
    }

    const result = styleHelperMixin().methods.__getStyle.call(context, 'responsive')

    expect(result.color).toBe('red')
    expect(context.__getSizeCount).toHaveBeenCalledTimes(1)
  })

  it('matches media queries with screen width when configured', () => {
    Mpx.config.rnConfig.dimensionsBase = 'screen'
    const style = {
      _default: { color: 'red' },
      _media: [{
        options: { minWidth: 600 },
        value: { color: 'green' }
      }]
    }
    const context = {
      __pageId: 'page',
      __mpxProxy: { props: {} },
      __getClassStyle: jest.fn(() => style),
      __getSizeCount: jest.fn()
    }

    const result = styleHelperMixin().methods.__getStyle.call(context, 'responsive')

    expect(result.color).toBe('green')
    expect(context.__getSizeCount).toHaveBeenCalledTimes(1)
  })

  it('matches min/max media queries only within the inclusive range', () => {
    const style = {
      _default: { color: 'red' },
      _media: [{
        options: { minWidth: 600, maxWidth: 900 },
        value: { color: 'green' }
      }]
    }
    const context = {
      __pageId: 'page',
      __mpxProxy: { props: {} },
      __getClassStyle: jest.fn(() => style),
      __getSizeCount: jest.fn()
    }
    const getColorAtWidth = width => {
      global.__mpxAppDimensionsInfo.window = { width, height: 640 }
      return styleHelperMixin().methods.__getStyle.call(context, 'responsive').color
    }

    expect(getColorAtWidth(599)).toBe('red')
    expect(getColorAtWidth(600)).toBe('green')
    expect(getColorAtWidth(750)).toBe('green')
    expect(getColorAtWidth(900)).toBe('green')
    expect(getColorAtWidth(901)).toBe('red')
  })

  it('applies customDimensions before the first media-only style calculation', () => {
    const originalGlobals = {
      notifyDimensionsChange: global.notifyDimensionsChange,
      getStyleDimensions: global.getStyleDimensions,
      GCC: global.__GCC,
      formatValue: global.__formatValue,
      dimensionsInfo: global.__mpxAppDimensionsInfo,
      sizeCount: global.__mpxSizeCount,
      pageSizeCountMap: global.__mpxPageSizeCountMap,
      classCaches: global.__classCaches,
      dimensionsChangeHandler
    }

    try {
      jest.isolateModules(() => {
        const FreshMpx = require('../../src/index').default
        const freshStyleHelperMixin = require('../../src/platform/builtInMixins/styleHelperMixin.ios').default
        const customDimensions = jest.fn((dimensions) => {
          dimensions.window.width /= 2
          return dimensions
        })
        FreshMpx.config.rnConfig = {
          dimensionsBase: 'window',
          customDimensions
        }
        const style = {
          _default: { color: 'red' },
          _media: [{
            options: { minWidth: 300 },
            value: { color: 'green' }
          }]
        }
        const context = {
          __pageId: 'page',
          __mpxProxy: { props: {} },
          __getClassStyle: jest.fn(() => style),
          __getSizeCount: jest.fn()
        }

        const result = freshStyleHelperMixin().methods.__getStyle.call(context, 'responsive')

        expect(result.color).toBe('red')
        expect(global.__mpxAppDimensionsInfo.window.width).toBe(180)
        expect(customDimensions).toHaveBeenCalledTimes(1)
        expect(context.__getSizeCount).toHaveBeenCalledTimes(1)
      })
    } finally {
      global.notifyDimensionsChange = originalGlobals.notifyDimensionsChange
      global.getStyleDimensions = originalGlobals.getStyleDimensions
      global.__GCC = originalGlobals.GCC
      global.__formatValue = originalGlobals.formatValue
      global.__mpxAppDimensionsInfo = originalGlobals.dimensionsInfo
      global.__mpxSizeCount = originalGlobals.sizeCount
      global.__mpxPageSizeCountMap = originalGlobals.pageSizeCountMap
      global.__classCaches = originalGlobals.classCaches
      dimensionsChangeHandler = originalGlobals.dimensionsChangeHandler
    }
  })
})
