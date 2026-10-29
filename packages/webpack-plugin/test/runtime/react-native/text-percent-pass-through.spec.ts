/// <reference types="jest" />

let mockTextContext: any

const mockGlobal = global as any
mockGlobal.__mpx_perf__ = false
mockGlobal.__mpx_perf_framework__ = false

jest.mock('react-native', () => {
  const emitter = {
    emit: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() }))
  }
  return {
    Text: 'Text',
    View: 'View',
    DeviceEventEmitter: emitter,
    NativeEventEmitter: jest.fn(() => emitter),
    StyleSheet: {
      hairlineWidth: 1 / 3,
      create: (style: any) => style
    },
    Image: class Image {}
  }
})

jest.mock('react-native-gesture-handler', () => ({
  Gesture: { Tap: () => ({}), Pan: () => ({}), LongPress: () => ({}) }
}))

jest.mock('react-native-safe-area-context', () => ({
  initialWindowMetrics: { insets: { top: 0, right: 0, bottom: 0, left: 0 } }
}))

jest.mock('@mpxjs/perf', () => ({
  scopeStart: jest.fn(() => -1),
  scopeEnd: jest.fn()
}))

jest.mock('react', () => {
  const actual = jest.requireActual('react')
  return Object.assign({}, actual, {
    forwardRef: (render: any) => render,
    createElement: jest.fn((type: any, props: any, ...children: any[]) => ({ type, props, children })),
    useState: (init: any) => [typeof init === 'function' ? init() : init, () => undefined],
    useRef: (init: any) => ({ current: init }),
    useContext: jest.fn(() => mockTextContext),
    useEffect: () => undefined,
    useMemo: (factory: any) => factory(),
    useImperativeHandle: () => undefined,
    useCallback: (fn: any) => fn
  })
})

// eslint-disable-next-line import/first
import { createElement, useContext } from 'react'
// eslint-disable-next-line import/first
import {
  resolveTextFontSizePercentStyle,
  resolveTextLineHeightPercentStyle,
  useTextPassThrough,
  useTransformStyle
} from '../../../lib/runtime/components/react/utils'
// eslint-disable-next-line import/first
import MpxText from '../../../lib/runtime/components/react/mpx-text'
// eslint-disable-next-line import/first
import MpxSimpleText from '../../../lib/runtime/components/react/mpx-simple-text'
// eslint-disable-next-line import/first
import MpxSimpleView from '../../../lib/runtime/components/react/mpx-simple-view'
// eslint-disable-next-line import/first
import MpxInlineText from '../../../lib/runtime/components/react/mpx-inline-text'

const mockedUseContext = useContext as jest.Mock
const mockedCreateElement = createElement as jest.Mock

const runTransform = (style: Record<string, any>) => {
  const { normalStyle } = useTransformStyle(style, {
    enableVar: false,
    parentWidth: 200,
    parentHeight: 400
  })
  return normalStyle
}

