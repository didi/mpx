import React from 'react'

const MockAnimatedView = React.forwardRef((props, ref) =>
  React.createElement('View', { ...props, ref })
)

const MockAnimatedScrollView = React.forwardRef((props, ref) =>
  React.createElement('ScrollView', { ...props, ref })
)

const AnimatedDefault = {
  View: MockAnimatedView,
  ScrollView: MockAnimatedScrollView,
  createAnimatedComponent: jest.fn((Component) => Component)
}

export default AnimatedDefault

export const useSharedValue = jest.fn((initial) => ({ value: initial }))
export const useAnimatedStyle = jest.fn((styleFactory) => styleFactory())
export const withTiming = jest.fn((toValue, config, callback) => {
  if (callback) callback()
  return toValue
})
export const withSequence = jest.fn()
export const withDelay = jest.fn()
export const withSpring = jest.fn((toValue, config, callback) => {
  if (callback) callback()
  return toValue
})
export const withDecay = jest.fn((config, callback) => {
  if (callback) callback()
  return config.velocity || 0
})
export const runOnJS = jest.fn((fn) => fn)
export const runOnUI = jest.fn((fn) => fn)
export const cancelAnimation = jest.fn()
export const makeMutable = jest.fn((value) => ({ value }))

export const Easing = {
  linear: 'linear',
  ease: 'ease',
  quad: 'quad',
  cubic: 'cubic',
  poly: jest.fn((exp) => `poly(${exp})`),
  sin: 'sin',
  circle: 'circle',
  exp: 'exp',
  elastic: jest.fn(() => 'elastic'),
  back: jest.fn(() => 'back'),
  bounce: 'bounce',
  bezier: jest.fn(() => 'bezier'),
  in: jest.fn((easing) => `in(${easing})`),
  out: jest.fn((easing) => `out(${easing})`),
  inOut: jest.fn((easing) => `inOut(${easing})`),
  step0: 'step0',
  step1: 'step1'
}
