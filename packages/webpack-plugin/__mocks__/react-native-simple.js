// 简化的 React Native Mock，专门用于纯 RN 环境测试
import React from 'react'

// 基础组件 Mock
export const View = React.forwardRef((props, ref) => {
  const { children, ...otherProps } = props
  return React.createElement('div', { ...otherProps, ref }, children)
})

export const Text = React.forwardRef((props, ref) => {
  const { children, ...otherProps } = props
  return React.createElement('span', { ...otherProps, ref }, children)
})

export const TextInput = React.forwardRef((props, ref) => {
  const { value, onChangeText, ...otherProps } = props
  return React.createElement('input', {
    ...otherProps,
    ref,
    value,
    onChange: (e) => onChangeText && onChangeText(e.target.value)
  })
})

export const TouchableOpacity = React.forwardRef((props, ref) => {
  const { children, onPress, ...otherProps } = props
  return React.createElement('div', {
    ...otherProps,
    ref,
    onClick: onPress,
    role: 'button'
  }, children)
})

export const ScrollView = React.forwardRef((props, ref) => {
  const { children, ...otherProps } = props
  return React.createElement('div', { ...otherProps, ref }, children)
})

export const Image = React.forwardRef((props, ref) => {
  const { source, ...otherProps } = props
  return React.createElement('img', {
    ...otherProps,
    ref,
    src: typeof source === 'object' ? source.uri : source
  })
})

// 样式系统
export const StyleSheet = {
  create: (styles) => styles,
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  absoluteFillObject: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  }
}

// 平台信息
export const Platform = {
  OS: 'ios', // 可以根据需要改为 'android'
  Version: '15.0',
  select: (specifics) => {
    return specifics[Platform.OS] || specifics.default
  }
}

// 尺寸信息
export const Dimensions = {
  get: (dimension) => {
    const mockDimensions = {
      window: { width: 375, height: 667, scale: 2, fontScale: 1 },
      screen: { width: 375, height: 667, scale: 2, fontScale: 1 }
    }
    return mockDimensions[dimension] || mockDimensions.window
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}

// 状态栏
export const StatusBar = {
  setBarStyle: jest.fn(),
  setBackgroundColor: jest.fn(),
  setTranslucent: jest.fn(),
  setHidden: jest.fn()
}

// 键盘
export const Keyboard = {
  addListener: jest.fn(),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
  dismiss: jest.fn()
}

// Easing 函数
export const Easing = {
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
  in: jest.fn((easing) => easing || jest.fn()),
  out: jest.fn((easing) => easing || jest.fn()),
  inOut: jest.fn((easing) => easing || jest.fn())
}

// 动画
export const Animated = {
  View: View,
  Text: Text,
  ScrollView: ScrollView,
  Value: class {
    constructor(value) {
      this._value = value
    }
    setValue(value) {
      this._value = value
    }
    addListener(callback) {
      return 'mockListenerId'
    }
    removeListener(id) {}
    removeAllListeners() {}
  },
  timing: jest.fn(() => ({
    start: jest.fn()
  })),
  spring: jest.fn(() => ({
    start: jest.fn()
  })),
  decay: jest.fn(() => ({
    start: jest.fn()
  })),
  sequence: jest.fn(),
  parallel: jest.fn(),
  stagger: jest.fn(),
  loop: jest.fn()
}

// Alert
export const Alert = {
  alert: jest.fn()
}

export const DeviceEventEmitter = {
  addListener: jest.fn(),
  removeListener: jest.fn(),
  emit: jest.fn()
}

export class NativeEventEmitter {
  constructor() {
    this.addListener = jest.fn()
    this.removeListener = jest.fn()
    this.emit = jest.fn()
  }
  
  addListener = jest.fn()
  removeListener = jest.fn()
  emit = jest.fn()
}

export const AppRegistry = {
  registerComponent: jest.fn(),
  runApplication: jest.fn()
}

export const Linking = {
  openURL: jest.fn(),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  getInitialURL: jest.fn(() => Promise.resolve(null))
}

export const BackHandler = {
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
  exitApp: jest.fn()
}

// AppState
export const AppState = {
  currentState: 'active',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}

// 默认导出
export default {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Platform,
  Dimensions,
  StatusBar,
  Keyboard,
  Animated,
  Alert,
  AppState,
  Linking
}
