// React Native 标准测试环境设置
const reactNativeJestMocks = require('react-native-jest-mocks')

// 初始化所有标准 RN mocks
reactNativeJestMocks.initAll()

// 静默 console 警告和错误（可选）
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock react-native-reanimated（如果需要）
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')
  
  // The mock for `call` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {}
  
  return Reanimated
})

// 如果使用了其他第三方库，可以在这里添加对应的 mock
// 例如：
// jest.mock('react-native-gesture-handler', () => {
//   const View = require('react-native/Libraries/Components/View/View')
//   return {
//     Swipeable: View,
//     DrawerLayout: View,
//     State: {},
//     ScrollView: View,
//     Slider: View,
//     Switch: View,
//     TextInput: View,
//     ToolbarAndroid: View,
//     ViewPagerAndroid: View,
//     DrawerLayoutAndroid: View,
//     WebView: View,
//     NativeViewGestureHandler: View,
//     TapGestureHandler: View,
//     FlingGestureHandler: View,
//     ForceTouchGestureHandler: View,
//     LongPressGestureHandler: View,
//     PanGestureHandler: View,
//     PinchGestureHandler: View,
//     RotationGestureHandler: View,
//     RawButton: View,
//     BaseButton: View,
//     RectButton: View,
//     BorderlessButton: View,
//     FlatList: View,
//     gestureHandlerRootHOC: jest.fn(),
//     Directions: {},
//   }
// })
