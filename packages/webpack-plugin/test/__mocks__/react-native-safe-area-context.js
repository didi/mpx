// Mock for react-native-safe-area-context
const React = require('react')

const mockInitialWindowMetrics = {
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
  frame: { x: 0, y: 0, width: 375, height: 812 }
}

const SafeAreaProvider = ({ children }) => React.createElement('View', {}, children)
const SafeAreaConsumer = ({ children }) => children(mockInitialWindowMetrics)
const SafeAreaView = ({ children, ...props }) => React.createElement('View', props, children)

const useSafeAreaInsets = () => mockInitialWindowMetrics.insets
const useSafeAreaFrame = () => mockInitialWindowMetrics.frame

module.exports = {
  SafeAreaProvider,
  SafeAreaConsumer,
  SafeAreaView,
  useSafeAreaInsets,
  useSafeAreaFrame,
  initialWindowMetrics: mockInitialWindowMetrics
}
