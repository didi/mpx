// 纯 React Native Mock，保持原始组件名称用于快照测试
import React from 'react'

// 创建自定义组件，保持 RN 组件名称
const createRNComponent = (displayName) => {
    const Component = React.forwardRef((props, ref) => {
        const { children, ...otherProps } = props
        // 使用 React.createElement 创建带有正确 displayName 的元素
        return React.createElement(displayName, { ...otherProps, ref }, children)
    })
    Component.displayName = displayName
    return Component
}

const createMeasuredRNComponent = (displayName) => {
    const Component = React.forwardRef((props, ref) => {
        const { children, ...otherProps } = props
        React.useImperativeHandle(ref, () => ({
            measure: jest.fn((callback) => callback(0, 0, 50, 50, 0, 0)),
            measureLayout: jest.fn((parent, callback) => callback(0, 0))
        }))
        return React.createElement(displayName, otherProps, children)
    })
    Component.displayName = displayName
    return Component
}

const eventListeners = {}
const createEmitter = () => ({
    addListener: jest.fn((type, listener) => {
        eventListeners[type] = eventListeners[type] || []
        eventListeners[type].push(listener)
        return {
            remove: jest.fn(() => {
                eventListeners[type] = (eventListeners[type] || []).filter((item) => item !== listener)
            })
        }
    }),
    removeListener: jest.fn((type, listener) => {
        eventListeners[type] = (eventListeners[type] || []).filter((item) => item !== listener)
    }),
    removeAllListeners: jest.fn((type) => {
        if (type) {
            delete eventListeners[type]
        } else {
            Object.keys(eventListeners).forEach((key) => delete eventListeners[key])
        }
    }),
    emit: jest.fn((type, ...args) => {
        ;(eventListeners[type] || []).forEach((listener) => listener(...args))
    })
})

// 基础组件 Mock - 保持 RN 组件名称
export const View = createRNComponent('View')
export const Text = createRNComponent('Text')
export const ScrollView = createRNComponent('ScrollView')
export const Image = createRNComponent('Image')
export const TouchableOpacity = createRNComponent('TouchableOpacity')
export const TouchableHighlight = createRNComponent('TouchableHighlight')
export const TouchableWithoutFeedback = createRNComponent('TouchableWithoutFeedback')
export const Pressable = createRNComponent('Pressable')
export const SafeAreaView = createRNComponent('SafeAreaView')
export const KeyboardAvoidingView = createRNComponent('KeyboardAvoidingView')
export const RefreshControl = createRNComponent('RefreshControl')
export const ActivityIndicator = createRNComponent('ActivityIndicator')
export const Modal = createRNComponent('Modal')
export const Switch = createRNComponent('Switch')
export const Slider = createRNComponent('Slider')
export const FlatList = createRNComponent('FlatList')
let lastSectionListRef
export const SectionList = React.forwardRef((props, ref) => {
    const instanceRef = React.useRef({
        scrollToLocation: jest.fn()
    })
    lastSectionListRef = instanceRef.current
    React.useImperativeHandle(ref, () => instanceRef.current)
    return React.createElement('SectionList', props)
})
SectionList.displayName = 'SectionList'
export const __getLastSectionListRef = () => lastSectionListRef
export const VirtualizedList = createRNComponent('VirtualizedList')

// TextInput 需要特殊处理，支持 value 和 onChangeText
export const TextInput = React.forwardRef((props, ref) => {
    const { value, onChangeText, multiline, numberOfLines, ...otherProps } = props
    return React.createElement('TextInput', {
        ...otherProps,
        ref,
        value,
        multiline,
        numberOfLines,
        onChangeText
    })
})
TextInput.displayName = 'TextInput'

// 样式系统
export const StyleSheet = {
    create: (styles) => styles,
    flatten: (style) => {
        if (Array.isArray(style)) {
            return Object.assign({}, ...style.filter(Boolean))
        }
        return style || {}
    },
    compose: (style1, style2) => [style1, style2],
    hairlineWidth: 1,
    absoluteFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0
    },
    absoluteFillObject: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0
    }
}

export const processColor = jest.fn((color) => {
    const colors = {
        black: 0xff000000,
        white: 0xffffffff,
        transparent: 0x00000000
    }
    if (typeof color !== 'string') return color
    if (colors[color]) return colors[color]
    if (/^#([0-9a-f]{6})$/i.test(color)) {
        return parseInt(color.slice(1), 16)
    }
    if (/^#([0-9a-f]{8})$/i.test(color)) {
        return parseInt(color.slice(1), 16)
    }
    return null
})

