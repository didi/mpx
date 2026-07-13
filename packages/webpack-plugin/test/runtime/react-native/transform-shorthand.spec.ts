/// <reference types="jest" />

// __mpx_mode__ / __formatValue globals are injected by jest's `setupFiles`
// (see jest.config.json → test/runtime/react-native/setup.js).

// jest.mock calls are hoisted above imports by babel-jest, so the import
// below still sees the stubbed modules at evaluation time.

// react-native ships flow syntax (`import typeof ...`) that babel-jest cannot
// parse without flow preset, and we don't need any of its values for these
// pure-function tests. Stub it to a minimal shape consumed at module load.
jest.mock('react-native', () => ({
  StyleSheet: { hairlineWidth: 1 / 3 },
  Image: class Image {}
}), { virtual: false })

// react-native-gesture-handler is touched by utils.tsx's Gesture import;
// stub to a minimal object so module evaluation does not hit native code.
jest.mock('react-native-gesture-handler', () => ({
  Gesture: { Tap: () => ({}), Pan: () => ({}), LongPress: () => ({}) }
}), { virtual: false })

// react-native-safe-area-context only contributes initialWindowMetrics here.
jest.mock('react-native-safe-area-context', () => ({
  initialWindowMetrics: { insets: { top: 0, right: 0, bottom: 0, left: 0 } }
}), { virtual: false })

// eslint-disable-next-line import/first
import { transformShorthand } from '../../../lib/runtime/components/react/utils'
// eslint-disable-next-line import/first
import { transformStyleObj } from './helpers'

// percentConfig 是必传参数（生产链路由 useTransformStyle 统一注入），
// 不涉及百分比的用例用空对象兜底即可
//
// 生产链路：用户样式先经 styleHelperMixin.ios.js 的 transformStyleObj 归一（lineHeight → %、其他 prop → __formatValue），
// 再喂给 transformShorthand。这里 run helper 同样先过 transformStyleObj，让单测口径与生产一致：
//   - '1px' / '0' / '0px' → number；'50%' / 'none' / 'red' / 多 token 串 → 原样；
//   - 这意味着 single-value composite（如 `margin: '10px'`）在进入 transformShorthand 时已是 number，
//     原本「字符串单值透传」的 case 现在落到「number 单值透传」分支
const run = (
  style: Record<string, any>,
  keys: string[],
  percentConfig: Parameters<typeof transformShorthand>[2] = {}
) => {
  const obj = transformStyleObj(style)
  transformShorthand(obj, keys, percentConfig)
  return obj
}

