// Modern setup for @testing-library/react-native

// 定义全局变量
global.__mpx_mode__ = 'android' // 设置为React Native模式
global.__DEV__ = false // 设置开发模式标志

// 手动设置@testing-library/react-native的匹配器
// 避免直接导入extend-expect导致的Flow语法问题
const { configure } = require('@testing-library/react-native')

// 配置@testing-library/react-native
configure({
  // 可以在这里添加全局配置
})

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react')
  
  return {
    default: {
      View: (props) => React.createElement('View', props, props.children),
      Text: (props) => React.createElement('Text', props, props.children),
      ScrollView: (props) => React.createElement('ScrollView', props, props.children),
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
        stopAnimation: jest.fn(),
        resetAnimation: jest.fn(),
        interpolate: jest.fn(() => ({
          setValue: jest.fn(),
          addListener: jest.fn(),
          removeListener: jest.fn(),
          removeAllListeners: jest.fn(),
          stopAnimation: jest.fn(),
          resetAnimation: jest.fn(),
        })),
      })),
      timing: jest.fn(() => ({
        start: jest.fn(),
        stop: jest.fn(),
        reset: jest.fn(),
      })),
      spring: jest.fn(() => ({
        start: jest.fn(),
        stop: jest.fn(),
        reset: jest.fn(),
      })),
      decay: jest.fn(() => ({
        start: jest.fn(),
        stop: jest.fn(),
        reset: jest.fn(),
      })),
      sequence: jest.fn(),
      parallel: jest.fn(),
      stagger: jest.fn(),
      loop: jest.fn(),
      delay: jest.fn(),
      createAnimatedComponent: jest.fn((component) => component),
      Easing: {
        linear: jest.fn(),
        ease: jest.fn(),
        quad: jest.fn(),
        cubic: jest.fn(),
        poly: jest.fn((exp) => jest.fn()),
        sin: jest.fn(),
        circle: jest.fn(),
        exp: jest.fn(),
        elastic: jest.fn(),
        back: jest.fn(),
        bounce: jest.fn(),
        bezier: jest.fn(),
        in: jest.fn((easing) => easing || jest.fn()),
        out: jest.fn((easing) => easing || jest.fn()),
        inOut: jest.fn((easing) => easing || jest.fn()),
      },
      call: () => {},
    },
    Easing: {
      linear: jest.fn(),
      ease: jest.fn(),
      quad: jest.fn(),
      cubic: jest.fn(),
      poly: jest.fn((exp) => jest.fn()),
      in: jest.fn((easing) => easing || jest.fn()),
      out: jest.fn((easing) => easing || jest.fn()),
      inOut: jest.fn((easing) => easing || jest.fn()),
    },
    runOnJS: jest.fn((fn) => fn),
    useSharedValue: jest.fn((initial) => ({ value: initial })),
    useAnimatedStyle: jest.fn((styleFactory) => styleFactory()),
    useAnimatedGestureHandler: jest.fn(),
    useAnimatedProps: jest.fn(),
    useDerivedValue: jest.fn(),
    useAnimatedReaction: jest.fn(),
    useAnimatedScrollHandler: jest.fn(),
    interpolate: jest.fn(),
    Extrapolate: { EXTEND: 'extend', CLAMP: 'clamp', IDENTITY: 'identity' },
  }
})

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const React = require('react')
  const MockView = (props) => React.createElement('View', props, props.children)
  
  return {
    Swipeable: MockView,
    DrawerLayout: MockView,
    State: {},
    ScrollView: MockView,
    Slider: MockView,
    Switch: MockView,
    TextInput: MockView,
    ToolbarAndroid: MockView,
    ViewPagerAndroid: MockView,
    DrawerLayoutAndroid: MockView,
    WebView: MockView,
    NativeViewGestureHandler: MockView,
    TapGestureHandler: MockView,
    FlingGestureHandler: MockView,
    ForceTouchGestureHandler: MockView,
    LongPressGestureHandler: MockView,
    PanGestureHandler: MockView,
    PinchGestureHandler: MockView,
    RotationGestureHandler: MockView,
    /* Buttons */
    RawButton: MockView,
    BaseButton: MockView,
    RectButton: MockView,
    BorderlessButton: MockView,
    /* Other */
    FlatList: MockView,
    gestureHandlerRootHOC: jest.fn((component) => component),
    Directions: {}
  }
})

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper')
