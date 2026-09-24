/// <reference types="jest" />

type DependencyList = readonly unknown[] | undefined
type EffectCleanup = void | (() => void)
type EffectSlot = {
  cleanup: EffectCleanup
  deps: DependencyList
}
type MemoSlot = {
  value: unknown
  deps: DependencyList
}
type Reaction = {
  prepare: () => unknown
  react: (current: unknown, previous: unknown) => void
  previous: unknown
}
type SharedValue = {
  value: unknown
}
type PendingAnimation = {
  callback?: (finished: boolean) => void
  cancelled: boolean
  completed: boolean
  sharedValue?: SharedValue
  value: unknown
}
type AnimationValue = {
  mockAnimation: PendingAnimation
}
type GestureCallback = (event: Record<string, number>) => void
type MockGesture = Record<string, any> & {
  callbacks: Record<string, GestureCallback>
}

let mockRefIndex = 0
let mockStateIndex = 0
let mockMemoIndex = 0
let mockEffectIndex = 0
let mockSharedValueIndex = 0
let mockReactionIndex = 0
let mockRefs: Array<{ current: unknown }> = []
let mockStates: unknown[] = []
let mockMemos: MemoSlot[] = []
let mockEffects: EffectSlot[] = []
let mockSharedValues: SharedValue[] = []
let mockReactions: Reaction[] = []
let mockPendingAnimations: PendingAnimation[] = []
let mockGestures: MockGesture[] = []
let mockAnimatedStyleFactories: Array<() => unknown> = []

function mockAreHookInputsEqual (nextDeps: DependencyList, prevDeps: DependencyList) {
  return !!nextDeps && !!prevDeps &&
    nextDeps.length === prevDeps.length &&
    nextDeps.every((value, index) => Object.is(value, prevDeps[index]))
}

function mockBeginRender () {
  mockRefIndex = 0
  mockStateIndex = 0
  mockMemoIndex = 0
  mockEffectIndex = 0
  mockSharedValueIndex = 0
  mockReactionIndex = 0
  mockAnimatedStyleFactories = []
}

function mockResetHooks () {
  mockRefs = []
  mockStates = []
  mockMemos = []
  mockEffects = []
  mockSharedValues = []
  mockReactions = []
  mockPendingAnimations = []
  mockGestures = []
  mockBeginRender()
}

function mockCleanupEffects () {
  mockEffects.forEach(({ cleanup }) => cleanup && cleanup())
}

function mockNotifyReactions () {
  mockReactions.forEach((reaction) => {
    const current = reaction.prepare()
    if (current !== reaction.previous) {
      const previous = reaction.previous
      reaction.previous = current
      reaction.react(current, previous)
    }
  })
}

function mockCancelSharedValueAnimation (sharedValue: SharedValue) {
  mockPendingAnimations.forEach((animation) => {
    if (animation.sharedValue === sharedValue && !animation.completed) {
      animation.cancelled = true
    }
  })
}

function mockIsAnimationValue (value: unknown): value is AnimationValue {
  return !!value && typeof value === 'object' && 'mockAnimation' in value
}

function mockFinishAnimations () {
  mockPendingAnimations.slice().forEach((animation) => {
    if (!animation.completed) {
      animation.completed = true
      animation.callback?.(!animation.cancelled)
    }
  })
}

function mockGetOffset () {
  const styleFactory = mockAnimatedStyleFactories[mockAnimatedStyleFactories.length - 1]
  const style = styleFactory() as { transform: Array<{ translateX: number }> }
  return style.transform[0].translateX
}

jest.mock('react-native', () => ({
  View: 'View'
}), { virtual: false })

