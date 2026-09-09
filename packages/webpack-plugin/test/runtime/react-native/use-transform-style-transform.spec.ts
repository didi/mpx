/// <reference types="jest" />

jest.mock('react-native', () => ({
  StyleSheet: { hairlineWidth: 1 / 3 },
  Image: class Image {}
}), { virtual: false })

jest.mock('react-native-gesture-handler', () => ({
  Gesture: { Tap: () => ({}), Pan: () => ({}), LongPress: () => ({}) }
}), { virtual: false })

jest.mock('react-native-safe-area-context', () => ({
  initialWindowMetrics: { insets: { top: 0, right: 0, bottom: 0, left: 0 } }
}), { virtual: false })

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
