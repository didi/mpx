/// <reference types="jest" />

// 这一组用例覆盖 useTransformStyle 的 defaultStyle 兜底逻辑：
// - default 必须在 user transform 链路（含 shorthand 展开）之后再合并；
// - user 已写的同名长属性（含 user 简写展开后的 key）优先于 default；
// - default 中的 box-sizing 影响样式应能扩展 hasBoxSizingAffectingStyle，
//   并触发 transformBoxSizing 的兜底；
// - user 显式 boxSizing 在 default 合并后仍然胜出。

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

// useTransformStyle 内部使用 useState / useRef / useContext / useEffect 等 hook。
// 这里没有引入 react-test-renderer，所以把 hook 替换为可在普通函数环境中调用的 thin 版，
// 让纯样式 transformation 的判断可以无需挂载 React 组件直接验证。
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

const run = (style: Record<string, any>, defaultStyle?: Record<string, any>) => {
  // 与生产 __getStyle 数据流一致：用户样式先经 styleHelperMixin.ios.js 的 transformStyleObj 归一
  // 再进 useTransformStyle；defaultStyle 是组件侧用 RN-style 直传，不走 transformStyleObj
  const { normalStyle } = useTransformStyle(transformStyleObj(style), {
    enableVar: false,
    parentFontSize: 16,
    parentWidth: 375,
    parentHeight: 667,
    defaultStyle
  })
  return normalStyle
}

describe('useTransformStyle defaultStyle merge', () => {
  describe('user shorthand vs default long-form', () => {
    test('user `border: 0` overrides default borderWidth (visually no border)', () => {
      // 修复目标：原本 default 的 borderWidth/borderStyle/borderColor 在合并阶段
      // 已经塞进 styleObj，user 的 `border: 0` 简写展开时 borderWidth 已存在被跳过，
      // 边框无法清除。修复后 borderWidth 正确变成 0；borderStyle/borderColor 则由
      // default 兜底（RN 在 borderWidth=0 下不会渲染边框，视觉上"边框消失"）。
      const result = run(
        { border: '0' },
        { borderWidth: 1, borderStyle: 'solid', borderColor: 'red' }
      )
      expect(result.borderWidth).toBe(0)
    })

    test('user `border: none` clears borderWidth before default style merge', () => {
      const result = run(
        { border: 'none' },
        { borderWidth: 1, borderStyle: 'solid', borderColor: 'red' }
      )
      expect(result.borderWidth).toBe(0)
    })

    test('user `border: 2px dashed blue` overrides all default border props', () => {
      const result = run(
        { border: '2px dashed blue' },
        { borderWidth: 1, borderStyle: 'solid', borderColor: 'red' }
      )
      expect(result.borderWidth).toBe(2)
      expect(result.borderStyle).toBe('dashed')
      expect(result.borderColor).toBe('blue')
    })

    test('user `flex-flow: column nowrap` overrides default flexDirection/flexWrap', () => {
      const result = run(
        { flexFlow: 'column nowrap' },
        { flexDirection: 'row', flexWrap: 'wrap' }
      )
      expect(result.flexDirection).toBe('column')
      expect(result.flexWrap).toBe('nowrap')
    })

    test('user `margin: 0` clears default marginHorizontal-derived sides', () => {
      // mpx-button default 含 marginHorizontal: 'auto'。RN runtime 上 marginHorizontal
      // 不在 runtimeAbbreviationMap 里，但 user margin 简写会展开成四个方向并优先生效。
      const result = run(
        { margin: 0 as any },
        { marginLeft: 'auto', marginRight: 'auto' }
      )
      // margin: 0 是 number，transformShorthand 不会处理（保留原值）。
      // 这里更关心 default 的 marginLeft/marginRight 被保留时不会污染 user 的 margin。
      expect(result.margin).toBe(0)
      expect(result.marginLeft).toBe('auto')
      expect(result.marginRight).toBe('auto')
    })

    test('user `margin: 1px 2px 3px 4px` shorthand expands and wins over default sides', () => {
      const result = run(
        { margin: '1px 2px 3px 4px' },
        { marginTop: 99, marginBottom: 99 }
      )
      expect(result.marginTop).toBe(1)
      expect(result.marginRight).toBe(2)
      expect(result.marginBottom).toBe(3)
      expect(result.marginLeft).toBe(4)
    })

    test('user explicit long-form (`border-width: 0`) only overrides matching default long-form', () => {
      // user 仅 borderWidth，default 的 borderStyle/borderColor 仍兜底
      const result = run(
        { borderWidth: 0 } as any,
        { borderWidth: 1, borderStyle: 'solid', borderColor: 'red' }
      )
      expect(result.borderWidth).toBe(0)
      expect(result.borderStyle).toBe('solid')
      expect(result.borderColor).toBe('red')
    })
  })

  describe('default fills missing keys', () => {
    test('user has no overlap with default → default fully applied', () => {
      const result = run({ width: 100 }, { flexDirection: 'row', flexWrap: 'wrap' })
      expect(result.width).toBe(100)
      expect(result.flexDirection).toBe('row')
      expect(result.flexWrap).toBe('wrap')
    })

    test('image-style defaults: user width only → default height fills in', () => {
      const result = run({ width: 100 }, { width: 320, height: 240 })
      expect(result.width).toBe(100)
      expect(result.height).toBe(240)
    })

    test('no defaultStyle is a no-op (matches pre-fix behavior)', () => {
      const result = run({ width: 50 })
      expect(result).toEqual({ width: 50 })
    })
  })

  describe('hasBoxSizingAffectingStyle extends to default keys', () => {
    test('user has no padding/border, but default has → boxSizing fallback applied', () => {
      // mpx-button default 含 borderWidth: 1 → 应触发 transformBoxSizing
      const result = run({ width: 100 }, { borderWidth: 1, borderStyle: 'solid' })
      expect(result.boxSizing).toBe('content-box')
    })

    test('neither user nor default has box-sizing affecting style → no boxSizing', () => {
      const result = run({ width: 100 }, { flexDirection: 'row' })
      expect(result.boxSizing).toBeUndefined()
    })

    test('user explicit boxSizing wins after default merge', () => {
      const result = run({ boxSizing: 'border-box', padding: 4 } as any, { borderWidth: 1 })
      expect(result.boxSizing).toBe('border-box')
    })

    test('default explicit boxSizing wins when user has none', () => {
      const result = run({ width: 100 }, { borderWidth: 1, boxSizing: 'border-box' })
      expect(result.boxSizing).toBe('border-box')
    })
  })

  describe('default mutation safety', () => {
    test('default object is not mutated by transform pipeline', () => {
      const defaultStyle = { borderWidth: 1, borderStyle: 'solid', borderColor: 'red' }
      const snapshot = { ...defaultStyle }
      run({ border: '2px dashed blue' }, defaultStyle)
      expect(defaultStyle).toEqual(snapshot)
    })
  })
})
