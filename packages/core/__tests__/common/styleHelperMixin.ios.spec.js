const mockDimensions = {
  window: { width: 360, height: 640 },
  screen: { width: 720, height: 1280 }
}
let mockDimensionsChangeHandler

jest.mock('react-native', () => ({
  StyleSheet: {
    hairlineWidth: 0.5
  },
  Dimensions: {
    get: jest.fn(type => type === 'window'
      ? { width: 360, height: 640 }
      : { width: 720, height: 1280 }),
    addEventListener: jest.fn((event, handler) => {
      mockDimensionsChangeHandler = handler
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

jest.mock('@mpxjs/perf', () => ({
  scopeStart: jest.fn(),
  scopeEnd: jest.fn()
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

let Mpx
let styleHelperMixin

describe('RN styleHelperMixin dimensions', () => {
  beforeEach(() => {
    jest.resetModules()
    Mpx = require('../../src/index').default
    styleHelperMixin = require('../../src/platform/builtInMixins/styleHelperMixin.ios').default
    global.__mpx_perf_framework__ = false
    global.__mpxSizeCount = 0
    global.__classCaches = new Set()
    global.__externalClasses = ['custom-class', 'i-class']
    Mpx.config.rnConfig = {
      dimensionsBase: 'window'
    }
  })

  it('converts responsive units with window dimensions', () => {
    Mpx.config.rnConfig = {}

    expect(global.__formatValue('750rpx')).toBe(360)
    expect(global.__formatValue('100vw')).toBe(360)
    expect(global.__formatValue('100vh')).toBe(640)
  })

  it('does not expose the mutable dimensions cache through the global getter', () => {
    const dimensions = global.getDimensionsInfo()

    dimensions.width = 1

    expect(global.__formatValue('750rpx')).toBe(360)
  })

  it('converts responsive units with screen dimensions when configured', () => {
    Mpx.config.rnConfig.dimensionsBase = 'screen'

    expect(global.__formatValue('750rpx')).toBe(720)
    expect(global.__formatValue('100vw')).toBe(720)
    expect(global.__formatValue('100vh')).toBe(1280)
  })

  it('tracks dimensions dependency for dynamic responsive unit styles', () => {
    const context = {
      __pageId: 'page',
      __mpxProxy: { props: {} },
      __trackPageSizeCount: jest.fn()
    }

    const result = styleHelperMixin().methods.__getStyle.call(context, '', '', '', {
      width: '750rpx'
    })

    expect(result.width).toBe(360)
    expect(context.__trackPageSizeCount).toHaveBeenCalledTimes(1)
  })

  it('reads external class styles from raw props and tracks the internal version', () => {
    let versionReads = 0
    const externalClassesVersion = {}
    Object.defineProperty(externalClassesVersion, 'value', {
      get () {
        versionReads++
        return 0
      }
    })
    const methods = styleHelperMixin().methods
    const context = {
      __props: {
        'custom-class': { color: 'red' }
      },
      __mpxProxy: {
        externalClassesVersion
      },
      __trackExternalClassesVersion: methods.__trackExternalClassesVersion,
      __trackPageSizeCount: jest.fn()
    }

    const result = methods.__getStyle.call(context, 'custom-class')

    expect(result.color).toBe('red')
    expect(versionReads).toBe(1)
  })

  it('tracks the internal version before an external class style is provided', () => {
    let versionReads = 0
    const externalClassesVersion = {}
    Object.defineProperty(externalClassesVersion, 'value', {
      get () {
        versionReads++
        return 0
      }
    })
    const methods = styleHelperMixin().methods
    const context = {
      __props: {},
      __mpxProxy: {
        externalClassesVersion
      },
      __trackExternalClassesVersion: methods.__trackExternalClassesVersion,
      __trackPageSizeCount: jest.fn()
    }

    const result = methods.__getStyle.call(context, 'custom-class')

    expect(result).toEqual({})
    expect(versionReads).toBe(1)
  })

  it('removes the dimensions dependency marker from merged class styles', () => {
    const classMap = {
      responsive: formatValue => ({ width: formatValue('750rpx') })
    }
    const classMapValueCache = new Map()
    const cachedStyle = global.__GCC('responsive', classMap, classMapValueCache)
    const context = {
      __getClassStyle: className => global.__GCC(className, classMap, classMapValueCache),
      __trackPageSizeCount: jest.fn()
    }

    expect(cachedStyle._dependentWindowSize).toBe(true)
    expect(Object.keys(cachedStyle)).toContain('_dependentWindowSize')

    const result = styleHelperMixin().methods.__getStyle.call(context, 'responsive')

    expect(result).toEqual({ width: 360 })
    expect(context.__trackPageSizeCount).toHaveBeenCalledTimes(1)
  })

  it('stops tracking dimensions after responsive styles switch to fixed values', () => {
    const context = {
      __pageId: 'page',
      __mpxProxy: { props: {} },
      __trackPageSizeCount: jest.fn()
    }

    styleHelperMixin().methods.__getStyle.call(context, '', '', '', {
      width: '750rpx'
    })
    context.__trackPageSizeCount.mockClear()

    const result = styleHelperMixin().methods.__getStyle.call(context, '', '', '', {
      width: '240px'
    })

    expect(result.width).toBe(240)
    expect(context.__trackPageSizeCount).not.toHaveBeenCalled()
  })

  it('updates responsive styles when window dimensions change', () => {
    const cache = { clear: jest.fn() }
    global.__classCaches.add(cache)
    global.getDimensionsInfo()

    mockDimensionsChangeHandler({
      window: { width: 400, height: 700 },
      screen: mockDimensions.screen
    })

    expect(cache.clear).toHaveBeenCalledTimes(1)
    expect(global.__mpxSizeCount).toBe(1)
    expect(global.__formatValue('750rpx')).toBe(400)

    mockDimensionsChangeHandler({
      window: { width: 400, height: 700 },
      screen: { width: 800, height: 1400 }
    })

    expect(cache.clear).toHaveBeenCalledTimes(1)
    expect(global.__mpxSizeCount).toBe(1)
  })

  it('updates responsive styles only when screen dimensions change in screen mode', () => {
    Mpx.config.rnConfig.dimensionsBase = 'screen'
    const cache = { clear: jest.fn() }
    global.__classCaches.add(cache)

    mockDimensionsChangeHandler({
      window: { width: 400, height: 700 },
      screen: mockDimensions.screen
    })

    expect(cache.clear).not.toHaveBeenCalled()
    expect(global.__mpxSizeCount).toBe(0)

    mockDimensionsChangeHandler({
      window: { width: 400, height: 700 },
      screen: { width: 800, height: 1400 }
    })

    expect(cache.clear).toHaveBeenCalledTimes(1)
    expect(global.__mpxSizeCount).toBe(1)
    expect(global.__formatValue('750rpx')).toBe(800)
  })

  it('keeps the initial dimensionsBase after config and Screen dimensions change', () => {
    const classMap = {
      box: formatValue => ({ width: formatValue('750rpx') })
    }
    const classMapValueCache = new Map()
    global.__classCaches.add(classMapValueCache)

    expect(global.__GCC('box', classMap, classMapValueCache).width).toBe(360)

    Mpx.config.rnConfig.dimensionsBase = 'screen'

    expect(global.getDimensionsInfo().width).toBe(360)
    expect(global.__GCC('box', classMap, classMapValueCache).width).toBe(360)
    expect(global.__mpxSizeCount).toBe(0)

    mockDimensionsChangeHandler({
      window: mockDimensions.window,
      screen: { width: 800, height: 1400 }
    })

    expect(global.getDimensionsInfo().width).toBe(360)
    expect(global.__GCC('box', classMap, classMapValueCache).width).toBe(360)
    expect(global.__mpxSizeCount).toBe(0)
  })

  it('matches media queries with window width', () => {
    const style = {
      color: 'red',
      _media: [{
        options: { minWidth: 500 },
        value: { opacity: 1 }
      }]
    }
    const context = {
      __pageId: 'page',
      __mpxProxy: { props: {} },
      __getClassStyle: jest.fn(() => style),
      __trackPageSizeCount: jest.fn()
    }

    const result = styleHelperMixin().methods.__getStyle.call(context, 'responsive')

    expect(result.color).toBe('red')
    expect(result.opacity).toBeUndefined()
    expect(context.__trackPageSizeCount).toHaveBeenCalledTimes(1)
  })

  it('matches media queries with screen width when configured', () => {
    Mpx.config.rnConfig.dimensionsBase = 'screen'
    const style = {
      color: 'red',
      _media: [{
        options: { minWidth: 600 },
        value: { color: 'green' }
      }]
    }
    const context = {
      __pageId: 'page',
      __mpxProxy: { props: {} },
      __getClassStyle: jest.fn(() => style),
      __trackPageSizeCount: jest.fn()
    }

    const result = styleHelperMixin().methods.__getStyle.call(context, 'responsive')

    expect(result.color).toBe('green')
    expect(context.__trackPageSizeCount).toHaveBeenCalledTimes(1)
  })

  it('matches min/max media queries only within the inclusive range', () => {
    const style = {
      color: 'red',
      _media: [{
        options: { minWidth: 600, maxWidth: 900 },
        value: { color: 'green' }
      }]
    }
    const context = {
      __pageId: 'page',
      __mpxProxy: { props: {} },
      __getClassStyle: jest.fn(() => style),
      __trackPageSizeCount: jest.fn()
    }
    const getColorAtWidth = width => {
      mockDimensionsChangeHandler({
        window: { width, height: 640 },
        screen: mockDimensions.screen
      })
      return styleHelperMixin().methods.__getStyle.call(context, 'responsive').color
    }

    expect(getColorAtWidth(599)).toBe('red')
    expect(getColorAtWidth(600)).toBe('green')
    expect(getColorAtWidth(750)).toBe('green')
    expect(getColorAtWidth(900)).toBe('green')
    expect(getColorAtWidth(901)).toBe('red')
  })

  it('applies important declarations from all matching media queries', () => {
    const style = {
      width: 100,
      height: 50,
      _media: [{
        options: { minWidth: 300 },
        value: {
          _inlineLayer: {
            important: { width: 200 }
          }
        }
      }, {
        options: { maxWidth: 500 },
        value: {
          _inlineLayer: {
            important: { height: 120 }
          }
        }
      }]
    }
    const context = {
      __pageId: 'page',
      __mpxProxy: { props: {} },
      __getClassStyle: jest.fn(() => style),
      __trackPageSizeCount: jest.fn()
    }

    const result = styleHelperMixin().methods.__getStyle.call(context, 'responsive')

    expect(result.width).toBe(200)
    expect(result.height).toBe(120)
  })

  it('applies customDimensions before the first media-only style calculation', () => {
    const originalGlobals = {
      getDimensionsInfo: global.getDimensionsInfo,
      GCC: global.__GCC,
      formatValue: global.__formatValue,
      sizeCount: global.__mpxSizeCount,
      pageSizeCountMap: global.__mpxPageSizeCountMap,
      classCaches: global.__classCaches,
      dimensionsChangeHandler: mockDimensionsChangeHandler
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
          color: 'red',
          _media: [{
            options: { minWidth: 300 },
            value: { color: 'green' }
          }]
        }
        const context = {
          __pageId: 'page',
          __mpxProxy: { props: {} },
          __getClassStyle: jest.fn(() => style),
          __trackPageSizeCount: jest.fn()
        }

        const result = freshStyleHelperMixin().methods.__getStyle.call(context, 'responsive')

        expect(result.color).toBe('red')
        expect(global.getDimensionsInfo().width).toBe(180)
        expect(customDimensions).toHaveBeenCalledTimes(1)
        expect(context.__trackPageSizeCount).toHaveBeenCalledTimes(1)
      })
    } finally {
      global.getDimensionsInfo = originalGlobals.getDimensionsInfo
      global.__GCC = originalGlobals.GCC
      global.__formatValue = originalGlobals.formatValue
      global.__mpxSizeCount = originalGlobals.sizeCount
      global.__mpxPageSizeCountMap = originalGlobals.pageSizeCountMap
      global.__classCaches = originalGlobals.classCaches
      mockDimensionsChangeHandler = originalGlobals.dimensionsChangeHandler
    }
  })
})
