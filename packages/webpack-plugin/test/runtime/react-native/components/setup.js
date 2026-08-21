// Mock Easing first to avoid import issues
jest.mock('@mpxjs/perf', () => ({
  scopeStart: jest.fn(() => -1),
  scopeEnd: jest.fn()
}))

jest.doMock('react-native', () => {
  const RN = jest.requireActual('react-native')
  const React = jest.requireActual('react')

  // Mock RefreshControl
  const MockRefreshControl = React.forwardRef((props, ref) =>
    React.createElement(RN.View, { ...props, ref, testID: props.testID || 'refresh-control' })
  )

  return {
    ...RN,
    RefreshControl: MockRefreshControl,
    useAnimatedValue: jest.fn(() => ({
      interpolate: jest.fn(() => '0deg')
    })),
    Animated: Object.assign({}, RN.Animated, {
      Image: RN.Animated?.Image || RN.Image,
      timing: jest.fn(() => ({})),
      loop: jest.fn(() => ({
        start: jest.fn(),
        stop: jest.fn()
      }))
    }),
    Easing: {
      linear: jest.fn(),
      ease: jest.fn(),
      in: jest.fn(() => jest.fn()),
      out: jest.fn(() => jest.fn()),
      inOut: jest.fn(() => jest.fn()),
      poly: jest.fn(() => jest.fn()),
      bezier: jest.fn(() => jest.fn()),
      circle: jest.fn(),
      sin: jest.fn(),
      exp: jest.fn(),
      elastic: jest.fn(() => jest.fn()),
      back: jest.fn(() => jest.fn()),
      bounce: jest.fn(),
      step0: jest.fn(),
      step1: jest.fn()
    }
  }
})

// 定义全局变量
global.__mpx_mode__ = 'ios' // 设置为React Native模式
global.__DEV__ = false // 设置开发模式标志
global.__mpx_perf_framework__ = false
global.React = require('react')

// 与生产环境 styleHelperMixin.ios.js 的 formatValue 保持一致。
const { Dimensions, Image, StyleSheet } = require('react-native')
const screen = Dimensions.get('screen')
const unit = {
  rpx: (value) => value * screen.width / 750,
  vw: (value) => value * screen.width / 100,
  vh: (value) => value * screen.height / 100
}
const unitRegExp = /^\s*(-?(?:\d+(?:\.\d+)?|\.\d+))(rpx|vw|vh|px)?\s*$/
global.__formatValue = jest.fn((value, unitType) => {
  if (unitType && typeof unit[unitType] === 'function') return unit[unitType](+value)
  if (value === 'hairlineWidth') return StyleSheet.hairlineWidth
  const matched = unitRegExp.exec(value)
  if (!matched) return value
  if (!matched[2] || matched[2] === 'px') return +matched[1]
  return unit[matched[2]](+matched[1])
})

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper')

// Mock Image.getSize for background image functionality
Image.getSize = jest.fn((uri, success, error) => {
  if (uri.includes('fail')) {
    error && error()
    return
  }
  // Mock successful image loading with default dimensions
  setTimeout(() => success(100, 100), 0)
})
Image.resolveAssetSource = jest.fn((source) => source)

// Mock mpxGlobal for warnings
global.mpxGlobal = {
  __mpx: {
    config: {
      ignoreWarning: false
    }
  }
}