jest.mock('react-native-gesture-handler', () => {
  const createGesture = () => {
    const gesture = { callbacks: {} } as MockGesture
    ;['onBegin', 'onUpdate', 'onFinalize'].forEach((method) => {
      gesture[method] = (callback: GestureCallback) => {
        gesture.callbacks[method] = callback
        return gesture
      }
    })
    ;[
      'withRef',
      'activeOffsetX',
      'activeOffsetY',
      'failOffsetX',
      'failOffsetY',
      'simultaneousWithExternalGesture',
      'requireExternalGestureToFail'
    ].forEach((method) => {
      gesture[method] = () => gesture
    })
    mockGestures.push(gesture)
    return gesture
  }
  return {
    GestureDetector: 'GestureDetector',
    Gesture: { Pan: createGesture }
  }
}, { virtual: false })

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'AnimatedView' },
  useSharedValue: (initialValue: unknown) => {
    const index = mockSharedValueIndex++
    if (!mockSharedValues[index]) {
      let value = initialValue
      const sharedValue = {} as SharedValue
      Object.defineProperty(sharedValue, 'value', {
        get: () => value,
        set: (nextValue: unknown) => {
          mockCancelSharedValueAnimation(sharedValue)
          if (mockIsAnimationValue(nextValue)) {
            nextValue.mockAnimation.sharedValue = sharedValue
            value = nextValue.mockAnimation.value
          } else {
            value = nextValue
          }
          mockNotifyReactions()
        }
      })
      mockSharedValues[index] = sharedValue
    }
    return mockSharedValues[index]
  },
  useAnimatedStyle: (factory: () => unknown) => {
    mockAnimatedStyleFactories.push(factory)
    return factory()
  },
  withTiming: (value: unknown, _options: unknown, callback?: (finished: boolean) => void) => {
    const animation = { value, callback, cancelled: false, completed: false }
    mockPendingAnimations.push(animation)
    return { mockAnimation: animation }
  },
  Easing: {
    cubic: 'cubic',
    linear: 'linear',
    in: (value: unknown) => value,
    out: (value: unknown) => value,
    inOut: (value: unknown) => value
  },
  runOnJS: (callback: (...args: any[]) => unknown) => callback,
  useAnimatedReaction: (prepare: () => unknown, react: (current: unknown, previous: unknown) => void) => {
    const index = mockReactionIndex++
    const reaction = mockReactions[index]
    if (reaction) {
      reaction.prepare = prepare
      reaction.react = react
    } else {
      const current = prepare()
      mockReactions[index] = { prepare, react, previous: current }
      react(current, null)
    }
  },
  cancelAnimation: (sharedValue: SharedValue) => mockCancelSharedValueAnimation(sharedValue)
}), { virtual: false })

jest.mock('react', () => {
  const actual = jest.requireActual('react')
  return Object.assign({}, actual, {
    forwardRef: (render: unknown) => render,
    useEffect: (effect: () => EffectCleanup, deps?: DependencyList) => {
      const index = mockEffectIndex++
      const slot = mockEffects[index]
      if (!slot || !mockAreHookInputsEqual(deps, slot.deps)) {
        slot?.cleanup && slot.cleanup()
        mockEffects[index] = { cleanup: effect(), deps }
      }
    },
    useMemo: (factory: () => unknown, deps?: DependencyList) => {
      const index = mockMemoIndex++
      const slot = mockMemos[index]
      if (!slot || !mockAreHookInputsEqual(deps, slot.deps)) {
        mockMemos[index] = { value: factory(), deps }
      }
      return mockMemos[index].value
    },
    useRef: (initialValue: unknown) => {
      const index = mockRefIndex++
      if (!mockRefs[index]) mockRefs[index] = { current: initialValue }
      return mockRefs[index]
    },
    useState: (initialValue: unknown) => {
      const index = mockStateIndex++
      if (!(index in mockStates)) mockStates[index] = initialValue
      return [mockStates[index], (nextValue: unknown) => {
        mockStates[index] = nextValue
      }]
    }
  })
})

jest.mock('../../../lib/runtime/components/react/getInnerListeners', () => ({
  __esModule: true,
  default: () => ({}),
  getCustomEvent: (type: string, _event: unknown, options: { detail: unknown }) => ({
    type,
    detail: options.detail
  })
}))

jest.mock('../../../lib/runtime/components/react/useNodesRef', () => ({
  __esModule: true,
  default: () => undefined
}))

jest.mock('../../../lib/runtime/components/react/context', () => ({
  SwiperContext: { Provider: 'SwiperProvider' }
}))

jest.mock('../../../lib/runtime/components/react/mpx-portal', () => ({
  __esModule: true,
  default: 'Portal'
}))

jest.mock('../../../lib/runtime/components/react/utils', () => ({
  useTransformStyle: (style: Record<string, unknown>) => ({
    normalStyle: style,
    hasVarDec: false,
    varContextRef: { current: {} },
    hasSelfPercent: false,
    hasPositionFixed: false,
    setWidth: jest.fn(),
    setHeight: jest.fn()
  }),
  splitStyle: () => ({ textStyle: {}, innerStyle: {} }),
  splitProps: () => ({ textProps: {} }),
  useLayout: () => ({ layoutRef: { current: {} }, layoutProps: {}, layoutStyle: {} }),
  wrapChildren: (children: unknown) => children,
  extendObject: Object.assign,
  flatGesture: () => [],
  useRunOnJSCallback: (callbackMapRef: { current: Record<string, (...args: any[]) => unknown> }) => {
    return (key: string, ...args: any[]) => callbackMapRef.current[key]?.(...args)
  },
  useTextPassThrough: () => undefined
}))

// eslint-disable-next-line import/first
import React from 'react'
// eslint-disable-next-line import/first
import Swiper from '../../../lib/runtime/components/react/mpx-swiper'

function renderSwiper (props: Record<string, unknown>) {
  mockBeginRender()
  return (Swiper as any)(props, null)
}

function findElementByType (element: any, type: unknown): any {
  if (!element) return null
  if (Array.isArray(element)) {
    let matched = null
    element.some((child) => {
      matched = findElementByType(child, type)
      return !!matched
    })
    return matched
  }
  if (element.type === type) return element
  return findElementByType(element.props?.children, type)
}

