// 使用 @testing-library/react-native 的测试环境设置

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

// 扩展 expect 匹配器（如果需要的话）
// import '@testing-library/jest-native/extend-expect'
