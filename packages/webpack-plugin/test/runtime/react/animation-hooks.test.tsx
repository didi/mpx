import React from 'react'
import { render } from '@testing-library/react-native'
import { View } from 'react-native'
import * as Reanimated from 'react-native-reanimated'
import useAnimationHooks from '../../../lib/runtime/components/react/animationHooks'
import useAnimationAPIHooks from '../../../lib/runtime/components/react/animationHooks/useAnimationAPIHooks'
import useTransitionHooks from '../../../lib/runtime/components/react/animationHooks/useTransitionHooks'
import {
  formatAnimatedKeys,
  getAnimation,
  getInitialVal,
  getTransformObj,
  getUnit,
  isTransform
} from '../../../lib/runtime/components/react/animationHooks/utils'

describe('react runtime animation hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const withDelay = Reanimated.withDelay as jest.Mock
    const withSequence = Reanimated.withSequence as jest.Mock
    withDelay.mockImplementation((delay, animation) => animation)
    withSequence.mockImplementation((...animations) => animations[animations.length - 1])
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('formats animation utility values and delegates timing options', () => {
    const callback = jest.fn()

    expect(isTransform('translateX')).toBe(true)
    expect(isTransform('opacity')).toBe(false)
    expect(getTransformObj([{ translateX: 10 }, { scaleY: 2 }])).toEqual({
      translateX: 10,
      scaleY: 2
    })
    expect(getInitialVal({ transform: [{ translateX: 12 }] }, 'translateX')).toBe(12)
    expect(getInitialVal({}, 'opacity')).toBe(1)
    expect(formatAnimatedKeys(['opacity', 'translateX', 'scaleY'])).toEqual([
      'opacity',
      ['translateX', 'scaleY']
    ])
    expect(getUnit('1.5s')).toBe(1500)
    expect(getUnit('200ms')).toBe(200)
    expect(getUnit('bad')).toBe(0)

    expect(getAnimation({ key: 'opacity', value: 0.5 }, { duration: 100, easing: 'linear' as any }, callback)).toBe(0.5)
    expect(Reanimated.withTiming).toHaveBeenCalledWith(0.5, {
      duration: 100,
      easing: 'linear'
    }, callback)

    getAnimation({ key: 'translateX', value: 20 }, { delay: 50, duration: 200, easing: 'ease' as any })
    expect(Reanimated.withDelay).toHaveBeenCalledWith(50, 20)
  })

  it('drives animation API actions and emits transitionend metadata', () => {
    const transitionend = jest.fn()
    let hookResult: ReturnType<typeof useAnimationHooks> | undefined
    const animation = {
      id: 7,
      actions: [
        {
          animatedOption: {
            duration: 100,
            delay: 20,
            timingFunction: 'ease-in' as const,
            transformOrigin: '10px 20px'
          },
          rules: new Map<string, number | string>([
            ['opacity', 0.5],
            ['width', '50%']
          ]),
          transform: new Map<string, number>([
            ['translateX', 20]
          ])
        },
        {
          animatedOption: {
            duration: 50,
            transformOrigin: '20px 30px'
          },
          rules: new Map<string, number | string>([
            ['opacity', 1]
          ]),
          transform: new Map<string, number>([
            ['translateX', 40]
          ])
        }
      ]
    }
    const layoutRef = {
      current: {
        offsetLeft: 5,
        offsetTop: 6
      }
    }

    const Probe = () => {
      hookResult = useAnimationHooks({
        layoutRef,
        animation,
        'enable-animation': 'api',
        style: {
          opacity: 1,
          width: 100,
          transform: [{ translateX: 0 }]
        },
        catchtransitionend: transitionend,
        'data-name': 'card'
      } as any)
      return <View testID="animation-api-probe" style={hookResult.animationStyle as any} />
    }

    render(<Probe />)

    expect(hookResult?.enableStyleAnimation).toBe(true)
    expect(Reanimated.withTiming).toHaveBeenCalledWith(0.5, expect.objectContaining({
      duration: 100,
      easing: 'in(poly(3))'
    }), expect.any(Function))
    expect(Reanimated.withDelay).toHaveBeenCalledWith(20, 0.5)
    expect(Reanimated.withSequence).toHaveBeenCalled()
    expect(transitionend).toHaveBeenCalledWith(expect.objectContaining({
      type: 'transitionend',
      detail: expect.objectContaining({
        elapsedTime: 0.1,
        finished: true
      }),
      target: expect.objectContaining({
        id: 7,
        offsetLeft: 5,
        offsetTop: 6
      })
    }))
  })

  it('updates transition styles on subsequent renders', () => {
    const transitionend = jest.fn()
    const Probe = ({ style }: { style: Record<string, any> }) => {
      const animationStyle = useTransitionHooks({
        style,
        transitionend
      } as any)
      return <View testID="transition-probe" style={animationStyle} />
    }
    const initialStyle = {
      transition: 'opacity 100ms ease-in 50ms, transform 0.2s cubic-bezier(0, 0, 1, 1)',
      opacity: 0,
      transform: [{ translateX: 0 }, { scaleX: 1 }]
    }

    const { rerender } = render(<Probe style={initialStyle} />)
    rerender(
      <Probe
        style={{
          transition: initialStyle.transition,
          opacity: 1,
          transform: [{ translateX: 20 }, { scaleX: 2 }]
        }}
      />
    )

    expect(Reanimated.Easing.bezier).toHaveBeenCalledWith(0, 0, 1, 1)
    expect(Reanimated.withTiming).toHaveBeenCalledWith(1, expect.objectContaining({
      duration: 100,
      easing: 'in(poly(3))'
    }), expect.any(Function))
    expect(Reanimated.withDelay).toHaveBeenCalledWith(50, 1)
    expect(transitionend).toHaveBeenCalledWith(true, undefined, 100)
  })

  it('reports unsupported or unstable animation declarations', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(jest.fn())
    let hookResult: ReturnType<typeof useAnimationHooks> | undefined
    const animation = {
      id: 1,
      actions: []
    }

    const Probe = ({ props }: { props: Record<string, any> }) => {
      hookResult = useAnimationHooks(Object.assign({
        layoutRef: { current: {} }
      }, props) as any)
      return <View testID="animation-probe" />
    }

    const { unmount } = render(<Probe props={{ style: { animation: 'spin 1s' } }} />)
    expect(hookResult?.enableStyleAnimation).toBe(false)
    expect(error).toHaveBeenCalledWith(expect.stringContaining('CSS animation is not supported yet'))
    unmount()

    const apiRender = render(<Probe props={{ style: {}, animation, 'enable-animation': 'api' }} />)
    apiRender.rerender(<Probe props={{ style: { transition: 'opacity 1s' }, animation, 'enable-animation': 'transition' }} />)
    expect(error).toHaveBeenCalledWith(expect.stringContaining('The animation type should be stable'))
  })

  it('parses invalid transition tokens with explicit runtime errors', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(jest.fn())
    const Probe = () => {
      const animationStyle = useTransitionHooks({
        style: {
          transition: 'all 100ms, width 1s step-start, opacity 1s allow-discrete, height 1s inherit'
        }
      } as any)
      return <View testID="invalid-transition-probe" style={animationStyle} />
    }

    render(<Probe />)

    expect(error).toHaveBeenCalledWith(expect.stringContaining('transition-property is not supported'))
    expect(error).toHaveBeenCalledWith(expect.stringContaining('step-start,step-end,steps() is not supported'))
    expect(error).toHaveBeenCalledWith(expect.stringContaining('transition-behavior is not supported'))
    expect(error).toHaveBeenCalledWith(expect.stringContaining('global values is not supported'))
  })

  it('returns animated styles for animation API hook renders', () => {
    const Probe = () => {
      const animationStyle = useAnimationAPIHooks({
        style: {
          opacity: 0.2,
          transform: [{ scaleX: 1 }]
        },
        animation: {
          id: 3,
          actions: [
            {
              animatedOption: { duration: 100 },
              rules: new Map<string, number | string>([
                ['opacity', 0.8]
              ]),
              transform: new Map<string, number>([
                ['scaleX', 2]
              ])
            }
          ]
        }
      } as any)
      return <View testID="api-hook-probe" style={animationStyle} />
    }

    render(<Probe />)

    expect(Reanimated.useAnimatedStyle).toHaveBeenCalled()
    expect(Reanimated.withTiming).toHaveBeenCalledWith(0.8, expect.objectContaining({
      duration: 100
    }), expect.any(Function))
  })
})