// 布局系统
export const Dimensions = {
    get: jest.fn(() => ({
        width: 375,
        height: 812,
        scale: 2,
        fontScale: 1
    })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
}

// 平台检测
export const Platform = {
    OS: 'ios',
    Version: '14.0',
    select: jest.fn((options) => options.ios || options.default),
    isPad: false,
    isTesting: true,
    constants: {}
}

// PixelRatio
export const PixelRatio = {
    get: jest.fn(() => 2),
    getFontScale: jest.fn(() => 1),
    getPixelSizeForLayoutSize: jest.fn((size) => size * 2),
    roundToNearestPixel: jest.fn((size) => Math.round(size))
}

// Appearance
export const Appearance = {
    getColorScheme: jest.fn(() => 'light'),
    addChangeListener: jest.fn(),
    removeChangeListener: jest.fn()
}

// Keyboard
export const Keyboard = {
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    isVisible: jest.fn(() => false),
    dismiss: jest.fn()
}

// DeviceInfo (if needed)
export const DeviceInfo = {
    isTablet: jest.fn(() => false)
}

// StatusBar
export const StatusBar = createRNComponent('StatusBar')
StatusBar.setBarStyle = jest.fn()
StatusBar.setBackgroundColor = jest.fn()
StatusBar.setHidden = jest.fn()

// Alert
export const Alert = {
    alert: jest.fn(),
    prompt: jest.fn()
}

// Linking
export const Linking = {
    openURL: jest.fn(),
    canOpenURL: jest.fn(() => Promise.resolve(true)),
    getInitialURL: jest.fn(() => Promise.resolve(null))
}

// AppState
export const AppState = {
    currentState: 'active',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
}

// BackHandler
export const BackHandler = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    exitApp: jest.fn()
}

// NetInfo
export const NetInfo = {
    fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
    addEventListener: jest.fn()
}

// DeviceEventEmitter
export const DeviceEventEmitter = createEmitter()

// NativeEventEmitter
export const NativeEventEmitter = jest.fn().mockImplementation(() => createEmitter())

// PanResponder
export const PanResponder = {
    create: jest.fn(() => ({
        panHandlers: {}
    }))
}

// Animated
export const Animated = {
    View: createMeasuredRNComponent('Animated.View'),
    Text: createRNComponent('Animated.Text'),
    ScrollView: createRNComponent('Animated.ScrollView'),
    Image: createRNComponent('Animated.Image'),
    FlatList: createRNComponent('Animated.FlatList'),
    SectionList: createRNComponent('Animated.SectionList'),

    Value: jest.fn(() => ({
        setValue: jest.fn(),
        setOffset: jest.fn(),
        flattenOffset: jest.fn(),
        extractOffset: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
        interpolate: jest.fn(() => ({
            addListener: jest.fn(),
            removeListener: jest.fn()
        }))
    })),

    ValueXY: jest.fn(() => ({
        setValue: jest.fn(),
        setOffset: jest.fn(),
        flattenOffset: jest.fn(),
        extractOffset: jest.fn(),
        resetAnimation: jest.fn(),
        stopAnimation: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        getLayout: jest.fn(() => ({ left: 0, top: 0 })),
        getTranslateTransform: jest.fn(() => [])
    })),

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
    delay: jest.fn(),
    loop: jest.fn(),

    event: jest.fn(),
    createAnimatedComponent: jest.fn((component) => component),
    add: jest.fn(() => ({
        interpolate: jest.fn(() => 0)
    })),
    subtract: jest.fn(() => ({
        interpolate: jest.fn(() => 0)
    })),

    Easing: {
        linear: jest.fn(),
        ease: jest.fn(),
        quad: jest.fn(),
        cubic: jest.fn(),
        poly: jest.fn(),
        sin: jest.fn(),
        circle: jest.fn(),
        exp: jest.fn(),
        elastic: jest.fn(),
        back: jest.fn(),
        bounce: jest.fn(),
        bezier: jest.fn(),
        in: jest.fn(),
        out: jest.fn(),
        inOut: jest.fn()
    }
}

// Easing 独立导出
export const Easing = Animated.Easing

// 默认导出
export default {
    View,
    Text,
    TextInput,
    ScrollView,
    Image,
    TouchableOpacity,
    TouchableHighlight,
    TouchableWithoutFeedback,
    Pressable,
    SafeAreaView,
    KeyboardAvoidingView,
    RefreshControl,
    ActivityIndicator,
    Modal,
    Switch,
    Slider,
    FlatList,
    SectionList,
    VirtualizedList,
    StyleSheet,
    Dimensions,
    Platform,
    PixelRatio,
    Appearance,
    Keyboard,
    DeviceInfo,
    StatusBar,
    Alert,
    Linking,
    AppState,
    BackHandler,
    NetInfo,
    DeviceEventEmitter,
    NativeEventEmitter,
    PanResponder,
    Animated,
    Easing
}
