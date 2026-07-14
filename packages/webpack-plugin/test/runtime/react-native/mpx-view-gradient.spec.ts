/// <reference types="jest" />

jest.mock('react-native', () => ({
  StyleSheet: { hairlineWidth: 1 / 3 },
  Image: class Image {},
  View: 'View'
}), { virtual: false })

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'AnimatedView' }
}), { virtual: false })

jest.mock('react-native-linear-gradient', () => 'LinearGradient', { virtual: false })

jest.mock('react-native-gesture-handler', () => ({
  Gesture: { Tap: () => ({}), Pan: () => ({}), LongPress: () => ({}) },
  GestureDetector: 'GestureDetector'
}), { virtual: false })

jest.mock('react-native-safe-area-context', () => ({
  initialWindowMetrics: { insets: { top: 0, right: 0, bottom: 0, left: 0 } }
}), { virtual: false })

jest.mock('../../../lib/runtime/components/react/animationHooks/index', () => ({
  __esModule: true,
  default: () => undefined
}))

jest.mock('@mpxjs/perf', () => ({
  scopeStart: () => -1,
  scopeEnd: () => undefined
}))

jest.mock('../../../lib/runtime/components/react/mpx-portal', () => ({
  __esModule: true,
  default: 'Portal'
}))

// eslint-disable-next-line import/first
import { __parseBgImageForTest as parseBgImage } from '../../../lib/runtime/components/react/mpx-view'

describe('mpx-view linear-gradient parser', () => {
  test('keeps non-deg angle units as explicit gradient direction', () => {
    expect(parseBgImage('linear-gradient(0.25turn, red, blue)').linearInfo.direction).toBe('0.25turn')
    expect(parseBgImage('linear-gradient(1.5707963267948966rad, red, blue)').linearInfo.direction).toBe('1.5707963267948966rad')
    expect(parseBgImage('linear-gradient(100grad, red, blue)').linearInfo.direction).toBe('100grad')
  })

  test('does not strip "to" from colors when angle is explicit', () => {
    const { linearInfo } = parseBgImage('linear-gradient(90deg, tomato, blue)')

    expect(linearInfo.direction).toBe('90deg')
    expect(linearInfo.colors).toEqual(['tomato', 'blue'])
  })
})
