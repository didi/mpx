/// <reference types="jest" />

// 覆盖 useTransformStyle 内的 font 简写专用 transform。
// transformFont 与 transformFlex 一样仅在内部经标志位调用，故通过 useTransformStyle 间接测试。

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

// useTransformStyle 内部使用 useState / useRef / useContext / useEffect 等 hook：
// 用 thin 版替换，避免引入 react-test-renderer 仍能在普通函数环境调用。
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

const run = (style: Record<string, any>) => {
  const { normalStyle } = useTransformStyle(style, {
    enableVar: false,
    parentFontSize: 16,
    parentWidth: 375,
    parentHeight: 667
  })
  return normalStyle
}

describe('useTransformStyle font shorthand', () => {
  test('expands full ordered font with unit-less line-height multiplied by fontSize', () => {
    // RN lineHeight 不接受百分比；unit-less 数字按规范 = fontSize * 倍数（复用 resolvePercent）
    expect(run({ font: 'italic bold 16px/1.5 Arial' })).toEqual({
      fontSize: 16,
      fontStyle: 'italic',
      fontWeight: 'bold', // transformStringify 保留 string 'bold'
      lineHeight: 24, // 16 * 1.5
      fontFamily: 'Arial'
    })
  })

  test('expands font with spaced slash line-height', () => {
    expect(run({ font: '16px / 1.5 Arial' })).toEqual({
      fontSize: 16,
      lineHeight: 24,
      fontFamily: 'Arial'
    })
  })

  test('resolves explicit percent line-height against fontSize', () => {
    // CSS 规范允许 `font: 16px/120% Arial`；resolvePercent 直接消化 % 字符串
    expect(run({ font: '16px/120% Arial' })).toEqual({
      fontSize: 16,
      lineHeight: 19.2, // 16 * 1.2
      fontFamily: 'Arial'
    })
  })

  test('percent fontSize resolves via parent-font-size and propagates to line-height', () => {
    // font 的 fontSize 槽位本身可能是 %（如 50% 表示 parentFontSize 的一半）。
    // transformFont 内部就地用 resolvePercent 解析 fontSize %（透传外层 percentConfig 拿到 parentFontSize）：
    //   fontSize: '50%' → 50/100 * parentFontSize(16) = 8
    // 再用解析后的 fontSize 作为 lineHeight 倍数基数：1.5 → '150%' → 8 * 1.5 = 12
    expect(run({ font: '50%/1.5 Arial' })).toEqual({
      fontSize: 8,
      lineHeight: 12,
      fontFamily: 'Arial'
    })
  })

  test('expands minimal font (size + family)', () => {
    expect(run({ font: '28px PingFangSC-Regular' })).toEqual({
      fontSize: 28,
      fontFamily: 'PingFangSC-Regular'
    })
  })

  test('recognises small-caps as font-variant (string passthrough)', () => {
    // RN processFontVariant 接受字符串、内部 split 为数组
    expect(run({ font: 'small-caps 16px Arial' })).toEqual({
      fontSize: 16,
      fontVariant: 'small-caps',
      fontFamily: 'Arial'
    })
  })

  test('disambiguates numeric font-weight from font-size', () => {
    // unit-less 数字（500）既匹配 length 又匹配 font-weight 白名单；
    // transformFont 必须先排除 font-weight 才能识别 28px 为 fontSize
    expect(run({ font: 'small-caps 500 28px/40px PingFangSC-Regular' })).toEqual({
      fontSize: 28,
      fontVariant: 'small-caps',
      fontWeight: '500', // transformStringify 把 number 化 fontWeight 转 string
      lineHeight: 40,
      fontFamily: 'PingFangSC-Regular'
    })
  })

  test('drops the whole font when font-family is missing', () => {
    // 缺必填 font-family → 整体丢弃；font key 被删除、不展开任何 font*
    expect(run({ font: '16px' })).toEqual({})
  })

  test('drops the whole font when font-size is missing', () => {
    expect(run({ font: 'italic Arial' })).toEqual({})
  })

  test('warns and ignores unsupported token but keeps the rest', () => {
    // condensed (font-stretch) 是可选槽位 → 忽略该 token、保留其余，不整体丢弃
    expect(run({ font: 'condensed 16px Arial' })).toEqual({
      fontSize: 16,
      fontFamily: 'Arial'
    })
  })

  test('explicit long-form prop wins over expanded font shorthand', () => {
    // 长属性优先：font 展开「不覆盖」原则
    expect(run({ font: 'italic bold 16px Arial', fontWeight: '900' })).toEqual({
      fontSize: 16,
      fontStyle: 'italic',
      fontWeight: '900',
      fontFamily: 'Arial'
    })
  })

  test('explicit fontSize wins as line-height base when both font and font-size are present', () => {
    // 与「长属性不覆盖简写」一致：用户已显式写 fontSize 时，
    // line-height 倍数也按 user fontSize 算，而不是 font 简写里的 16px
    // 注：生产链路 styleHelperMixin.transformStyleObj 会把所有单值长属性经 __formatValue 归一为 number，
    // 故 useTransformStyle 收到的 fontSize 必为 number；测试同口径传 number 24 而非 '24px' 字符串
    expect(run({ font: '16px/1.5 Arial', fontSize: 24 })).toEqual({
      fontSize: 24, // 长属性原样保留
      lineHeight: 36, // 24 * 1.5
      fontFamily: 'Arial'
    })
  })

  test('strips quotes and takes first family from comma list', () => {
    expect(run({ font: '16px "PingFang SC", Arial' })).toEqual({
      fontSize: 16,
      fontFamily: 'PingFang SC'
    })
  })
})
