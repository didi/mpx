/// <reference types="jest" />

import React from 'react'
import { act, create } from 'react-test-renderer'
import Swiper from '../../../lib/runtime/components/react/mpx-swiper'
import { SwiperContext } from '../../../lib/runtime/components/react/context'

let mockAnimations: any[] = []
let mockGestures: any[] = []
let mockReactions: any[] = []
const mockListeners = new Set<() => void>()
let renderer: ReturnType<typeof create> | undefined
let swiperProps: Record<string, any>

jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: 'GestureDetector',
  Gesture: {
    Pan: () => {
      const gesture: any = { callbacks: {} }
      ;['onBegin', 'onUpdate', 'onFinalize'].forEach((method) => {
        gesture[method] = (callback: any) => {
          gesture.callbacks[method] = callback
          return gesture
        }
      })
      ;['withRef', 'activeOffsetX', 'activeOffsetY', 'failOffsetX', 'failOffsetY',
        'simultaneousWithExternalGesture', 'requireExternalGestureToFail'].forEach((method) => {
        gesture[method] = () => gesture
      })
      mockGestures.push(gesture)
      return gesture
    }
  }
}))
jest.mock('react-native-reanimated', () => {
  const React = jest.requireActual('react')
  return {
    __esModule: true,
    default: { View: 'AnimatedView' },
    useSharedValue: (initialValue: any) => {
      const ref = React.useRef(null)
      if (!ref.current) {
        let value = initialValue
        const sharedValue = {
          get value () { return value },
          set value (next: any) {
            mockAnimations.forEach((animation) => {
              if (animation.sharedValue === sharedValue) animation.cancelled = true
            })
            if (next?.mockAnimation) {
              next.mockAnimation.sharedValue = sharedValue
              value = next.mockAnimation.value
            } else {
              value = next
            }
            mockListeners.forEach((notify) => notify())
          }
        }
        ref.current = sharedValue
      }
      return ref.current
    },
    useAnimatedStyle: (factory: () => any) => factory(),
    withTiming: (value: number, _options: any, callback: any) => {
      const animation = { value, callback }
      mockAnimations.push(animation)
      return { mockAnimation: animation }
    },
    cancelAnimation: (sharedValue: any) => {
      mockAnimations.forEach((animation) => {
        if (animation.sharedValue === sharedValue) animation.cancelled = true
      })
    },
    runOnJS: (callback: any) => callback,
    useAnimatedReaction: (prepare: any, react: any) => {
      const ref = React.useRef({ prepare, react, previous: null })
      Object.assign(ref.current, { prepare, react })
      React.useEffect(() => {
        const reaction = ref.current
        const notify = () => {
          const current = reaction.prepare()
          if (current !== reaction.previous) {
            const previous = reaction.previous
            reaction.previous = current
            reaction.react(current, previous)
          }
        }
        mockReactions.push(reaction)
        mockListeners.add(notify)
        notify()
        return () => mockListeners.delete(notify)
      }, [])
    },
    Easing: { cubic: 'cubic', linear: 'linear', in: (v: any) => v, out: (v: any) => v, inOut: (v: any) => v }
  }
})
jest.mock('../../../lib/runtime/components/react/context', () => ({
  SwiperContext: jest.requireActual('react').createContext(null)
}))
jest.mock('../../../lib/runtime/components/react/getInnerListeners', () => ({
  __esModule: true,
  default: () => ({}),
  getCustomEvent: (type: string, _event: unknown, options: { detail: unknown }) => ({ type, detail: options.detail })
}))
jest.mock('../../../lib/runtime/components/react/useNodesRef', () => ({ __esModule: true, default: () => undefined }))
jest.mock('../../../lib/runtime/components/react/mpx-portal', () => ({ __esModule: true, default: 'Portal' }))
jest.mock('../../../lib/runtime/components/react/utils', () => ({
  useTransformStyle: (style: any) => ({ normalStyle: style, varContextRef: { current: {} } }),
  splitStyle: () => ({ textStyle: {}, innerStyle: {} }),
  splitProps: () => ({ textProps: {} }),
  useLayout: () => ({ layoutRef: { current: {} }, layoutProps: {}, layoutStyle: {} }),
  wrapChildren: (children: unknown) => children,
  extendObject: Object.assign,
  flatGesture: () => [],
  useRunOnJSCallback: (ref: any) => (key: string, ...args: any[]) => ref.current[key](...args),
  useTextPassThrough: () => undefined
}))

function SwiperItem () {
  return React.createElement('SwiperItem', { value: React.useContext(SwiperContext) })
}

function renderSwiper (props: Record<string, unknown> = {}) {
  swiperProps = Object.assign({}, swiperProps, props)
  act(() => {
    const element = React.createElement(Swiper, swiperProps)
    if (renderer) renderer.update(element)
    else renderer = create(element)
  })
  return renderer!
}

function mockFinishAnimations () {
  act(() => mockAnimations.splice(0).forEach((animation) => animation.callback?.(!animation.cancelled)))
}

function mockGetOffset () {
  return renderer!.root.findAllByType('SwiperItem')[0].props.value.offset.value
}

