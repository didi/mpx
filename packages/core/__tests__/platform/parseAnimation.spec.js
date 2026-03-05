/* eslint-env jest */

// 为依赖的 @mpxjs/utils/env 注入运行时 mode
global.__mpx_mode__ = 'ios'

const { parseStyleAnimation, parseStyleTransition } = require('../../src/platform/builtInMixins/parseAnimation')

describe('parseAnimation/parseTransition for Reanimated CSS API', () => {
  // ===== 基础 animation 场景 =====
  test('parseStyleAnimation: simple shorthand with name, duration and timing', () => {
    const style = {
      animation: 'slide-in 3s ease-in'
    }

    const result = parseStyleAnimation(style)

    expect(result).toEqual({
      animationName: 'slide-in',
      animationDuration: '3s',
      animationTimingFunction: 'ease-in'
    })
  })

  test('parseStyleAnimation: animation with sub-properties merged and overriding shorthand', () => {
    const style = {
      animation: 'slide-in 3s ease-in',
      animationTimingFunction: 'ease-out',
      animationFillMode: 'forwards'
    }

    const result = parseStyleAnimation(style)

    expect(result).toEqual({
      animationName: 'slide-in',
      animationDuration: '3s',
      animationTimingFunction: 'ease-out',
      animationFillMode: 'forwards'
    })
  })

  test('parseStyleAnimation: full shorthand with all animation properties', () => {
    const style = {
      animation: '3s ease-in 1s infinite reverse both running slide-in'
    }

    const result = parseStyleAnimation(style)

    expect(result).toEqual({
      animationName: 'slide-in',
      animationDuration: '3s',
      animationTimingFunction: 'ease-in',
      animationDelay: '1s',
      animationIterationCount: 'infinite',
      animationDirection: 'reverse',
      animationFillMode: 'both',
      animationPlayState: 'running'
    })
  })

  test('parseStyleAnimation: decimal duration and ms unit', () => {
    const style = {
      animation: '0.5s linear 200ms infinite alternate slide-in'
    }

    const result = parseStyleAnimation(style)

    expect(result).toEqual({
      animationName: 'slide-in',
      animationDuration: '0.5s',
      animationTimingFunction: 'linear',
      animationDelay: '200ms',
      animationIterationCount: 'infinite',
      animationDirection: 'alternate'
    })
  })

  test('parseStyleAnimation: minimal name + duration', () => {
    const style = {
      animation: 'bounce 2s'
    }

    const result = parseStyleAnimation(style)

    expect(result).toEqual({
      animationName: 'bounce',
      animationDuration: '2s'
    })
  })

  test('parseStyleAnimation: only sub-properties without shorthand', () => {
    const style = {
      animationName: 'slide-in',
      animationDuration: '3s',
      animationTimingFunction: 'ease-in'
    }

    const result = parseStyleAnimation(style)

    expect(result).toEqual({
      animationName: 'slide-in',
      animationDuration: '3s',
      animationTimingFunction: 'ease-in'
    })
  })

  test('parseStyleAnimation: empty style returns empty result', () => {
    const result = parseStyleAnimation({})
    expect(result).toEqual({})
  })

  test('parseStyleTransition: basic shorthand + timing function merge', () => {
    const style = {
      transition: 'margin-right 2s,transform 1s',
      transitionTimingFunction: 'ease, cubic-bezier(0.1, 0.7, 1, 0.1)'
    }

    const result = parseStyleTransition(style)

    expect(result.transitionProperty).toEqual(['marginRight', 'transform'])
    expect(result.transitionDuration).toEqual(['2s', '1s'])

    expect(Array.isArray(result.transitionTimingFunction)).toBe(true)
    expect(result.transitionTimingFunction[0]).toBe('ease')

    const fn = result.transitionTimingFunction[1]
    expect(fn).not.toBe('cubic-bezier(0.1, 0.7, 1, 0.1)')
    expect(typeof fn).toBe('object')
    expect(typeof fn.toString).toBe('function')
  })

  test('parseStyleTransition: steps() and linear() timing functions', () => {
    const style = {
      transition: 'opacity 200ms, transform 150ms',
      transitionTimingFunction: 'steps(4, jump-end), linear(0, 1)'
    }

    const result = parseStyleTransition(style)

    expect(result.transitionProperty).toEqual(['opacity', 'transform'])
    expect(result.transitionDuration).toEqual(['200ms', '150ms'])
    expect(result.transitionTimingFunction).toHaveLength(2)

    const [stepsFn, linearFn] = result.transitionTimingFunction

    expect(typeof stepsFn).toBe('object')
    expect(typeof stepsFn.normalize).toBe('function')

    expect(typeof linearFn).toBe('object')
    expect(typeof linearFn.normalize).toBe('function')
  })

  test('parseStyleAnimation: shorthand with duration, delay, timing function and name', () => {
    const style = {
      animation: '3s ease-out 5s ball-beat'
    }

    const result = parseStyleAnimation(style)

    expect(result.animationName).toBe('ball-beat')
    expect(result.animationDuration).toBe('3s')
    expect(result.animationDelay).toBe('5s')
    expect(result.animationTimingFunction).toBe('ease-out')
  })

  test('parseStyleAnimation: multiple animations and sub-property merge', () => {
    const style = {
      animation: '3s linear ball-beat, 3s ease-out identifier',
      animationDelay: '5s, 6s'
    }

    const result = parseStyleAnimation(style)

    expect(result.animationName).toEqual(['ball-beat', 'identifier'])
    expect(result.animationDuration).toEqual(['3s', '3s'])
    expect(result.animationDelay).toEqual(['5s', '6s'])

    expect(Array.isArray(result.animationTimingFunction)).toBe(true)
    expect(result.animationTimingFunction[0]).toBe('linear')
    expect(result.animationTimingFunction[1]).toBe('ease-out')
  })

  test('parseStyleAnimation: timing function with cubic-bezier/steps/linear inside shorthand', () => {
    const style = {
      animation: '2s cubic-bezier(0.1, 0.7, 1, 0.1) 1s fade, 1s steps(3, start) 0s jump, 500ms linear(0, 1) pulse'
    }

    const result = parseStyleAnimation(style)

    expect(result.animationName).toEqual(['fade', 'jump', 'pulse'])
    expect(result.animationDuration).toEqual(['2s', '1s', '500ms'])
    // 第三个动画未显式 delay，应补齐为前一个值
    expect(result.animationDelay).toEqual(['1s', '0s', '0s'])

    const [bezierFn, stepsFn, linearFn] = result.animationTimingFunction

    expect(typeof bezierFn).toBe('object')
    expect(typeof bezierFn.normalize).toBe('function')

    expect(typeof stepsFn).toBe('object')
    expect(typeof stepsFn.normalize).toBe('function')

    expect(typeof linearFn).toBe('object')
    expect(typeof linearFn.normalize).toBe('function')
  })

  test('parseStyleAnimation: s 和 ms 单位混合', () => {
    const style = {
      animation: '2s ease fadeIn, 150ms ease-out fadeOut'
    }

    const result = parseStyleAnimation(style)

    expect(result.animationName).toEqual(['fadeIn', 'fadeOut'])
    expect(result.animationDuration).toEqual(['2s', '150ms'])
    expect(result.animationTimingFunction).toEqual(['ease', 'ease-out'])
  })

  // ===== 多 animation 场景 =====
  test('parseStyleAnimation: multiple animations basic', () => {
    const style = {
      animation: 'slide-in 3s, fade 1s'
    }

    const result = parseStyleAnimation(style)

    expect(result.animationName).toEqual(['slide-in', 'fade'])
    expect(result.animationDuration).toEqual(['3s', '1s'])
  })

  test('parseStyleAnimation: multiple animations with sub-properties merged', () => {
    const style = {
      animation: 'slide-in 3s, fade 1s',
      animationTimingFunction: 'ease-in, ease-out',
      animationFillMode: 'forwards'
    }

    const result = parseStyleAnimation(style)

    expect(result.animationName).toEqual(['slide-in', 'fade'])
    expect(result.animationDuration).toEqual(['3s', '1s'])
    expect(result.animationTimingFunction).toEqual(['ease-in', 'ease-out'])
    expect(result.animationFillMode).toEqual(['forwards', 'forwards'])
  })

  test('parseStyleAnimation: multiple animations, sub-props override shorthand timing function', () => {
    const style = {
      animation: 'slide-in 3s ease-in, fade 1s ease-out',
      animationTimingFunction: 'linear, linear'
    }

    const result = parseStyleAnimation(style)

    expect(result.animationName).toEqual(['slide-in', 'fade'])
    expect(result.animationDuration).toEqual(['3s', '1s'])
    expect(result.animationTimingFunction).toEqual(['linear', 'linear'])
  })

  test('parseStyleAnimation: single animation, extra sub-prop values are truncated', () => {
    const style = {
      animation: '3s ease-in 1s 2 reverse both paused ball-beat',
      animationDelay: '5s, 6s'
    }

    const result = parseStyleAnimation(style)

    expect(result).toEqual({
      animationName: 'ball-beat',
      animationDuration: '3s',
      animationTimingFunction: 'ease-in',
      animationDelay: '5s',
      animationIterationCount: '2',
      animationDirection: 'reverse',
      animationFillMode: 'both',
      animationPlayState: 'paused'
    })
  })

  test('parseStyleAnimation: three animations', () => {
    const style = {
      animation: '1s fade, 2s slide, 3s bounce'
    }

    const result = parseStyleAnimation(style)

    expect(result.animationName).toEqual(['fade', 'slide', 'bounce'])
    expect(result.animationDuration).toEqual(['1s', '2s', '3s'])
  })

  // ===== timing-function & enums 场景 =====
  test('parseStyleAnimation: all timing-function keywords', () => {
    const timingFunctions = ['ease', 'linear', 'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end']
    timingFunctions.forEach(tf => {
      const result = parseStyleAnimation({ animation: `anim 1s ${tf}` })
      expect(result.animationTimingFunction).toBe(tf)
    })
  })

  test('parseStyleAnimation: all direction values', () => {
    const directions = ['normal', 'reverse', 'alternate', 'alternate-reverse']
    directions.forEach(dir => {
      const result = parseStyleAnimation({ animation: `anim 1s ${dir}` })
      expect(result.animationDirection).toBe(dir)
    })
  })

  test('parseStyleAnimation: all fill-mode values', () => {
    const fillModes = ['none', 'forwards', 'backwards', 'both']
    fillModes.forEach(fm => {
      const result = parseStyleAnimation({ animation: `anim 1s ${fm}` })
      expect(result.animationFillMode).toBe(fm)
    })
  })

  test('parseStyleAnimation: all play-state values', () => {
    const playStates = ['running', 'paused']
    playStates.forEach(ps => {
      const result = parseStyleAnimation({ animation: `anim 1s ${ps}` })
      expect(result.animationPlayState).toBe(ps)
    })
  })

  test('parseStyleAnimation: negative delay is kept', () => {
    const result = parseStyleAnimation({ animation: 'slide-in 3s -1s' })
    expect(result).toEqual({
      animationName: 'slide-in',
      animationDuration: '3s',
      animationDelay: '-1s'
    })
  })

  // ===== transition 场景 =====
  test('parseStyleTransition: simple shorthand', () => {
    const style = {
      transition: 'opacity 3s ease-in 1s'
    }

    const result = parseStyleTransition(style)

    expect(result).toEqual({
      transitionProperty: 'opacity',
      transitionDuration: '3s',
      transitionTimingFunction: 'ease-in',
      transitionDelay: '1s'
    })
  })

  test('parseStyleTransition: minimal property + duration', () => {
    const style = {
      transition: 'opacity 3s'
    }

    const result = parseStyleTransition(style)

    expect(result).toEqual({
      transitionProperty: 'opacity',
      transitionDuration: '3s'
    })
  })

  test('parseStyleTransition: multiple transitions', () => {
    const style = {
      transition: 'opacity 3s, transform 0.5s ease-out'
    }

    const result = parseStyleTransition(style)

    expect(result.transitionProperty).toEqual(['opacity', 'transform'])
    expect(result.transitionDuration).toEqual(['3s', '0.5s'])
    expect(result.transitionTimingFunction).toEqual([undefined, 'ease-out'])
  })

  test('parseStyleTransition: longhand overrides shorthand to match CSS behavior', () => {
    const style = {
      transition: 'margin-right 2s, transform 1s',
      transitionDuration: '1s',
      // transitionDelay: '1s, 0s',
      transitionProperty: 'margin-left',
      marginLeft: 0,
      transitionTimingFunction: 'cubic-bezier(0.1, 0.7, 1, 0.1)'
    }

    const result = parseStyleTransition(style)

    // 最终只对 margin-left 做过渡，其他属性的过渡被覆盖掉
    expect(result.transitionProperty).toBe('marginLeft')
    expect(result.transitionDuration).toBe('1s')

    const easing = result.transitionTimingFunction
    expect(typeof easing).toBe('object')
    expect(typeof easing.toString).toBe('function')
    expect(easing.toString()).toContain('cubic-bezier')
  })

  test('parseStyleTransition: sub-property overrides shorthand delay', () => {
    const style = {
      transition: 'opacity 3s ease-in 1s',
      transitionDelay: '5s'
    }

    const result = parseStyleTransition(style)

    expect(result).toEqual({
      transitionProperty: 'opacity',
      transitionDuration: '3s',
      transitionTimingFunction: 'ease-in',
      transitionDelay: '5s'
    })
  })

  test('parseStyleTransition: shorthand overrides existing duration sub-property', () => {
    const style = {
      transitionDuration: '5s',
      transition: 'opacity 3s'
    }

    const result = parseStyleTransition(style)

    expect(result).toEqual({
      transitionProperty: 'opacity',
      transitionDuration: '3s'
    })
  })

  test('parseStyleTransition: only sub-properties', () => {
    const style = {
      transitionProperty: 'opacity',
      transitionDuration: '3s',
      transitionTimingFunction: 'ease-in'
    }

    const result = parseStyleTransition(style)

    expect(result).toEqual({
      transitionProperty: 'opacity',
      transitionDuration: '3s',
      transitionTimingFunction: 'ease-in'
    })
  })

  test('parseStyleTransition: empty style returns empty result', () => {
    const result = parseStyleTransition({})
    expect(result).toEqual({})
  })

  test('parseStyleTransition: negative delay is kept', () => {
    const result = parseStyleTransition({ transition: 'opacity 3s -500ms' })
    expect(result).toEqual({
      transitionProperty: 'opacity',
      transitionDuration: '3s',
      transitionDelay: '-500ms'
    })
  })

  // ===== 错误场景 =====
  test('parseStyleAnimation: non-object arguments throw', () => {
    const invalidValues = ['slide-in 3s', null, undefined, ['slide-in 3s']]
    invalidValues.forEach(v => {
      expect(() => parseStyleAnimation(v)).toThrow('parseStyleAnimation 参数必须是对象')
    })
  })

  test('parseStyleTransition: non-object arguments throw', () => {
    const invalidValues = ['opacity 3s', null, undefined, ['opacity 3s']]
    invalidValues.forEach(v => {
      expect(() => parseStyleTransition(v)).toThrow('parseStyleTransition 参数必须是对象')
    })
  })

  test('parseStyleAnimation: missing name or duration throws', () => {
    expect(() => parseStyleAnimation({ animation: '3s ease-in' })).toThrow('缺少必需属性 animationName')
    expect(() => parseStyleAnimation({ animation: 'slide-in' })).toThrow('缺少必需属性 animationDuration')
  })

  test('parseStyleTransition: missing property or duration throws', () => {
    expect(() => parseStyleTransition({ transition: '3s ease-in' })).toThrow('缺少必需属性 transitionProperty')
    expect(() => parseStyleTransition({ transition: 'opacity' })).toThrow('缺少必需属性 transitionDuration')
  })
})