describe('text percent pass-through', () => {
  beforeEach(() => {
    mockTextContext = null
    mockedUseContext.mockClear()
    mockedCreateElement.mockClear()
  })

  test('useTransformStyle keeps text fontSize and lineHeight percent for pass-through resolution', () => {
    expect(runTransform({ fontSize: '50%', lineHeight: '150%' })).toEqual({
      fontSize: '50%',
      lineHeight: '150%'
    })
  })

  test('font shorthand keeps percent fontSize and normalizes unit-less line-height', () => {
    expect(runTransform({ font: '50%/1.5 Arial' })).toEqual({
      fontSize: '50%',
      lineHeight: '150%',
      fontFamily: 'Arial'
    })
  })

  test('text percent helpers split fontSize and lineHeight resolution', () => {
    const textStyle = resolveTextFontSizePercentStyle({
      fontSize: '50%' as any,
      lineHeight: '150%' as any
    }, { fontSize: 20 })
    expect(textStyle).toEqual({
      fontSize: 10,
      lineHeight: '150%'
    })

    expect(resolveTextLineHeightPercentStyle(textStyle, { fontSize: 20 })).toEqual({
      fontSize: 10,
      lineHeight: 15
    })

    expect(resolveTextLineHeightPercentStyle({
      lineHeight: '150%' as any
    })).toEqual({
      lineHeight: 24
    })
  })

  test('number lineHeight stays an absolute RN value', () => {
    expect(resolveTextLineHeightPercentStyle({
      fontSize: 16,
      lineHeight: 24
    })).toEqual({
      fontSize: 16,
      lineHeight: 24
    })
  })

  test('useTextPassThrough does not subscribe context when no text pass-through is needed', () => {
    expect(useTextPassThrough()).toBeNull()
    expect(useContext).not.toHaveBeenCalled()
  })

  test('useTextPassThrough resolves text percent after reading inherited text', () => {
    mockTextContext = {
      textStyle: { fontSize: 20, color: 'red' },
      pendingTextProps: { numberOfLines: 1 }
    }

    expect(useTextPassThrough({
      fontSize: '50%' as any,
      lineHeight: '150%' as any
    }, { ellipsizeMode: 'tail' })).toEqual({
      textStyle: {
        fontSize: 10,
        color: 'red',
        lineHeight: '150%'
      },
      pendingTextProps: {
        numberOfLines: 1,
        ellipsizeMode: 'tail'
      }
    })
  })

  test('mpx-text resolves pure text finalStyle with inherited fontSize', () => {
    mockTextContext = {
      textStyle: { fontSize: 20, color: 'red' },
      pendingTextProps: { numberOfLines: 1 }
    }

    const result = (MpxText as any)({
      style: {
        fontSize: '50%',
        lineHeight: '150%'
      },
      children: 'hello'
    }, null)

    expect(result.props.style).toEqual({
      fontSize: 10,
      color: 'red',
      lineHeight: 15
    })
    expect(result.props.numberOfLines).toBe(1)
  })

  test('mpx-text resolves child pass-through from resolved normalStyle', () => {
    mockTextContext = {
      textStyle: { fontSize: 10, color: 'red' }
    }
    const child = createElement('View', null)

    const result = (MpxText as any)({
      style: {
        fontSize: 20,
        lineHeight: '150%',
        color: 'blue'
      },
      children: child
    }, null)
    const provider = result.children[0]

    expect(result.props.style).toEqual({
      fontSize: 20,
      color: 'blue',
      lineHeight: 30
    })
    expect(provider.props.value.textStyle).toEqual({
      fontSize: 20,
      color: 'blue',
      lineHeight: '150%'
    })
  })

  test('two text nodes resolve inherited relative lineHeight with their own fontSize', () => {
    mockTextContext = {
      textStyle: { fontSize: 16, lineHeight: '150%' }
    }

    const first = (MpxText as any)({
      style: { fontSize: 20 },
      children: 'first'
    }, null)
    const second = (MpxText as any)({
      style: { fontSize: 30 },
      children: 'second'
    }, null)

    expect(first.props.style.lineHeight).toBe(30)
    expect(second.props.style.lineHeight).toBe(45)
  })

  test('nested mpx-text keeps relative lineHeight in child pass-through', () => {
    mockTextContext = null
    const child = createElement('View', null)
    const parent = (MpxText as any)({
      style: {
        fontSize: 20,
        lineHeight: '150%'
      },
      children: child
    }, null)
    const provider = parent.children[0]

    expect(parent.props.style.lineHeight).toBe(30)
    expect(provider.props.value.textStyle).toEqual({
      fontSize: 20,
      lineHeight: '150%'
    })

    mockTextContext = provider.props.value
    const nested = (MpxText as any)({
      style: { fontSize: 30 },
      children: 'nested'
    }, null)

    expect(nested.props.style.lineHeight).toBe(45)
  })

  test('font shorthand unit-less lineHeight resolves at final text node', () => {
    mockTextContext = {
      textStyle: runTransform({ font: '20px / 1.5 Arial' })
    }

    const result = (MpxText as any)({
      style: { fontSize: 30 },
      children: 'hello'
    }, null)

    expect(result.props.style).toEqual({
      fontSize: 30,
      lineHeight: 45,
      fontFamily: 'Arial'
    })
  })

  test('absolute inherited lineHeight stays absolute with mixed fontSize', () => {
    mockTextContext = {
      textStyle: { fontSize: 20, lineHeight: 24 }
    }

    const result = (MpxText as any)({
      style: { fontSize: 30 },
      children: 'hello'
    }, null)

    expect(result.props.style.lineHeight).toBe(24)
  })

  test('mpx-simple-text resolves inherited relative lineHeight with local fontSize', () => {
    mockTextContext = {
      textStyle: { fontSize: 20, color: 'red', lineHeight: '150%' },
      pendingTextProps: { numberOfLines: 1 }
    }
    const child = createElement('View', null)

    const result = (MpxSimpleText as any)({
      style: {
        fontSize: 30,
        color: 'blue'
      },
      children: child
    })
    const provider = result.children[0]

    expect(result.props.style).toEqual({
      fontSize: 30,
      color: 'blue',
      lineHeight: 45
    })
    expect(provider.props.value.textStyle).toEqual({
      fontSize: 30,
      color: 'blue',
      lineHeight: '150%'
    })
  })

  test('mpx-inline-text resolves inherited relative lineHeight', () => {
    mockTextContext = {
      textStyle: { fontSize: 20, color: 'red', lineHeight: '150%' },
      pendingTextProps: { numberOfLines: 1 }
    }

    const result = (MpxInlineText as any)({
      children: 'inline'
    })

    expect(result.props.style).toEqual({
      fontSize: 20,
      color: 'red',
      lineHeight: 30
    })
    expect(result.props.numberOfLines).toBe(1)
  })
})

