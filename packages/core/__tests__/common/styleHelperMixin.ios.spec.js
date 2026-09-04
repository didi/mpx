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
    config: {}
  }
}))

// eslint-disable-next-line import/first
import styleHelperMixin from '../../src/platform/builtInMixins/styleHelperMixin.ios'

describe('RN styleHelperMixin window dimensions', () => {
  beforeEach(() => {
    global.__mpxAppDimensionsInfo.window = initialWindow
    global.__mpxAppDimensionsInfo.screen = initialScreen
    global.__mpxSizeCount = 0
    global.__classCaches = []
  })

  it('converts responsive units with window dimensions', () => {
    expect(global.__formatValue('750rpx')).toBe(360)
    expect(global.__formatValue('100vw')).toBe(360)
    expect(global.__formatValue('100vh')).toBe(640)
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
})
