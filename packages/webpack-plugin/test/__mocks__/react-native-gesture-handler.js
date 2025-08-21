import React from 'react'
import { View } from 'react-native'

const GestureDetector = ({ children, gesture, ...props }) => {
  return React.createElement(View, {
    ...props,
    testID: 'gesture-detector'
  }, children)
}

// Mock ScrollView from gesture-handler (enhanced ScrollView)
const ScrollView = React.forwardRef((props, ref) => 
  React.createElement('ScrollView', { ...props, ref })
)

// Mock RefreshControl from gesture-handler
const RefreshControl = React.forwardRef((props, ref) => 
  React.createElement('View', { ...props, ref, testID: 'refresh-control' })
)

const createMockGesture = () => ({
  onTouchesDown: jest.fn().mockReturnThis(),
  onTouchesUp: jest.fn().mockReturnThis(),
  onStart: jest.fn().mockReturnThis(),
  onUpdate: jest.fn().mockReturnThis(),
  onEnd: jest.fn().mockReturnThis(),
  onFinalize: jest.fn().mockReturnThis(),
  enabled: jest.fn().mockReturnThis(),
  shouldCancelWhenOutside: jest.fn().mockReturnThis(),
  hitSlop: jest.fn().mockReturnThis(),
  runOnJS: jest.fn().mockReturnThis(),
  simultaneousWithExternalGesture: jest.fn().mockReturnThis()
})

const Gesture = {
  Pan: jest.fn(() => createMockGesture()),
  Tap: jest.fn(() => createMockGesture()),
  LongPress: jest.fn(() => createMockGesture()),
  Pinch: jest.fn(() => createMockGesture()),
  Rotation: jest.fn(() => createMockGesture()),
  Fling: jest.fn(() => createMockGesture())
}

export {
  GestureDetector,
  Gesture,
  ScrollView,
  RefreshControl
}

// For compatibility, also export as default
export default {
  GestureDetector,
  Gesture,
  ScrollView,
  RefreshControl
}
