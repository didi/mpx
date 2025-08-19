// 使用官方 React Native Mock 的测试环境设置

// Mock global variables for MPX
global.__mpx = {
  config: {
    rnConfig: {
      projectName: 'TestProject',
      openTypeHandler: {}
    }
  }
}

global.__mpxGenericsMap = {}

// 减少测试噪音
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn()
}

// Mock React Native 官方建议的一些模块
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')

// 如果需要，可以添加更多特定的 mock
// 但大部分应该由 react-native/jest/setup 处理
