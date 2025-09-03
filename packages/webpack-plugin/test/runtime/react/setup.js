// Mock Easing first to avoid import issues
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
global.__mpx_mode__ = 'android' // 设置为React Native模式
global.__DEV__ = false // 设置开发模式标志

// Mock MPX 运行时全局函数
global.__formatValue = jest.fn((value) => {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number') {
    return value.toString()
  }
  return String(value)
})

// 手动设置@testing-library/react-native的匹配器
// 避免直接导入extend-expect导致的Flow语法问题
const { configure } = require('@testing-library/react-native')

// 配置@testing-library/react-native
configure({
  // 可以在这里添加全局配置
})

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper')

// Mock Image.getSize for background image functionality
const { Image } = require('react-native')
Image.getSize = jest.fn((uri, success, error) => {
  // Mock successful image loading with default dimensions
  setTimeout(() => success(100, 100), 0)
})

// Mock mpxGlobal for warnings
global.mpxGlobal = {
  __mpx: {
    config: {
      ignoreWarning: false
    }
  }
}
