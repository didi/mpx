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

const run = (style: Record<string, any>, keys: string[]) => {
  const obj = { ...style }
  transformShorthand(obj, keys)
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
      // RN 不支持单边 border-*-style，shorthand 中的 style 槽位统一展开到 borderStyle
      expect(run({ borderTop: 'red solid 1px' }, ['borderTop'])).toEqual({
        borderTopColor: 'red',
        borderStyle: 'solid',
        borderTopWidth: 1
      })
      expect(run({ borderLeft: 'dashed 2px blue' }, ['borderLeft'])).toEqual({
        borderStyle: 'dashed',
        borderLeftWidth: 2,
        borderLeftColor: 'blue'
      })
    })

    test('partial border shorthand fills only matched slots', () => {
      expect(run({ border: 'solid' }, ['border'])).toEqual({ borderStyle: 'solid' })
      expect(run({ border: '2px' }, ['border'])).toEqual({ borderWidth: 2 })
      expect(run({ borderTop: 'red' }, ['borderTop'])).toEqual({ borderTopColor: 'red' })
    })

    test('border: none short-circuits to borderWidth: 0', () => {
      expect(run({ border: 'none' }, ['border'])).toEqual({ borderWidth: 0 })
      expect(run({ borderTop: 'none' }, ['borderTop'])).toEqual({ borderTopWidth: 0 })
    })

    test('border with style=none token also short-circuits', () => {
      // CSS spec: border-style: none ⇒ no border, drop width/color tokens
      expect(run({ border: '1px none red' }, ['border'])).toEqual({ borderWidth: 0 })
      expect(run({ borderTop: 'red none' }, ['borderTop'])).toEqual({ borderTopWidth: 0 })
    })

    test('explicit long-form prop wins over expanded shorthand', () => {
      expect(run({ border: 'red solid 1px', borderColor: 'blue' }, ['border'])).toEqual({
        borderColor: 'blue',
        borderStyle: 'solid',
        borderWidth: 1
      })
    })

    test('unknown tokens are silently dropped', () => {
      expect(run({ border: 'red unknown 1px' }, ['border'])).toEqual({
        borderColor: 'red',
        borderWidth: 1
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
      // Composite single-value shorthands stay native at runtime
      expect(run({ margin: '10px' }, ['margin'])).toEqual({ margin: '10px' })
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

  describe('miscellaneous', () => {
    test('non-string value is left alone', () => {
      expect(run({ border: 123 as any }, ['border'])).toEqual({ border: 123 })
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
