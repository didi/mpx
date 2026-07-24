import React from 'react'

const MockAnimatedView = React.forwardRef((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    measure: jest.fn((callback) => callback(0, 0, 50, 50, 0, 0)),
    measureLayout: jest.fn((parent, callback) => callback(0, 0))
  }))
  return React.createElement('View', props)
})

const MockAnimatedScrollView = React.forwardRef((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    scrollTo: jest.fn()
  }))
  return React.createElement('ScrollView', props)
})

const AnimatedDefault = {
  View: MockAnimatedView,
  ScrollView: MockAnimatedScrollView,
  createAnimatedComponent: jest.fn((Component) => Component)
}

export default AnimatedDefault

const animatedReactions = []

export const useSharedValue = jest.fn((initial) => React.useRef({ value: initial }).current)
export const useAnimatedRef = jest.fn(() => React.createRef())
export const useScrollViewOffset = jest.fn(() => ({ value: 0 }))
export const useAnimatedStyle = jest.fn((styleFactory) => styleFactory())
export const useAnimatedReaction = jest.fn((prepare, react) => {
  const reactionRef = React.useRef()
  if (!reactionRef.current) {
    const value = prepare()
    reactionRef.current = { prepare, react, value }
    animatedReactions.push(reactionRef.current)
    react(value, undefined)
  } else {
    reactionRef.current.prepare = prepare
    reactionRef.current.react = react
  }
  React.useEffect(() => {
    return () => {
      const index = animatedReactions.indexOf(reactionRef.current)
      if (index > -1) animatedReactions.splice(index, 1)
    }
  }, [])
})
export const __flushAnimatedReactions = jest.fn(() => {
  animatedReactions.forEach((reaction) => {
    const value = reaction.prepare()
    if (value !== reaction.value) {
      const previous = reaction.value
      reaction.value = value
      reaction.react(value, previous)
    }
  })
})
export const __resetAnimatedReactions = jest.fn(() => {
  animatedReactions.splice(0, animatedReactions.length)
})
export const withTiming = jest.fn((toValue, config, callback) => {
  if (callback) callback(true)
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
export const interpolate = jest.fn((value, inputRange, outputRange) => {
  if (!inputRange.length) return outputRange[0]
  if (value <= inputRange[0]) return outputRange[0]
  const lastIndex = inputRange.length - 1
  if (value >= inputRange[lastIndex]) return outputRange[lastIndex]
  const index = inputRange.findIndex((item) => value <= item)
  const startIndex = Math.max(index - 1, 0)
  const startInput = inputRange[startIndex]
  const endInput = inputRange[index]
  const startOutput = outputRange[startIndex]
  const endOutput = outputRange[index]
  if (typeof startOutput !== 'number' || typeof endOutput !== 'number') return startOutput
  return startOutput + (endOutput - startOutput) * ((value - startInput) / (endInput - startInput))
})

export const Extrapolation = {
  CLAMP: 'clamp',
  EXTEND: 'extend',
  IDENTITY: 'identity'
}

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
