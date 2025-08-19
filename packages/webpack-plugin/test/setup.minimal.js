// React Native 最小化测试环境设置
// 这是业内最常用的方案：只 mock 必要的模块，让 RN 组件保持原生行为

// 静默不必要的警告
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock react-native-reanimated（几乎所有项目都需要）
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')
  
  // The mock for `call` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {}
  
  return Reanimated
})

// 只 mock 项目中实际使用的第三方库
// 不预先 mock 不存在的包

// 关键点：不 mock React Native 的核心组件（View, Text, etc.）
// 让 react-test-renderer 直接处理它们
