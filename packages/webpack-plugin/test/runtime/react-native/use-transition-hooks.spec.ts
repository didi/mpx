/// <reference types="jest" />

import { createElement } from 'react'
import { act, create, ReactTestRenderer } from 'react-test-renderer'
import { cancelAnimation, withDelay, withTiming } from 'react-native-reanimated'
import { error, warn } from '@mpxjs/utils'
import useTransitionHooks from '../../../lib/runtime/components/react/animationHooks/useTransitionHooks'
import useAnimationAPIHooks from '../../../lib/runtime/components/react/animationHooks/useAnimationAPIHooks'

let mockReadStyle: () => Record<string, any>

jest.mock('react-native-reanimated', () => {
  const identity = (value: any) => value
  return {
    Easing: { linear: identity, ease: identity, quad: identity, in: identity, out: identity, inOut: identity, poly: () => identity },
    makeMutable: (value: any) => ({ value }),
    useSharedValue: (value: any) => jest.requireActual('react').useRef({ value }).current,
    // 保留真实 React 生命周期，按需读取 worklet 的最新输出。
    useAnimatedStyle: (updater: () => Record<string, any>) => { mockReadStyle = updater; return {} },
    withTiming: jest.fn((value: any) => value),
    withDelay: jest.fn((delay: number, value: any) => value),
    cancelAnimation: jest.fn(),
    runOnJS: identity
  }
})

jest.mock('@mpxjs/utils', () => Object.assign({}, jest.requireActual('@mpxjs/utils'), {
  error: jest.fn(),
  warn: jest.fn()
}))

jest.mock('../../../lib/runtime/components/react/utils', () => ({
  // 本组只使用简单 transition 声明，不测试括号内分隔符解析。
  parseValues: (value: string, separator = ' ') => value.split(separator).map(item => item.trim()),
  useRunOnJSCallback: (ref: { current: Record<string, (...args: any[]) => void> }) => {
    return (name: string, ...args: any[]) => ref.current[name](...args)
  }
}))

const constraintKeys = ['maxHeight', 'maxWidth', 'minHeight', 'minWidth', 'top', 'right', 'bottom', 'left']
let renderer: ReactTestRenderer

type TransitionProps = { style: Record<string, any>, transitionend?: (...args: any[]) => void }

function Transition (props: TransitionProps) {
  useTransitionHooks(props)
  return null
}

function renderStyle (style: Record<string, any>, transitionend?: TransitionProps['transitionend']) {
  act(() => {
    if (renderer) renderer.update(createElement(Transition, { style, transitionend }))
    else renderer = create(createElement(Transition, { style, transitionend }))
  })
  return mockReadStyle()
}

afterEach(() => {
  if (renderer) act(() => renderer.unmount())
  renderer = undefined as any
  jest.clearAllMocks()
})

describe('transition 缺省约束', () => {
  test.each(constraintKeys)('%s 保留追踪且不会在首帧补零', (key) => {
    const result = renderStyle({ transitionProperty: key, transitionDuration: '0s' })
    expect(result).toHaveProperty(key, undefined)
    expect(withTiming).not.toHaveBeenCalled()
  })

  test.each(constraintKeys)('%s 从缺省直接设置，再过渡到新值，最后清除约束', (key) => {
    const transition = { transitionProperty: key, transitionDuration: '300ms' }
    renderStyle(transition)
    expect(renderStyle(Object.assign({}, transition, { [key]: 120 }))[key]).toBe(120)
    expect(withTiming).not.toHaveBeenCalled()

    expect(renderStyle(Object.assign({}, transition, { [key]: 240 }))[key]).toBe(240)
    expect(withTiming).toHaveBeenCalledWith(240, expect.objectContaining({ duration: 300 }))
    jest.clearAllMocks()

    expect(renderStyle(Object.assign({}, transition))).toHaveProperty(key, undefined)
    expect(cancelAnimation).toHaveBeenCalledTimes(1)
    expect(withTiming).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
  })

  test('百分比与缺省之间直接切换', () => {
    const style = { transition: 'max-height 300ms' }
    renderStyle(style)
    expect(renderStyle(Object.assign({}, style, { maxHeight: '50%' })).maxHeight).toBe('50%')
    expect(renderStyle(Object.assign({}, style))).toHaveProperty('maxHeight', undefined)
    expect(withTiming).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
  })

  test.each([120, '50%'])('auto 与 %s 之间直接切换，不触发类型警告', (value) => {
    const style = { transition: 'width 300ms' }
    expect(renderStyle(style).width).toBe('auto')
    expect(renderStyle(Object.assign({}, style, { width: value })).width).toBe(value)
    expect(renderStyle(Object.assign({}, style)).width).toBe('auto')
    expect(withTiming).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
  })

  test('零时长与正时长切换仍追踪同一属性，并保留 delay', () => {
    renderStyle({ transition: 'max-height 0s', maxHeight: 120 })
    renderStyle({ transition: 'max-height 300ms 100ms', maxHeight: 240 })
    expect(withTiming).toHaveBeenLastCalledWith(240, expect.objectContaining({ duration: 300 }))
    expect(withDelay).toHaveBeenLastCalledWith(100, 240)
    jest.clearAllMocks()
    expect(renderStyle({ transition: 'max-height 0s', maxHeight: 360 }).maxHeight).toBe(360)
    expect(withTiming).not.toHaveBeenCalled()
    expect(withDelay).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
  })

  test('其他属性仍使用有效默认值', () => {
    expect(renderStyle({ transition: 'opacity 300ms' }).opacity).toBe(1)
    renderStyle({ transition: 'opacity 300ms', opacity: 0.5 })
    expect(withTiming).toHaveBeenCalledWith(0.5, expect.objectContaining({ duration: 300 }))
  })

  test('动画 API 未声明的定位属性仍从零执行动画', () => {
    function Animation () {
      useAnimationAPIHooks({
        style: {},
        animation: {
          id: 1,
          actions: [{
            animatedOption: { duration: 300 },
            rules: new Map([['left', 120]]),
            transform: new Map()
          }]
        }
      })
      return null
    }
    act(() => { renderer = create(createElement(Animation)) })
    expect(withTiming).toHaveBeenCalledWith(120, expect.objectContaining({ duration: 300 }), expect.any(Function))
    expect(mockReadStyle().left).toBe(120)
    expect(error).not.toHaveBeenCalled()
  })
})