describe('mpx-simple-view native style arrays', () => {
  beforeEach(() => {
    mockTextContext = null
  })

  test('preserves valid nested arrays and transform references', () => {
    const transform = [{ translateX: 0 }, { rotate: '45deg' }]
    const nested = Object.freeze([null, false, undefined, Object.freeze({ transform, padding: 8 })])
    const style = Object.freeze([{ width: 100 }, nested, { width: 200 }])

    const result = (MpxSimpleView as any)({ style })

    expect(result.props.style).toBe(style)
    expect(result.props.style[1][3].transform).toBe(transform)
  })

  test('removes invalid declarations without mutating input or changing array order', () => {
    const valid = Object.freeze({ width: 100 })
    const invalid = Object.freeze({ width: NaN, height: 50, marginTop: 0 })
    const invalidShadow = Object.freeze({ shadowOffset: { width: Infinity, height: 1 }, opacity: 1 })
    const invalidTransform = Object.freeze({ transform: [{ scale: NaN }], width: null, height: undefined })
    const nested = Object.freeze([false, invalidShadow, invalidTransform, valid])
    const style = Object.freeze([valid, invalid, nested, valid])
    const errorHandler = jest.spyOn(mockGlobal.__mpx.config, 'errorHandler')

    const result = (MpxSimpleView as any)({ style })

    expect(result.props.style).toEqual([
      valid,
      { height: 50, marginTop: 0 },
      [false, { opacity: 1 }, { width: null, height: undefined }, valid],
      valid
    ])
    expect(result.props.style).not.toBe(style)
    expect(result.props.style[2]).not.toBe(nested)
    expect(result.props.style[0]).toBe(valid)
    expect(result.props.style[2][3]).toBe(valid)
    expect(result.props.style[3]).toBe(valid)
    expect(invalid.width).toBeNaN()
    expect(invalidShadow.shadowOffset.width).toBe(Infinity)
    expect(invalidTransform.transform[0].scale).toBeNaN()
    expect(errorHandler).toHaveBeenCalledTimes(3)
    errorHandler.mockRestore()
  })
})
