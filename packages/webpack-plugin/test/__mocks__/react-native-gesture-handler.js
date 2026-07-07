import React from 'react'
import { View } from 'react-native'

const GestureDetector = ({ children, gesture, ...props }) => {
  return React.createElement(View, {
    ...props,
    testID: 'gesture-detector'
  }, children)
}

// Mock ScrollView from gesture-handler (enhanced ScrollView)
const ScrollView = React.forwardRef((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    scrollTo: jest.fn(),
    measureLayout: jest.fn()
  }))
  return React.createElement('ScrollView', props)
})

// Mock RefreshControl from gesture-handler
const RefreshControl = React.forwardRef((props, ref) =>
  React.createElement('View', { ...props, ref, testID: 'refresh-control' })
)

let lastPanGesture

const createMockGesture = () => {
  const gesture = {
    activeOffsetX: jest.fn(() => gesture),
    activeOffsetY: jest.fn(() => gesture),
    failOffsetY: jest.fn(() => gesture),
    failOffsetX: jest.fn(() => gesture),
    requireExternalGestureToFail: jest.fn(() => gesture),
    withRef: jest.fn(() => gesture),
    onTouchesDown: jest.fn((callback) => {
      gesture.onTouchesDownCallback = callback
      return gesture
    }),
    onTouchesMove: jest.fn((callback) => {
      gesture.onTouchesMoveCallback = callback
      return gesture
    }),
    onTouchesUp: jest.fn((callback) => {
      gesture.onTouchesUpCallback = callback
      return gesture
    }),
    onStart: jest.fn((callback) => {
      gesture.onStartCallback = callback
      return gesture
    }),
    onFinalize: jest.fn((callback) => {
      gesture.onFinalizeCallback = callback
      return gesture
    }),
    enabled: jest.fn(() => gesture),
    shouldCancelWhenOutside: jest.fn(() => gesture),
    hitSlop: jest.fn(() => gesture),
    runOnJS: jest.fn(() => gesture),
    simultaneousWithExternalGesture: jest.fn(() => gesture),
    onBegin: jest.fn((callback) => {
      gesture.onBeginCallback = callback
      return gesture
    }),
    onUpdate: jest.fn((callback) => {
      gesture.onUpdateCallback = callback
      return gesture
    }),
    onEnd: jest.fn((callback) => {
      gesture.onEndCallback = callback
      return gesture
    })
  }
  return gesture
}

const createMockPanGesture = () => {
  lastPanGesture = createMockGesture()
  return lastPanGesture
}

const Gesture = {
  Pan: jest.fn(() => createMockPanGesture()),
  Tap: jest.fn(() => createMockGesture()),
  LongPress: jest.fn(() => createMockGesture()),
  Pinch: jest.fn(() => createMockGesture()),
  Rotation: jest.fn(() => createMockGesture()),
  Fling: jest.fn(() => createMockGesture())
}

const __getLastPanGesture = () => lastPanGesture

export {
  GestureDetector,
  Gesture,
  ScrollView,
  RefreshControl,
  __getLastPanGesture
}

// For compatibility, also export as default
export default {
  GestureDetector,
  Gesture,
  ScrollView,
  RefreshControl
}
