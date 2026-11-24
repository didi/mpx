/// <reference types="jest" />

import React from 'react'
import { act, create, ReactTestRenderer } from 'react-test-renderer'

const mockPinchGestures: any[] = []
const mockReactions: any[] = []
const mockVarContext = { '--color': 'red' }
const mockWrapChildren = jest.fn((children: any, _options: any) => children)

jest.mock('react-native', () => ({
  View: 'View',
  StyleSheet: { create: (styles: any) => styles }
}))

jest.mock('react-native-gesture-handler', () => {
  const gesture = () => {
    const handlers: Record<string, any> = {}
    const result: Record<string, any> = { handlers }
    ;['onStart', 'onUpdate', 'onEnd', 'onTouchesDown', 'onTouchesMove', 'onTouchesUp', 'withRef', 'activeOffsetX', 'failOffsetY', 'activeOffsetY', 'failOffsetX', 'simultaneousWithExternalGesture', 'requireExternalGestureToFail'].forEach((name) => {
      result[name] = (handler: any) => {
        handlers[name] = handler
        return result
      }
    })
    return result
  }
  return {
    GestureDetector: 'GestureDetector',
    Gesture: {
      Pan: gesture,
      Pinch: () => {
        const pinch = gesture()
        mockPinchGestures.push(pinch)
        return pinch
      },
      Race: (...gestures: any[]) => gestures
    }
  }
})

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'AnimatedView' },
  useSharedValue: (value: any) => jest.requireActual('react').useRef({ value }).current,
  useAnimatedStyle: (factory: any) => factory(),
  useAnimatedReaction: (prepare: any, react: any) => { mockReactions.push({ prepare, react }) },
  runOnUI: (callback: any) => callback,
  runOnJS: (callback: any) => callback,
  withTiming: (value: any) => value
}))

jest.mock('../../../lib/runtime/components/react/utils', () => ({
  useTransformStyle: (style: any) => ({ normalStyle: style, hasVarDec: true, varContext: mockVarContext }),
  splitProps: (props: any) => ({ textProps: {}, innerProps: props }),
  splitStyle: (style: any) => ({ textStyle: {}, innerStyle: style }),
  useTextPassThrough: () => null,
  flatGesture: (handlers: any) => handlers,
  useNavigation: () => null,
  useRunOnJSCallback: (ref: any) => (name: string, ...args: any[]) => ref.current[name](...args),
  useLayout: () => ({ layoutRef: { current: {} }, layoutStyle: {}, layoutProps: {} }),
  wrapChildren: (children: any, options: any) => mockWrapChildren(children, options),
  extendObject: Object.assign,
  omit: (props: any, keys: string[]) => Object.fromEntries(Object.entries(props).filter(([key]) => !keys.includes(key)))
}))

jest.mock('../../../lib/runtime/components/react/useNodesRef', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('../../../lib/runtime/components/react/mpx-portal', () => ({ __esModule: true, default: 'Portal' }))
jest.mock('../../../lib/runtime/components/react/getInnerListeners', () => ({
  __esModule: true,
  default: (props: any, excluded: string[] = []) => Object.fromEntries(Object.entries(props).filter(([key]) => !excluded.includes(key))),
  getCustomEvent: (type: string, _event: any, payload: any) => ({ type, detail: payload.detail })
}))

// eslint-disable-next-line import/first
import MovableView from '../../../lib/runtime/components/react/mpx-movable-view'
// eslint-disable-next-line import/first
import MovableArea from '../../../lib/runtime/components/react/mpx-movable-area'
// eslint-disable-next-line import/first
import { MovableAreaContext } from '../../../lib/runtime/components/react/context'

const view = (props: any) => React.createElement(MovableAreaContext.Provider, {
  value: { width: 300, height: 300, scaleArea: false }
}, React.createElement(MovableView, Object.assign({ direction: 'all', x: 80, y: 60, animation: false, scale: true, children: 'content' }, props)))

const render = (element: React.ReactElement) => {
  let renderer: ReactTestRenderer
  act(() => {
    renderer = create(element, {
      // eslint-disable-next-line node/no-callback-literal
      createNodeMock: () => ({ measure: (callback: any) => callback(0, 0, 100, 100) })
    })
  })
  act(() => renderer!.root.findByType('AnimatedView').props.onLayout({ nativeEvent: { layout: { width: 100, height: 100 } } }))
  return renderer!
}

describe('movable scaling merged with RN runtime updates', () => {
  beforeEach(() => {
    mockPinchGestures.length = 0
    mockReactions.length = 0
    mockWrapChildren.mockClear()
  })

  test('keeps pinch scaling, scale events and worklet change events together', () => {
    const bindscale = jest.fn()
    const bindchange = jest.fn()
    const workletChange = jest.fn()
    const renderer = render(view({ bindscale, bindchange, workletChange, 'scale-max': 3 }))
    const { handlers } = mockPinchGestures[0]
    const reaction = mockReactions[0]
    const previous = reaction.prepare()

    act(() => {
      handlers.onStart({})
      handlers.onUpdate({ scale: 2 })
      reaction.react(reaction.prepare(), previous)
      handlers.onEnd()
    })

    expect(bindscale).toHaveBeenLastCalledWith({ type: 'scale', detail: { x: 30, y: 10, scale: 2 } })
    expect(workletChange).toHaveBeenLastCalledWith({ x: 30, y: 10, source: '' })
    expect(bindchange).toHaveBeenLastCalledWith({ type: 'change', detail: { x: 30, y: 10, source: '' } })
    act(() => handlers.onUpdate({ scale: 10 }))
    expect(bindscale.mock.calls[bindscale.mock.calls.length - 1][0].detail.scale).toBe(3)
    expect(renderer.root.findByType('AnimatedView').props.bindscale).toBeUndefined()
    act(() => renderer.unmount())
  })

  test('reports final coordinates when scale-value changes after layout', () => {
    const bindscale = jest.fn()
    const renderer = render(view({ bindscale }))

    act(() => renderer.update(view({ bindscale, 'scale-value': 2 })))

    expect(bindscale).toHaveBeenLastCalledWith({ type: 'scale', detail: { x: 30, y: 10, scale: 2 } })
    act(() => renderer.unmount())
  })

  test('scales registered children from the area and passes the new style context', () => {
    const bindscale = jest.fn()
    const renderer = render(React.createElement(MovableArea, {
      'scale-area': true,
      style: { width: 300, height: 300 },
      children: React.createElement(MovableView, { direction: 'all', scale: true, x: 80, y: 60, bindscale, children: 'content' })
    }))

    expect(mockPinchGestures).toHaveLength(1)
    expect(mockWrapChildren).toHaveBeenCalledWith(expect.any(Object), { hasVarDec: true, varContext: mockVarContext })
    act(() => {
      mockPinchGestures[0].handlers.onUpdate({ scale: 2 })
      mockPinchGestures[0].handlers.onEnd()
    })
    expect(bindscale).toHaveBeenLastCalledWith({ type: 'scale', detail: { x: 30, y: 10, scale: 2 } })
    act(() => renderer.unmount())
  })
})