describe('MpxSwiper RN runtime events', () => {
  const children = [0, 1, 2].map((key) => React.createElement('SwiperItem', { key }))

  beforeEach(() => {
    jest.useFakeTimers()
    mockResetHooks()
  })

  afterEach(() => {
    mockCleanupEffects()
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  test('emits changestart before change when autoplay selects the next item', () => {
    const eventOrder: string[] = []

    renderSwiper({
      style: { width: 300, height: 100 },
      autoplay: true,
      interval: 10,
      'display-multiple-items': '2',
      bindchangestart: (event: { type: string; detail: { current: number } }) => {
        eventOrder.push(`${event.type}:${event.detail.current}`)
      },
      bindchange: (event: { type: string; detail: { current: number } }) => {
        eventOrder.push(`${event.type}:${event.detail.current}`)
      },
      children
    })

    jest.advanceTimersByTime(10)
    expect(eventOrder).toEqual(['changestart:1'])

    mockFinishAnimations()
    expect(eventOrder).toEqual(['changestart:1', 'change:1'])
  })

  test('does not commit an obsolete controlled-current transition', () => {
    const eventOrder: string[] = []
    const props = {
      style: { width: 300, height: 100 },
      bindchangestart: (event: { type: string; detail: { current: number } }) => {
        eventOrder.push(`${event.type}:${event.detail.current}`)
      },
      bindchange: (event: { type: string; detail: { current: number } }) => {
        eventOrder.push(`${event.type}:${event.detail.current}`)
      },
      children
    }

    renderSwiper(Object.assign({ current: 0 }, props))
    renderSwiper(Object.assign({ current: 2 }, props))
    renderSwiper(Object.assign({ current: 0 }, props))
    mockFinishAnimations()

    expect(eventOrder).toEqual(['changestart:2'])
    expect(mockReactions[0].prepare()).toBe(0)
  })

  test('keeps the partial offset when the parent echoes a gesture current', () => {
    const props = {
      style: { width: 300, height: 100 },
      bindchange: jest.fn(),
      children
    }

    renderSwiper(Object.assign({ current: 0 }, props))
    const gesture = mockGestures[0].callbacks
    gesture.onBegin({ absoluteX: 0 })
    gesture.onUpdate({ absoluteX: -160 })
    gesture.onUpdate({ absoluteX: -170 })
    expect(mockGetOffset()).toBe(-170)

    renderSwiper(Object.assign({ current: 1 }, props))

    expect(props.bindchange).toHaveBeenCalledTimes(1)
    expect(mockGetOffset()).toBe(-170)
  })

  test('does not resume autoplay after it is disabled during a transition', () => {
    const eventOrder: string[] = []
    const props = {
      style: { width: 300, height: 100 },
      interval: 10,
      bindchangestart: (event: { type: string; detail: { current: number } }) => {
        eventOrder.push(`${event.type}:${event.detail.current}`)
      },
      bindchange: (event: { type: string; detail: { current: number } }) => {
        eventOrder.push(`${event.type}:${event.detail.current}`)
      },
      children
    }

    renderSwiper(Object.assign({ autoplay: true }, props))
    jest.advanceTimersByTime(10)
    renderSwiper(Object.assign({ autoplay: false }, props))
    mockFinishAnimations()
    jest.advanceTimersByTime(20)

    expect(eventOrder).toEqual(['changestart:1', 'change:1'])
  })

  test('renders enough circular clones for a viewport with large edge margins', () => {
    const circularChildren = [0, 1, 2, 3, 4].map((key) => React.createElement('SwiperItem', { key }))
    const result = renderSwiper({
      style: { width: 300, height: 100 },
      circular: true,
      disableGesture: true,
      'display-multiple-items': 2,
      'next-margin': '140',
      children: circularChildren
    })
    const provider = findElementByType(result, 'SwiperProvider')

    expect(React.Children.count(provider.props.children)).toBe(13)
  })

  test('emits change when config and controlled current update together', () => {
    const eventOrder: string[] = []
    const fiveChildren = [0, 1, 2, 3, 4].map((key) => React.createElement('SwiperItem', { key }))
    const props = {
      style: { width: 300, height: 100 },
      bindchangestart: (event: { type: string; detail: { current: number } }) => {
        eventOrder.push(`${event.type}:${event.detail.current}`)
      },
      bindchange: (event: { type: string; detail: { current: number } }) => {
        eventOrder.push(`${event.type}:${event.detail.current}`)
      },
      children: fiveChildren
    }

    renderSwiper(Object.assign({ current: 0, 'display-multiple-items': 2 }, props))
    renderSwiper(Object.assign({ current: 4, 'display-multiple-items': 3 }, props))

    expect(eventOrder).toEqual(['changestart:2', 'change:2'])
  })
})
