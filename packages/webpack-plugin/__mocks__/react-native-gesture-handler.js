import React from 'react'
import { View } from 'react-native'

const GestureDetector = ({ children, gesture, ...props }) => {
  return React.createElement(View, {
    ...props,
    testID: 'gesture-detector'
  }, children)
}

const PanGesture = {
  create: () => ({
    onStart: () => ({}),
    onUpdate: () => ({}),
    onEnd: () => ({})
  })
}

export {
  GestureDetector,
  PanGesture
}
