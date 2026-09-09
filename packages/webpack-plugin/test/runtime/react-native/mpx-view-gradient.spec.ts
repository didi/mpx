/// <reference types="jest" />

import React from 'react'
import { act, create, ReactTestRenderer } from 'react-test-renderer'

jest.mock('react-native', () => ({
  StyleSheet: { hairlineWidth: 1 / 3, absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 } },
  Image: Object.assign((props: any) => jest.requireActual('react').createElement('Image', props), { getSize: jest.fn(), resolveAssetSource: jest.fn() }),
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
  default: () => ({ enableStyleAnimation: false })
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
import MpxView, { __parseBgImageForTest } from '../../../lib/runtime/components/react/mpx-view'

const layoutEvent = (width: number, height: number) => ({ nativeEvent: { layout: { width, height } } })
const renderGradient = (backgroundSize?: Array<string | number>) => {
  const style: Record<string, any> = {
    width: 200,
    height: 100,
    backgroundImage: 'linear-gradient(to top right, red, blue)'
  }
  if (backgroundSize) style.backgroundSize = backgroundSize
  return React.createElement(MpxView, { 'enable-background': true, style })
}

describe('mpx-view linear-gradient parser', () => {
  test('keeps non-deg angle units as explicit gradient direction', () => {
    expect(__parseBgImageForTest('linear-gradient(0.25turn, red, blue)').linearInfo.direction).toBe('0.25turn')
    expect(__parseBgImageForTest('linear-gradient(1.5707963267948966rad, red, blue)').linearInfo.direction).toBe('1.5707963267948966rad')
    expect(__parseBgImageForTest('linear-gradient(100grad, red, blue)').linearInfo.direction).toBe('100grad')
  })

  test('does not strip "to" from colors when angle is explicit', () => {
    const { linearInfo } = __parseBgImageForTest('linear-gradient(90deg, tomato, blue)')

    expect(linearInfo.direction).toBe('90deg')
    expect(linearInfo.colors).toEqual(['tomato', 'blue'])
  })

  test('renders fixed diagonal gradient without layout and ignores passive layout for publishing', () => {
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(renderGradient([120, 60]))
    })
    const initialGradient = renderer!.root.findByType('LinearGradient')
    expect(initialGradient.props.style).toMatchObject({ width: 120, height: 60 })
    expect(initialGradient.props.angle).toBeCloseTo(26.565)

    act(() => renderer!.root.findAllByType('View')[1].props.onLayout(layoutEvent(200, 100)))
    expect(renderer!.root.findByType('LinearGradient').props.angle).toBeCloseTo(26.565)
    act(() => renderer!.unmount())
  })

  test.each([
    ['default', undefined],
    ['auto', ['auto']],
    ['cover', ['cover']],
    ['contain', ['contain']],
    ['percentage', ['100%', '100%']]
  ])('waits for layout when diagonal gradient size is %s', (_name, backgroundSize) => {
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(renderGradient(backgroundSize))
    })
    expect(renderer!.root.findAllByType('LinearGradient')).toHaveLength(0)

    act(() => renderer!.root.findAllByType('View')[1].props.onLayout(layoutEvent(200, 100)))
    const gradient = renderer!.root.findByType('LinearGradient')
    expect(gradient.props.style).toMatchObject({ width: '100%', height: '100%' })
    expect(gradient.props.angle).toBeCloseTo(26.565)
    act(() => renderer!.unmount())
  })
})