describe('transition 完成事件', () => {
  test.each([
    ['opacity', 1, 0.5],
    ['transform', [{ translateX: 0 }, { scaleX: 1 }], [{ translateX: 120 }, { scaleX: 2 }]]
  ])('%s 零时长且无延迟时直接更新，不触发完成事件', (property, initial, target) => {
    const key = property as string
    const transitionend = jest.fn()
    renderStyle({ transition: `${key} 0s`, [key]: initial }, transitionend)
    const result = renderStyle({ transition: `${key} 0s`, [key]: target }, transitionend)
    expect(result[key]).toEqual(target)
    expect(withTiming).not.toHaveBeenCalled()
    expect(withDelay).not.toHaveBeenCalled()
    expect(transitionend).not.toHaveBeenCalled()
  })

  test('零时长直接应用原始单位，不进行插值单位转换', () => {
    renderStyle({ transition: 'width 0s', width: '50%' })
    expect(renderStyle({ transition: 'width 0s', width: 120 }).width).toBe(120)
    expect(withTiming).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
  })

  test.each([0, 300])('时长 %sms 且有延迟时保留动画和完成回调', (duration) => {
    const transitionend = jest.fn()
    const transition = `opacity ${duration}ms 100ms`
    renderStyle({ transition, opacity: 1 }, transitionend)
    renderStyle({ transition, opacity: 0.5 }, transitionend)
    expect(withTiming).toHaveBeenCalledWith(0.5, expect.objectContaining({ duration }), expect.any(Function))
    expect(withDelay).toHaveBeenCalledWith(100, 0.5)
    expect(transitionend).not.toHaveBeenCalled()
    const onComplete = (withTiming as jest.Mock).mock.calls[0][2]
    onComplete(true, 0.5)
    expect(transitionend).toHaveBeenCalledTimes(1)
    expect(transitionend).toHaveBeenCalledWith(true, 0.5, duration)
  })

  test('运行中关闭过渡会取消旧动画，不派发完成事件', () => {
    const transitionend = jest.fn()
    renderStyle({ transition: 'opacity 300ms', opacity: 1 }, transitionend)
    renderStyle({ transition: 'opacity 300ms', opacity: 0.5 }, transitionend)
    const onComplete = (withTiming as jest.Mock).mock.calls[0][2]
    jest.clearAllMocks()
    // 模拟 Reanimated 取消动画时返回 finished: false。
    ;(cancelAnimation as jest.Mock).mockImplementationOnce(() => onComplete(false, 0.8))
    expect(renderStyle({ transition: 'opacity 0s', opacity: 0 }, transitionend).opacity).toBe(0)
    expect(cancelAnimation).toHaveBeenCalledTimes(1)
    expect(withTiming).not.toHaveBeenCalled()
    expect(transitionend).not.toHaveBeenCalled()
  })
})
