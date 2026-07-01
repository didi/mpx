/// <reference types="jest" />

// 这一组用例覆盖 useTransformStyle 对 border / outline 清除语义的最终处理：
// - 简写先正常展开并保留 style: 'none'
// - CSS var 先解析成最终值
// - 末尾统一将 borderStyle / outlineStyle: 'none' 转换为对应 width: 0

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

// 与同目录其它 useTransformStyle 用例一致：用 thin hook 替换，避免引入 react-test-renderer
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
  // 与生产 __getStyle 数据流一致：用户样式先过 styleHelperMixin.ios.js 的 transformStyleObj 归一
  // （'1px' → 1、lineHeight → %、flex 原样），再进 useTransformStyle
  const { normalStyle } = useTransformStyle(transformStyleObj(style), {
    enableVar: false,
    parentFontSize: 16,
    parentWidth: 375,
    parentHeight: 667
  })
  return normalStyle
}

describe('useTransformStyle border-style / outline-style none final clearing', () => {
  test('borderStyle: "none" long-form collapses to borderWidth: 0', () => {
    // 与 border 简写口径对齐：CSS 规范 border-style: none ≡ 无边框
    expect(run({ borderStyle: 'none' })).toEqual({ borderWidth: 0 })
  })

  test('borderStyle long-form wins over border shorthand expansion', () => {
    // 长属性 > 简写：先展开 border → { borderWidth: 1, borderStyle: 'solid', borderColor: 'red' }，
    // borderStyle: none 末尾改写为 borderWidth: 0，撤销简写
    // 注：border 命中 boxSizingAffectingStyleMap → transformBoxSizing 兜底注入 boxSizing 默认值
    expect(run({ border: '1px solid red', borderStyle: 'none' })).toEqual({
      borderWidth: 0,
      borderColor: 'red',
      boxSizing: 'content-box'
    })
  })

  test('explicit borderStyle long-form fills the style slot left default by width-only border shorthand', () => {
    // 真实数据流：`border: 1px` 经 __getStyle 的 transformStyleObj → __formatValue 换算为 number 1 后才进 useTransformStyle，
    // 故这里用 number 1 而非 '1px' 模拟入参（用字符串会绕过真实链路、掩盖单值 number 简写未展开的问题）。
    // border: 1 仅占 width 槽，style 槽由简写补齐为 none；borderStyle: solid 长属性先于默认占位，
    // 经 hasOwn 守卫保留 solid，最终不触发 none 折叠。
    // 注：border 命中 boxSizingAffectingStyleMap → transformBoxSizing 兜底注入 boxSizing 默认值
    expect(run({ border: 1, borderStyle: 'solid' })).toEqual({
      borderWidth: 1,
      borderStyle: 'solid',
      boxSizing: 'content-box'
    })
  })

  test('numeric single-value border shorthand expands to borderWidth (regression: border: 1px)', () => {
    // 单值 number border 必须展开为 borderWidth，缺省补 borderStyle: none → 末尾折叠为 borderWidth: 0；
    // 修复前 number 非 0 单值会原样残留为 RN 不认识的 border key
    expect(run({ border: 1 })).toEqual({
      borderWidth: 0,
      boxSizing: 'content-box'
    })
    // border: 0 单值同样展开（原本就支持的分支，确保未被破坏）
    expect(run({ border: 0 })).toEqual({
      borderWidth: 0,
      boxSizing: 'content-box'
    })
  })

  test('border shorthand without style collapses unless explicit borderStyle is provided', () => {
    expect(run({ border: '1px red' })).toEqual({
      borderWidth: 0,
      borderColor: 'red',
      boxSizing: 'content-box'
    })
    expect(run({ border: '1px red', borderStyle: 'dashed' })).toEqual({
      borderWidth: 1,
      borderColor: 'red',
      borderStyle: 'dashed',
      boxSizing: 'content-box'
    })
  })

  test('non-none borderStyle long-form is untouched', () => {
    expect(run({ borderStyle: 'dashed' })).toEqual({ borderStyle: 'dashed' })
  })

  test('borderStyle resolved from css var collapses to borderWidth: 0', () => {
    expect(run({ '--bs': 'none', borderStyle: 'var(--bs)' })).toEqual({ borderWidth: 0 })
  })

  test('side border shorthand with none clears side widths after final runtime transform', () => {
    expect(run({ borderTop: 'none' })).toEqual({
      borderWidth: 0,
      boxSizing: 'content-box'
    })
    expect(run({ borderLeft: 'red none' })).toEqual({
      borderWidth: 0,
      borderColor: 'red',
      boxSizing: 'content-box'
    })
  })

  test('outline shorthand none/0/mixed-none collapses to outlineWidth: 0', () => {
    expect(run({ outline: 'none' })).toEqual({ outlineWidth: 0 })
    expect(run({ outline: '0' })).toEqual({ outlineWidth: 0 })
    expect(run({ outline: '1px none red' })).toEqual({ outlineWidth: 0, outlineColor: 'red' })
  })

  test('outlineStyle: "none" long-form collapses to outlineWidth: 0', () => {
    expect(run({ outlineStyle: 'none' })).toEqual({ outlineWidth: 0 })
  })

  test('outlineStyle resolved from css var collapses to outlineWidth: 0', () => {
    expect(run({ '--os': 'none', outlineStyle: 'var(--os)' })).toEqual({ outlineWidth: 0 })
  })

  test('explicit long-form wins over shorthand expansion (outline + outlineStyle: none)', () => {
    // CSS 顺序在 RN 不可表达，约定长属性 > 简写：
    // 简写先展开为 { outlineWidth: 1, outlineStyle: 'solid', outlineColor: 'red' }，
    // 长属性 outlineStyle: none 末尾改写为 outlineWidth: 0，最终撤销简写
    expect(run({ outline: '1px solid red', outlineStyle: 'none' })).toEqual({
      outlineWidth: 0,
      outlineColor: 'red'
    })
  })

  test('non-none outlineStyle long-form is untouched', () => {
    // 仅 'none' 命中短路，其它 outline-style 值保持原样
    expect(run({ outlineStyle: 'dotted' })).toEqual({ outlineStyle: 'dotted' })
  })
})
