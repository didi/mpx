// Modern setup for @testing-library/react-native

// Mock react-native-reanimated first to avoid import issues
jest.doMock('react-native-reanimated', () => {
  const RN = jest.requireActual('react-native')
  const React = jest.requireActual('react')
  
  // Create proper Animated components
  const AnimatedView = React.forwardRef((props, ref) => 
    React.createElement(RN.View, { ...props, ref })
  )
  const AnimatedScrollView = React.forwardRef((props, ref) => 
    React.createElement(RN.ScrollView, { ...props, ref })
  )
  
  // Create the default export object
  const AnimatedDefault = {
    View: AnimatedView,
    ScrollView: AnimatedScrollView,
    createAnimatedComponent: jest.fn((Component) => Component),
  }
  
  return {
    default: AnimatedDefault,
    useSharedValue: jest.fn((initial) => ({ value: initial })),
    useAnimatedStyle: jest.fn((styleFactory) => styleFactory()),
    withTiming: jest.fn((toValue, config, callback) => {
      if (callback) callback()
      return toValue
    }),
    withSpring: jest.fn((toValue, config, callback) => {
      if (callback) callback()
      return toValue
    }),
    withDecay: jest.fn((config, callback) => {
      if (callback) callback()
      return 0
    }),
    makeMutable: jest.fn((initial) => ({ value: initial })),
    runOnJS: jest.fn((fn) => fn),
    runOnUI: jest.fn((fn) => fn),
    cancelAnimation: jest.fn(),
    withSequence: jest.fn(),
    withDelay: jest.fn(),
    Easing: {
      linear: 'linear',
      ease: 'ease',
      quad: 'quad',
      cubic: 'cubic',
      poly: jest.fn((exp) => `poly(${exp})`),
      sin: 'sin',
      circle: 'circle',
      exp: 'exp',
      elastic: 'elastic',
      back: 'back',
      bounce: 'bounce',
      bezier: jest.fn(() => 'bezier'),
      in: jest.fn((easing) => `in(${easing})`),
      out: jest.fn((easing) => `out(${easing})`),
      inOut: jest.fn((easing) => `inOut(${easing})`),
    },
    Animated: AnimatedDefault,
    createAnimatedComponent: jest.fn((component) => component),
    useAnimatedGestureHandler: jest.fn(),
    useAnimatedProps: jest.fn(),
    useDerivedValue: jest.fn(),
    useAnimatedReaction: jest.fn(),
    useAnimatedScrollHandler: jest.fn(),
    interpolate: jest.fn(),
    Extrapolate: { EXTEND: 'extend', CLAMP: 'clamp', IDENTITY: 'identity' },
  }
})

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



// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const React = require('react')
  const RN = jest.requireActual('react-native')
  const MockView = (props) => React.createElement('View', props, props.children)
  const MockScrollView = React.forwardRef((props, ref) => 
    React.createElement('ScrollView', { ...props, ref })
  )
  
  const createMockGesture = () => ({
    onTouchesDown: jest.fn(() => createMockGesture()),
    onTouchesUp: jest.fn(() => createMockGesture()),
    onStart: jest.fn(() => createMockGesture()),
    onUpdate: jest.fn(() => createMockGesture()),
    onEnd: jest.fn(() => createMockGesture()),
    onFinalize: jest.fn(() => createMockGesture()),
    enabled: jest.fn(() => createMockGesture()),
    shouldCancelWhenOutside: jest.fn(() => createMockGesture()),
    hitSlop: jest.fn(() => createMockGesture()),
    runOnJS: jest.fn(() => createMockGesture()),
    simultaneousWithExternalGesture: jest.fn(() => createMockGesture())
  })
  
  return {
    Swipeable: MockView,
    DrawerLayout: MockView,
    State: {},
    ScrollView: MockScrollView,
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
    Directions: {},
    GestureDetector: MockView,
    Gesture: {
      Pan: () => createMockGesture(),
      Tap: () => createMockGesture(),
      LongPress: () => createMockGesture(),
      Pinch: () => createMockGesture(),
      Rotation: () => createMockGesture(),
      Fling: () => createMockGesture()
    },
    PanGesture: createMockGesture()
  }
})

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper')

// Mock Image.getSize for background image functionality
const { Image } = require('react-native')
Image.getSize = jest.fn((uri, success, error) => {
  // Mock successful image loading with default dimensions
  setTimeout(() => success(100, 100), 0)
})

// RefreshControl is already mocked in the react-native mock above



// Mock mpxGlobal for warnings
global.mpxGlobal = {
  __mpx: {
    config: {
      ignoreWarning: false
    }
  }
}


