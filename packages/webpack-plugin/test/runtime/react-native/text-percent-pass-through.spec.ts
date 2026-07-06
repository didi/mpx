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
}, { virtual: false })

jest.mock('react-native-gesture-handler', () => ({
  Gesture: { Tap: () => ({}), Pan: () => ({}), LongPress: () => ({}) }
}), { virtual: false })

jest.mock('react-native-safe-area-context', () => ({
  initialWindowMetrics: { insets: { top: 0, right: 0, bottom: 0, left: 0 } }
}), { virtual: false })

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
  resolveTextPercentStyle,
  useTextPassThrough,
  useTransformStyle
} from '../../../lib/runtime/components/react/utils'
// eslint-disable-next-line import/first
import MpxText from '../../../lib/runtime/components/react/mpx-text'
// eslint-disable-next-line import/first
import MpxSimpleText from '../../../lib/runtime/components/react/mpx-simple-text'

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

  test('resolveTextPercentStyle uses inherited fontSize, current fontSize, then 16 fallback', () => {
    expect(resolveTextPercentStyle({
      fontSize: '50%' as any,
      lineHeight: '150%' as any
    }, { fontSize: 20 })).toEqual({
      fontSize: 10,
      lineHeight: 15
    })

    expect(resolveTextPercentStyle({
      lineHeight: '150%' as any
    })).toEqual({
      lineHeight: 24
    })

    expect(resolveTextPercentStyle({
      fontSize: '50%' as any,
      lineHeight: '150%' as any
    })).toEqual({
      fontSize: 8,
      lineHeight: 12
    })
  })

  test('number lineHeight stays an absolute RN value', () => {
    expect(resolveTextPercentStyle({
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
        lineHeight: 15
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
      lineHeight: 30
    })
  })

  test('mpx-simple-text keeps lightweight inherited text pass-through behavior', () => {
    mockTextContext = {
      textStyle: { fontSize: 20, color: 'red' },
      pendingTextProps: { numberOfLines: 1 }
    }
    const child = createElement('View', null)

    const result = (MpxSimpleText as any)({
      style: {
        color: 'blue'
      },
      children: child
    })
    const provider = result.children[0]

    expect(result.props.style).toEqual({
      fontSize: 20,
      color: 'blue'
    })
    expect(provider.props.value.textStyle).toEqual({
      fontSize: 20,
      color: 'blue'
    })
  })
})
