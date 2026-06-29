/// <reference types="jest" />

// 这一组用例覆盖 useTransformStyle 对 `gap` / `row-gap` / `column-gap` 百分比的解析：
// - 长属性 `rowGap` / `columnGap` 走 visitOther → transformPercent 主流程；
//   rowGap 基 parentHeight、columnGap 基 parentWidth；
// - 简写 `gap: 50%` / `gap: 10px 50%` 由 transformShorthand 写回阶段就地 resolvePercent；
// - 三者最终落给 RN 的值都是 number（RN 严格要求 gap 系列为 number）。

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

// 与 use-transform-style-default.spec.ts 一致：把 React hook 替换成可在普通函数里调用的 thin 版，
// 让纯样式 transformation 的判断可以不挂载组件直接验证。
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

const run = (style: Record<string, any>, parent: { parentWidth?: number, parentHeight?: number } = {}) => {
  // 与生产 __getStyle 数据流一致：用户样式先经 styleHelperMixin.ios.js 的 transformStyleObj 归一再进 useTransformStyle
  const { normalStyle } = useTransformStyle(transformStyleObj(style), {
    enableVar: false,
    parentFontSize: 16,
    parentWidth: parent.parentWidth ?? 200,
    parentHeight: parent.parentHeight ?? 400
  })
  return normalStyle
}

describe('useTransformStyle gap percent resolution', () => {
  describe('long-form rowGap / columnGap percent', () => {
    test('rowGap percent resolves against parentHeight', () => {
      expect(run({ rowGap: '50%' })).toEqual({ rowGap: 200 })
    })

    test('columnGap percent resolves against parentWidth', () => {
      expect(run({ columnGap: '50%' })).toEqual({ columnGap: 100 })
    })

    test('explicit long-form percent + non-percent stay numeric', () => {
      expect(run({ rowGap: '25%', columnGap: 8 })).toEqual({ rowGap: 100, columnGap: 8 })
    })
  })

  describe('gap shorthand percent', () => {
    test('single percent value expands to rowGap / columnGap with respective base', () => {
      expect(run({ gap: '50%' })).toEqual({ rowGap: 200, columnGap: 100 })
    })

    test('mixed length / percent values expand per slot', () => {
      expect(run({ gap: '10px 50%' })).toEqual({ rowGap: 10, columnGap: 100 })
      expect(run({ gap: '50% 10px' })).toEqual({ rowGap: 200, columnGap: 10 })
    })
  })
})