describe('MpxSwiper RN runtime', () => {
  const children = [0, 1, 2, 3, 4].map((key) => React.createElement(SwiperItem, { key }))
  let eventOrder: string[]

  beforeEach(() => {
    jest.useFakeTimers()
    mockAnimations = []
    mockGestures = []
    mockReactions = []
    mockListeners.clear()
    eventOrder = []
    const onEvent = (event: any) => eventOrder.push(`${event.type}:${event.detail.current}`)
    swiperProps = { style: { width: 300, height: 100 }, children, bindchange: jest.fn(onEvent), bindchangestart: onEvent }
  })
  afterEach(() => {
    act(() => renderer?.unmount())
    renderer = undefined
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  test.each([[false, 0, 1], [true, 4, 0]])('emits changestart before autoplay change, circular=%p', (circular, current, next) => {
    renderSwiper({ circular, current, autoplay: true, interval: 10, 'display-multiple-items': 2 })
    jest.advanceTimersByTime(10)
    expect(eventOrder).toEqual([`changestart:${next}`])
    mockFinishAnimations()
    expect(eventOrder).toEqual([`changestart:${next}`, `change:${next}`])
    expect(mockGetOffset()).toBe(-(next + (circular ? 2 : 0)) * 150)
  })

  test('cancels an obsolete controlled-current transition', () => {
    renderSwiper({ current: 0 })
    renderSwiper({ current: 2 })
    renderSwiper({ current: 0 })
    mockFinishAnimations()
    expect(eventOrder).toEqual(['changestart:2'])
    expect(mockGetOffset()).toBeCloseTo(0)
  })

  test('keeps the partial offset when the parent echoes a gesture current', () => {
    renderSwiper({ current: 0 })
    const gesture = mockGestures[0].callbacks
    gesture.onBegin({ absoluteX: 0 })
    gesture.onUpdate({ absoluteX: -160 })
    gesture.onUpdate({ absoluteX: -170 })
    renderSwiper({ current: 1 })
    expect(swiperProps.bindchange).toHaveBeenCalledTimes(1)
    expect(mockGetOffset()).toBe(-170)
  })

  test('does not resume autoplay after it is disabled during a transition', () => {
    renderSwiper({ autoplay: true, interval: 10 })
    jest.advanceTimersByTime(10)
    renderSwiper({ autoplay: false })
    mockFinishAnimations()
    jest.advanceTimersByTime(20)
    expect(eventOrder).toEqual(['changestart:1', 'change:1'])
  })

  test('covers the circular viewport when edge margins are large', () => {
    const result = renderSwiper({ circular: true, 'display-multiple-items': 2, 'next-margin': '140' })
    expect(result.root.findAllByType('SwiperItem')).toHaveLength(13)
  })

  test.each([2, 4])('applies current=%i when async children become available', (current) => {
    renderSwiper({ current: 2, children: [] })
    renderSwiper({ current })
    renderSwiper({ children })
    expect(mockReactions[0].prepare()).toBe(current)
    expect(mockGetOffset()).toBe(-current * 300)
  })

  test.each([[-20, 0], [-200, 1]])('resets circular clones before autoplay resumes, velocity=%i', (velocityX, selected) => {
    renderSwiper({ current: 4, circular: true, autoplay: true, interval: 10, 'display-multiple-items': 2, 'previous-margin': '20' })
    const gesture = mockGestures[0].callbacks
    gesture.onBegin({ absoluteX: 0 })
    gesture.onUpdate({ absoluteX: -150 })
    gesture.onFinalize({ absoluteX: -150, velocityX })
    expect(mockGetOffset()).toBe(-(selected + 8) * 140 + 20)
    mockFinishAnimations()
    expect(mockReactions[0].prepare()).toBe(selected)
    const offsetAfterGesture = mockGetOffset()
    expect(offsetAfterGesture).toBe(-(selected + 3) * 140 + 20)
    jest.advanceTimersByTime(10)
    expect(mockGetOffset() - offsetAfterGesture).toBe(-140)
  })

  test.each([
    [undefined, 1], ['3', 3], [2.8, 2], [0, 1], [-2, 1], [Infinity, 1], ['invalid', 1]
  ])('normalizes display-multiple-items %p to %p', (value, count) => {
    renderSwiper({ 'display-multiple-items': value })
    expect(renderer!.root.findAllByType('SwiperItem')[0].props.value.step.value).toBe(300 / count)
  })

  test.each([false, true])('recalculates step and clamps current when config changes, vertical=%p', (vertical) => {
    renderSwiper({ style: { width: 300, height: 600 }, vertical, current: 0, 'display-multiple-items': 2 })
    renderSwiper({ current: 4, 'display-multiple-items': 3, 'previous-margin': '20', 'next-margin': '10' })
    const step = ((vertical ? 600 : 300) - 30) / 3
    expect(renderer!.root.findAllByType('SwiperItem')[0].props.value.step.value).toBe(step)
    expect(mockReactions[0].prepare()).toBe(2)
    expect(mockGetOffset()).toBe(-2 * step)
    expect(eventOrder).toEqual(['changestart:2', 'change:2'])
  })

  test.each([
    [false, 2, [false, false, true, true, false]], [true, 4, [true, false, false, false, true]]
  ])('highlights visible item dots, circular=%p', (circular, current, expected) => {
    renderSwiper({ circular, current, 'display-multiple-items': 2, 'indicator-dots': true, 'indicator-active-color': '#f00' })
    const dots = renderer!.root.findAllByType('AnimatedView').filter((node: any) => node.props.style[1]?.backgroundColor)
    expect(dots.map((node: any) => node.props.style[1].backgroundColor === '#f00')).toEqual(expected)
  })
})