describe('runtime transformShorthand', () => {
  describe('border shorthand', () => {
    test('expands ordered border', () => {
      expect(run({ border: '1px solid red' }, ['border'])).toEqual({
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'red'
      })
    })

    test('expands unordered border (color first)', () => {
      expect(run({ border: 'red solid 1px' }, ['border'])).toEqual({
        borderColor: 'red',
        borderStyle: 'solid',
        borderWidth: 1
      })
    })

    test('expands unordered side border', () => {
      // RN 不支持单边 border-*-style，shorthand 中的 style 槽位统一展开到 borderStyle；
      // 又因 RN 上单边 border-*-color 在非 solid 风格下不生效，单边 color 也统一展开到 borderColor
      expect(run({ borderTop: 'red solid 1px' }, ['borderTop'])).toEqual({
        borderColor: 'red',
        borderStyle: 'solid',
        borderTopWidth: 1
      })
      expect(run({ borderLeft: 'dashed 2px blue' }, ['borderLeft'])).toEqual({
        borderStyle: 'dashed',
        borderLeftWidth: 2,
        borderColor: 'blue'
      })
    })

    test('partial border shorthand: fill defaults when style is missing', () => {
      // style 存在 → 补 borderWidth: 3（borderColor 由 RN 内置缺省承接，不补）
      expect(run({ border: 'solid' }, ['border'])).toEqual({ borderStyle: 'solid', borderWidth: 3 })
      // styleProp 缺省（border: 2px / borderTop: red）→ 补 borderStyle: none，末尾统一清除
      expect(run({ border: '2px' }, ['border'])).toEqual({ borderWidth: 2, borderStyle: 'none' })
      expect(run({ borderTop: 'red' }, ['borderTop'])).toEqual({
        borderColor: 'red',
        borderTopWidth: 3,
        borderStyle: 'none'
      })
    })

    test('border: none expands for final runtime clearing', () => {
      expect(run({ border: 'none' }, ['border'])).toEqual({ borderStyle: 'none', borderWidth: 3 })
      expect(run({ borderTop: 'none' }, ['borderTop'])).toEqual({ borderStyle: 'none', borderTopWidth: 3 })
    })

    test('border with style=none token keeps tokens for final runtime clearing', () => {
      expect(run({ border: '1px none red' }, ['border'])).toEqual({
        borderWidth: 1,
        borderStyle: 'none',
        borderColor: 'red'
      })
      expect(run({ borderTop: 'red none' }, ['borderTop'])).toEqual({
        borderColor: 'red',
        borderStyle: 'none',
        borderTopWidth: 3
      })
    })

    test('explicit long-form prop wins over expanded shorthand', () => {
      expect(run({ border: 'red solid 1px', borderColor: 'blue' }, ['border'])).toEqual({
        borderColor: 'blue',
        borderStyle: 'solid',
        borderWidth: 1
      })
    })

    test('unknown tokens are dropped while valid tokens and defaults are kept', () => {
      expect(run({ border: 'red unknown 1px' }, ['border'])).toEqual({
        borderColor: 'red',
        borderWidth: 1,
        borderStyle: 'none'
      })
    })

    test('inline number 0 expands for final runtime clearing', () => {
      expect(run({ border: 0 as any }, ['border'])).toEqual({ borderWidth: 0, borderStyle: 'none' })
      expect(run({ borderTop: 0 as any }, ['borderTop'])).toEqual({ borderTopWidth: 0, borderStyle: 'none' })
      expect(run({ border: '0' }, ['border'])).toEqual({ borderWidth: 0, borderStyle: 'none' })
      expect(run({ border: '0px' }, ['border'])).toEqual({ borderWidth: 0, borderStyle: 'none' })
    })

    test('explicit borderWidth long-prop is kept until final runtime clearing', () => {
      expect(run({ border: 0 as any, borderWidth: 5 }, ['border'])).toEqual({ borderWidth: 5, borderStyle: 'none' })
      expect(run({ border: 'none', borderWidth: 5 }, ['border'])).toEqual({ borderWidth: 5, borderStyle: 'none' })
      expect(run({ border: '2px red', borderWidth: 5 }, ['border'])).toEqual({
        borderColor: 'red',
        borderWidth: 5,
        borderStyle: 'none'
      })
    })
  })

  describe('text-decoration shorthand', () => {
    test('expands ordered text-decoration', () => {
      expect(run({ textDecoration: 'underline solid red' }, ['textDecoration'])).toEqual({
        textDecorationLine: 'underline',
        textDecorationStyle: 'solid',
        textDecorationColor: 'red'
      })
    })

    test('expands unordered text-decoration (color first)', () => {
      expect(run({ textDecoration: 'red underline solid' }, ['textDecoration'])).toEqual({
        textDecorationColor: 'red',
        textDecorationLine: 'underline',
        textDecorationStyle: 'solid'
      })
    })

    test('combines underline + line-through into a single value', () => {
      expect(run({ textDecoration: 'underline line-through red' }, ['textDecoration'])).toEqual({
        textDecorationColor: 'red',
        textDecorationLine: 'underline line-through'
      })
    })

    test('text-decoration: none', () => {
      expect(run({ textDecoration: 'none' }, ['textDecoration'])).toEqual({
        textDecorationLine: 'none'
      })
    })

    test('explicit long-form prop wins over expanded shorthand', () => {
      // 已存在的同名长属性不会被简写展开覆盖
      expect(run({ textDecoration: 'underline solid red', textDecorationColor: 'blue' }, ['textDecoration'])).toEqual({
        textDecorationLine: 'underline',
        textDecorationStyle: 'solid',
        textDecorationColor: 'blue'
      })
    })
  })

  describe('flex-flow shorthand', () => {
    test('expands ordered flex-flow', () => {
      expect(run({ flexFlow: 'row wrap' }, ['flexFlow'])).toEqual({
        flexDirection: 'row',
        flexWrap: 'wrap'
      })
    })

    test('expands unordered flex-flow', () => {
      expect(run({ flexFlow: 'wrap row' }, ['flexFlow'])).toEqual({
        flexWrap: 'wrap',
        flexDirection: 'row'
      })
    })
  })

  describe('text-shadow shorthand', () => {
    test('expands full text-shadow', () => {
      expect(run({ textShadow: '1px 2px 3px red' }, ['textShadow'])).toEqual({
        textShadowOffset: { width: 1, height: 2 },
        textShadowRadius: 3,
        textShadowColor: 'red'
      })
    })

    test('color first', () => {
      expect(run({ textShadow: 'red 1px 2px 3px' }, ['textShadow'])).toEqual({
        textShadowColor: 'red',
        textShadowOffset: { width: 1, height: 2 },
        textShadowRadius: 3
      })
    })

    test('without blur', () => {
      expect(run({ textShadow: '1px 2px red' }, ['textShadow'])).toEqual({
        textShadowOffset: { width: 1, height: 2 },
        textShadowColor: 'red'
      })
    })

    test('explicit long-form prop wins over expanded shorthand', () => {
      // 已存在的同名长属性不会被简写展开覆盖（textShadowOffset 整体作为一个 prop 比较）
      expect(
        run(
          {
            textShadow: '1px 2px 3px red',
            textShadowColor: 'blue'
          },
          ['textShadow']
        )
      ).toEqual({
        textShadowOffset: { width: 1, height: 2 },
        textShadowRadius: 3,
        textShadowColor: 'blue'
      })
    })
  })

  describe('composite four-value shorthands', () => {
    test('margin: single value not expanded', () => {
      // Composite single-value shorthands stay native at runtime.
      // 生产链路 transformStyleObj 已把 '10px' 归一为 number 10，transformShorthand 的 composite + 单值短路放过，
      // RN 原生 margin 接受 number DimensionValue
      expect(run({ margin: '10px' }, ['margin'])).toEqual({ margin: 10 })
    })

    test('margin: 1px 2px expands to 4 sides', () => {
      expect(run({ margin: '1px 2px' }, ['margin'])).toEqual({
        marginTop: 1,
        marginRight: 2,
        marginBottom: 1,
        marginLeft: 2
      })
    })

    test('margin: 1px 2px 3px expands to 4 sides', () => {
      expect(run({ margin: '1px 2px 3px' }, ['margin'])).toEqual({
        marginTop: 1,
        marginRight: 2,
        marginBottom: 3,
        marginLeft: 2
      })
    })

    test('margin: 1px 2px 3px 4px expands to 4 sides', () => {
      expect(run({ margin: '1px 2px 3px 4px' }, ['margin'])).toEqual({
        marginTop: 1,
        marginRight: 2,
        marginBottom: 3,
        marginLeft: 4
      })
    })

    test('borderColor: red blue expands to 4 sides', () => {
      expect(run({ borderColor: 'red blue' }, ['borderColor'])).toEqual({
        borderTopColor: 'red',
        borderRightColor: 'blue',
        borderBottomColor: 'red',
        borderLeftColor: 'blue'
      })
    })
  })

  describe('gap shorthand', () => {
    test('single string value is expanded to rowGap / columnGap (number via __formatValue)', () => {
      // 实际生产链路里单值串已在 __getStyle 阶段被 __formatValue 换算为 number；这里直接喂字符串
      // 是为了校验 transformShorthand 自身的兜底行为（多值串 / 其他链路残留场景同此分支）
      expect(run({ gap: '20px' }, ['gap'])).toEqual({ rowGap: 20, columnGap: 20 })
    })

    test('two string values expand to rowGap / columnGap respectively', () => {
      // RN gap / rowGap / columnGap 严格要求 number，多值串原样透传到这里 → 展开后逐 token 经 __formatValue
      expect(run({ gap: '10px 20px' }, ['gap'])).toEqual({ rowGap: 10, columnGap: 20 })
    })

    test('single percent expands to rowGap (parentHeight) / columnGap (parentWidth)', () => {
      // CSS 规范：rowGap 基容器内容高度，columnGap 基内容宽度；gap 单值复制行列后各自取对应基
      expect(run({ gap: '50%' }, ['gap'], { parentWidth: 200, parentHeight: 400 }))
        .toEqual({ rowGap: 200, columnGap: 100 })
    })

    test('mixed percent / length expands per slot with the matching base', () => {
      // 多值串展开成 rowGap / columnGap 后逐 prop 解析：rowGap 基 parentHeight、columnGap 基 parentWidth
      expect(run({ gap: '10px 50%' }, ['gap'], { parentWidth: 200, parentHeight: 400 }))
        .toEqual({ rowGap: 10, columnGap: 100 })
      expect(run({ gap: '50% 10px' }, ['gap'], { parentWidth: 200, parentHeight: 400 }))
        .toEqual({ rowGap: 200, columnGap: 10 })
    })

    test('percent without parent dims is left as-is (resolvePercent base 缺失 → 原样返回)', () => {
      // 生产链路 useTransformStyle 总会注入 percentConfig（含 parentWidth / parentHeight），
      // 这里覆盖 base 缺失（parentWidth / parentHeight 为 undefined）时 resolvePercent 的兜底分支：
      // error 提示后原样返回字符串，避免错误数值。生产链路不会进这条分支。
      expect(run({ gap: '50%' }, ['gap'])).toEqual({ rowGap: '50%', columnGap: '50%' })
    })
  })

  describe('inset shorthand', () => {
    test('single value is passthrough (RN 0.74+ 原生支持单值 DimensionValue)', () => {
      // 编译期 __getStyle 已将单值串经 __formatValue 换算成 number；这里以 number 入参对齐生产链路
      expect(run({ inset: 0 } as any, ['inset'])).toEqual({ inset: 0 })
    })

    test('two values expand to four sides', () => {
      expect(run({ inset: '10px 20px' }, ['inset'])).toEqual({
        top: 10, right: 20, bottom: 10, left: 20
      })
    })

    test('four values expand directly', () => {
      expect(run({ inset: '1px 2px 3px 4px' }, ['inset'])).toEqual({
        top: 1, right: 2, bottom: 3, left: 4
      })
    })

    test('explicit single-side longhand wins over expanded shorthand', () => {
      // 普通展开「长属性不覆盖」原则；与 CSS 源码顺序语义在 RN 无法表达，约定显式单边优先
      expect(run({ inset: '10px 20px', top: 8 }, ['inset'])).toEqual({
        top: 8, right: 20, bottom: 10, left: 20
      })
    })
  })

  describe('outline shorthand', () => {
    test('expands unordered outline', () => {
      expect(run({ outline: '1px solid red' }, ['outline'])).toEqual({
        outlineWidth: 1,
        outlineStyle: 'solid',
        outlineColor: 'red'
      })
    })

    test('expands outline with color first (顺序无关)', () => {
      expect(run({ outline: 'red solid 2px' }, ['outline'])).toEqual({
        outlineColor: 'red',
        outlineStyle: 'solid',
        outlineWidth: 2
      })
    })

    test('expands outline with same defaults as border', () => {
      // outline 与 border 共享 runtimeShorthandDefaultMap：
      // - 缺 outlineWidth → 补 BORDER_MEDIUM_WIDTH(3)
      // - 缺 outlineStyle → 补 outlineStyle: none
      expect(run({ outline: 'solid' }, ['outline'])).toEqual({ outlineStyle: 'solid', outlineWidth: 3 })
      expect(run({ outline: 'solid red' }, ['outline'])).toEqual({
        outlineStyle: 'solid', outlineColor: 'red', outlineWidth: 3
      })
      expect(run({ outline: '2px' }, ['outline'])).toEqual({ outlineWidth: 2, outlineStyle: 'none' })
    })

    test('expands outline none / 0 / mixed none for final runtime clearing', () => {
      expect(run({ outline: 'none' }, ['outline'])).toEqual({ outlineStyle: 'none', outlineWidth: 3 })
      expect(run({ outline: '0' }, ['outline'])).toEqual({ outlineWidth: 0, outlineStyle: 'none' })
      expect(run({ outline: '1px none red' }, ['outline'])).toEqual({
        outlineWidth: 1,
        outlineStyle: 'none',
        outlineColor: 'red'
      })
    })

    test('existing outlineWidth long-form is kept until final runtime clearing', () => {
      expect(run({ outline: 'none', outlineWidth: 4 }, ['outline'])).toEqual({
        outlineWidth: 4,
        outlineStyle: 'none'
      })
    })
  })

  describe('miscellaneous', () => {
    test('non-border numeric shorthand value is left alone', () => {
      // 仅 border / outline 单值 number 走换算展开（runtimeBorderLikeShorthandMap）；
      // 其它简写 key 的 number 值不属于该捷径，原样透传
      expect(run({ flexFlow: 123 as any }, ['flexFlow'])).toEqual({ flexFlow: 123 })
    })

    test('empty shorthandKeys is a no-op', () => {
      expect(run({ border: '1px solid red' }, [])).toEqual({ border: '1px solid red' })
    })

    test('unknown shorthand key is a no-op', () => {
      expect(run({ unknown: '1px solid red' } as any, ['unknown'])).toEqual({
        unknown: '1px solid red'
      })
    })
  })
})
