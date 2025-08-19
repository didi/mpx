import 'react-native-gesture-handler/jestSetup'

// Mock React Native modules for pure RN testing
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')
  
  // The mock for `call` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {}
  
  return Reanimated
})

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is not available
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper')

// Mock global variables that might be used in components
global.__mpx = {
  config: {
    rnConfig: {
      projectName: 'TestProject',
      openTypeHandler: {}
    }
  }
}

global.__mpxGenericsMap = {}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // uncomment to ignore a specific log level
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}
