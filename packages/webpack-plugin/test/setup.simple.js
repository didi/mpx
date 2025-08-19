// 简化的测试环境设置，专用于 react-test-renderer

// Mock global variables
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
  warn: jest.fn(),
  error: jest.fn()
}

// Basic setup without complex mocks

// Mock react-native-reanimated with simple implementation  
jest.mock('react-native-reanimated', () => {
  const mockEasing = {
    linear: jest.fn(),
    ease: jest.fn(),
    quad: jest.fn(),
    cubic: jest.fn(),
    poly: jest.fn(() => jest.fn()),
    sin: jest.fn(),
    circle: jest.fn(),
    exp: jest.fn(),
    elastic: jest.fn(),
    back: jest.fn(),
    bounce: jest.fn(),
    bezier: jest.fn(),
    in: jest.fn((fn) => fn || jest.fn()),
    out: jest.fn((fn) => fn || jest.fn()),
    inOut: jest.fn((fn) => fn || jest.fn())
  }
  
  return {
    default: {
      View: 'View',
      createAnimatedComponent: (Component) => Component,
      call: () => {},
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
      })),
      timing: jest.fn(() => ({
        start: jest.fn(),
      })),
      spring: jest.fn(() => ({
        start: jest.fn(),
      })),
      sequence: jest.fn(),
      parallel: jest.fn(),
      decay: jest.fn(),
      delay: jest.fn(),
      loop: jest.fn(),
      Clock: jest.fn(),
      Node: jest.fn(),
      add: jest.fn(),
      sub: jest.fn(),
      multiply: jest.fn(),
      divide: jest.fn(),
      pow: jest.fn(),
      modulo: jest.fn(),
      sqrt: jest.fn(),
      log: jest.fn(),
      sin: jest.fn(),
      cos: jest.fn(),
      tan: jest.fn(),
      acos: jest.fn(),
      asin: jest.fn(),
      atan: jest.fn(),
      exp: jest.fn(),
      round: jest.fn(),
      floor: jest.fn(),
      ceil: jest.fn(),
      lessThan: jest.fn(),
      eq: jest.fn(),
      greaterThan: jest.fn(),
      lessOrEq: jest.fn(),
      greaterOrEq: jest.fn(),
      neq: jest.fn(),
      and: jest.fn(),
      or: jest.fn(),
      defined: jest.fn(),
      not: jest.fn(),
      set: jest.fn(),
      concat: jest.fn(),
      cond: jest.fn(),
      block: jest.fn(),
      call: jest.fn(),
      debug: jest.fn(),
      onChange: jest.fn(),
      startClock: jest.fn(),
      stopClock: jest.fn(),
      clockRunning: jest.fn(),
      event: jest.fn(),
      abs: jest.fn(),
      acc: jest.fn(),
      color: jest.fn(),
      diff: jest.fn(),
      diffClamp: jest.fn(),
      interpolateColors: jest.fn(),
      max: jest.fn(),
      min: jest.fn(),
      interpolateNode: jest.fn(),
      Extrapolate: { EXTEND: 'extend', CLAMP: 'clamp', IDENTITY: 'identity' },
    },
    // 重要：导出 Easing 用于直接导入
    Easing: mockEasing,
    useSharedValue: jest.fn(() => ({ value: 0 })),
    withTiming: jest.fn(),
    useAnimatedStyle: jest.fn(() => ({})),
    withSequence: jest.fn(),
    withDelay: jest.fn(),
    makeMutable: jest.fn(),
    cancelAnimation: jest.fn(),
    runOnJS: jest.fn()
  }
})

// Mock react-native-gesture-handler with simple strings
jest.mock('react-native-gesture-handler', () => {
  return {
    Swipeable: 'View',
    DrawerLayout: 'View',
    State: {},
    ScrollView: 'View',
    Slider: 'View',
    Switch: 'View',
    TextInput: 'View',
    ToolbarAndroid: 'View',
    ViewPagerAndroid: 'View',
    DrawerLayoutAndroid: 'View',
    WebView: 'View',
    NativeViewGestureHandler: 'View',
    TapGestureHandler: 'View',
    FlingGestureHandler: 'View',
    ForceTouchGestureHandler: 'View',
    LongPressGestureHandler: 'View',
    PanGestureHandler: 'View',
    PinchGestureHandler: 'View',
    RotationGestureHandler: 'View',
    RawButton: 'View',
    BaseButton: 'View',
    RectButton: 'View',
    BorderlessButton: 'View',
    FlatList: 'View',
    gestureHandlerRootHOC: jest.fn(),
    Directions: {}
  }
})
