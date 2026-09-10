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
        styleDimensionsBase: 'window'
      }
    }
  }
}))

// eslint-disable-next-line import/first
import Mpx from '../../src/index'
// eslint-disable-next-line import/first
import styleHelperMixin from '../../src/platform/builtInMixins/styleHelperMixin.ios'

describe('RN styleHelperMixin dimensions', () => {
  beforeEach(() => {
    global.__mpx_perf_framework__ = false
    global.__mpxAppDimensionsInfo.window = mockDimensions.window
    global.__mpxAppDimensionsInfo.screen = mockDimensions.screen
    global.__mpxSizeCount = 0
    global.__classCaches = new Set()
    Mpx.config.rnConfig = {
      styleDimensionsBase: 'window'
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
      screen: mockDimensions.screen
    }

    global.notifyDimensionsChange(dimensions)

    expect(dimensions.window.width).toBe(800)
    expect(global.__mpxAppDimensionsInfo.window.width).toBe(400)
    expect(global.__formatValue('750rpx')).toBe(400)
    expect(customDimensions).toHaveBeenCalledTimes(1)
  })

  it('converts responsive units with window dimensions', () => {
    Mpx.config.rnConfig = {}

    expect(global.__formatValue('750rpx')).toBe(360)
    expect(global.__formatValue('100vw')).toBe(360)
    expect(global.__formatValue('100vh')).toBe(640)
  })

  it('converts responsive units with screen dimensions when configured', () => {
    Mpx.config.rnConfig.styleDimensionsBase = 'screen'

    expect(global.__formatValue('750rpx')).toBe(720)
    expect(global.__formatValue('100vw')).toBe(720)
    expect(global.__formatValue('100vh')).toBe(1280)
  })

  it('tracks dimensions dependency for dynamic responsive unit styles', () => {
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

  it('updates responsive styles when window dimensions change', () => {
    const cache = { clear: jest.fn() }
    global.__classCaches.add(cache)

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
    Mpx.config.rnConfig.styleDimensionsBase = 'screen'
    const cache = { clear: jest.fn() }
    global.__classCaches.add(cache)

    global.notifyDimensionsChange({
      window: { width: 400, height: 700 },
      screen: mockDimensions.screen
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
      __getSizeCount: jest.fn()
    }

    const result = styleHelperMixin().methods.__getStyle.call(context, 'responsive')

    expect(result.color).toBe('red')
    expect(result.opacity).toBeUndefined()
    expect(context.__getSizeCount).toHaveBeenCalledTimes(1)
  })

  it('matches media queries with screen width when configured', () => {
    Mpx.config.rnConfig.styleDimensionsBase = 'screen'
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
      __getSizeCount: jest.fn()
    }

    const result = styleHelperMixin().methods.__getStyle.call(context, 'responsive')

    expect(result.color).toBe('green')
    expect(context.__getSizeCount).toHaveBeenCalledTimes(1)
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
})
