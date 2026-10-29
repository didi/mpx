/// <reference types="jest" />

jest.mock('react-native', () => ({
  StyleSheet: { hairlineWidth: 1 / 3 },
  Image: class Image {}
}))

jest.mock('react-native-gesture-handler', () => ({
  Gesture: { Tap: () => ({}), Pan: () => ({}), LongPress: () => ({}) }
}))

jest.mock('react-native-safe-area-context', () => ({
  initialWindowMetrics: { insets: { top: 0, right: 0, bottom: 0, left: 0 } }
}))

jest.mock('react', () => {
  const actual = jest.requireActual('react')
  return {
    ...actual,
    useState: (init: any) => [typeof init === 'function' ? init() : init, () => undefined],
    useRef: (init: any) => ({ current: init }),
    useContext: () => undefined,
    useEffect: () => undefined
  }
})

// eslint-disable-next-line import/first
import { useTransformStyle } from '../../../lib/runtime/components/react/utils'
// eslint-disable-next-line import/first
import { transformStyleObj } from './helpers'

const run = (style: Record<string, any>) => {
  // 与生产 __getStyle 数据流一致：用户样式先经 styleHelperMixin.ios.js 的 transformStyleObj 归一再进 useTransformStyle
  const { normalStyle } = useTransformStyle(transformStyleObj(style), {
    enableVar: false,
    parentWidth: 375,
    parentHeight: 667
  })
  return normalStyle
}

describe('useTransformStyle transform', () => {
  const mockGlobal = global as any

  beforeEach(() => {
    jest.spyOn(mockGlobal.__mpx.config, 'errorHandler')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test.each([
    { name: 'string', transform: 'translateX(-50%) translateY(25.5%) translateX(0%) translateY(0)' },
    { name: 'array', transform: [{ translateX: '-50%' }, { translateY: '25.5%' }, { translateX: '0%' }, { translateY: 0 }] }
  ])('preserves percentage translations in $name transforms', ({ transform }) => {
    expect(run({ transform })).toEqual({
      transform: [{ translateX: '-50%' }, { translateY: '25.5%' }, { translateX: '0%' }, { translateY: 0 }]
    })
    expect(mockGlobal.__mpx.config.errorHandler).not.toHaveBeenCalled()
  })

  test.each([
    { name: 'string', transform: 'rotate(1e2deg) rotateX(-2.5E-1rad) skewY(+5e+1deg)' },
    { name: 'array', transform: [{ rotateZ: '1e2deg' }, { rotateX: '-2.5E-1rad' }, { skewY: '+5e+1deg' }] }
  ])('preserves scientific notation angles in $name transforms', ({ transform }) => {
    expect(run({ transform })).toEqual({
      transform: [{ rotateZ: '1e2deg' }, { rotateX: '-2.5E-1rad' }, { skewY: '+5e+1deg' }]
    })
    expect(mockGlobal.__mpx.config.errorHandler).not.toHaveBeenCalled()
  })

  test('rejects non-finite and unparseable numeric values', () => {
    expect(run({
      transform: [
        { translateX: 'null%' }, { translateY: 'NaN%' }, { translateX: 'Infinity%' }, { translateY: `${'9'.repeat(400)}%` },
        { rotateZ: '1e309deg' }, { skewX: '1e309rad' }, { translateX: NaN }, { scaleX: Infinity }, { scaleY: -Infinity },
        { scale: 1 }
      ]
    })).toEqual({ transform: [{ scale: 1 }] })
    expect(mockGlobal.__mpx.config.errorHandler).toHaveBeenCalledTimes(9)
  })

  test('does not repeat native property, unit or matrix length validation', () => {
    const transform = [{ customTransform: 1 }, { translateX: '+.5%' }, { rotateZ: '1e2grad' }, { matrix: [1, 0, 0, 1, 0, 0] }]
    expect(run({ transform })).toEqual({ transform })
    expect(mockGlobal.__mpx.config.errorHandler).not.toHaveBeenCalled()
  })

  test('rejects sparse matrices and non-finite matrix elements', () => {
    const sparseMatrix = new Array(9)
    sparseMatrix[0] = 1
    expect(run({ transform: [{ matrix: sparseMatrix }, { matrix: [1, NaN, 0] }, { matrix: [1, Infinity, 0] }, { scale: 0 }] }))
      .toEqual({ transform: [{ scale: 0 }] })
    expect(mockGlobal.__mpx.config.errorHandler).toHaveBeenCalledTimes(3)
  })

  test.each([false, 1, {}])('drops an invalid transform container %p', (transform) => {
    expect(run({ transform })).toEqual({})
    expect(mockGlobal.__mpx.config.errorHandler).toHaveBeenCalledTimes(1)
  })

  test('converts none to an empty transform array', () => {
    expect(run({ transform: 'none' })).toEqual({ transform: [] })
    expect(mockGlobal.__mpx.config.errorHandler).not.toHaveBeenCalled()
  })

  test('drops invalid transforms while preserving valid angles and zero scales', () => {
    expect(run({ transform: 'translateX(null) rotate(null) matrix(1,,0,1,0,0) rotate( 45deg ) scale(0)' })).toEqual({
      transform: [{ rotateZ: '45deg' }, { scaleX: 0 }, { scaleY: 0 }]
    })
    expect(mockGlobal.__mpx.config.errorHandler).toHaveBeenCalledTimes(3)
  })

  test('filters invalid native transform items while preserving zero', () => {
    expect(run({ transform: [null, {}, { translateX: NaN }, { matrix: [1, 0, 0, 0, 1, 0, null, 0, 1] }, { scaleX: 0 }] })).toEqual({ transform: [{ scaleX: 0 }] })
    expect(mockGlobal.__mpx.config.errorHandler).toHaveBeenCalledTimes(4)
  })

  test('retains null and undefined styles used to clear properties', () => {
    expect(run({ width: null, height: undefined, transform: null })).toEqual({ width: null, height: undefined, transform: null })
    expect(mockGlobal.__mpx.config.errorHandler).not.toHaveBeenCalled()
  })

  test('discards invalid layout values and failed calc results', () => {
    expect(run({ width: NaN, height: 'null%', fontSize: Infinity, marginTop: 'calc(1 / 0)' })).toEqual({})
    expect(mockGlobal.__mpx.config.errorHandler).toHaveBeenCalledTimes(4)
    expect(mockGlobal.__mpx.config.errorHandler).toHaveBeenCalledWith(
      expect.stringContaining('calc(1 / 0) parse error'), undefined,
      expect.objectContaining({ message: 'calc() must resolve to a finite number' })
    )
  })

  test('uses CSS variable fallback when a variable is null', () => {
    expect(run({ '--x': null, transform: 'translateX(var(--x, 12px))' })).toEqual({ transform: [{ translateX: 12 }] })
    expect(mockGlobal.__mpx.config.errorHandler).not.toHaveBeenCalled()
  })

  test('drops translate3d / scale3d z axis instead of emitting unsupported keys', () => {
    expect(run({ transform: 'translate3d(1px, 2px, 3px) scale3d(2, 3, 4)' })).toEqual({
      transform: [
        { translateX: 1 },
        { translateY: 2 },
        { scaleX: 2 },
        { scaleY: 3 }
      ]
    })
  })
})
