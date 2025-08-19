// React Native 环境测试设置
// 尝试使用 react-native 测试环境，不使用自定义 mock

// 静默不必要的警告
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
}

// 只 mock 第三方库，不 mock RN 核心组件
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')
  
  // The mock for `call` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {}
  
  return Reanimated
})

// Mock 其他可能需要的第三方库
jest.mock('react-native-gesture-handler', () => {
  // 返回一个基本的 mock，但不覆盖 RN 核心组件
  return {
    gestureHandlerRootHOC: jest.fn(),
    Directions: {},
    State: {},
  }
})

// 设置 React Native 环境变量
global.__DEV__ = true
global.__TEST__ = true
