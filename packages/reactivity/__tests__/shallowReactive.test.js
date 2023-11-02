import {
  isReactive,
  isShallow,
  reactive,
  shallowReactive,
  shallowReadonly
} from '../src/reactive'
import { effect } from '../src/effect'
import { ref, isRef } from '../src/ref'

describe('shallowReactive', () => {
  test('should not make non-reactive properties reactive', () => {
    const props = shallowReactive({ n: { foo: 1 } })
    expect(isReactive(props.n)).toBe(false)
  })

  test('should keep reactive properties reactive', () => {
    const props = shallowReactive({ n: reactive({ foo: 1 }) })
    props.n = reactive({ foo: 2 })
    expect(isReactive(props.n)).toBe(true)
  })

  test('should allow shallow and normal reactive for same target', () => {
    const original = { foo: {} }
    const shallowProxy = shallowReactive(original)
    const reactiveProxy = reactive(original)
    expect(shallowProxy).not.toBe(reactiveProxy)
    expect(isReactive(shallowProxy.foo)).toBe(false)
    expect(isReactive(reactiveProxy.foo)).toBe(true)
  })

  test('isShallow', () => {
    expect(isShallow(shallowReactive({}))).toBe(true)
    expect(isShallow(shallowReadonly({}))).toBe(true)
  })

  test('should respect shallow reactive nested inside reactive on reset', () => {
    const r = reactive({ foo: shallowReactive({ bar: {} }) })
    expect(isShallow(r.foo)).toBe(true)
    expect(isReactive(r.foo.bar)).toBe(false)

    r.foo = shallowReactive({ bar: {} })
    expect(isShallow(r.foo)).toBe(true)
    expect(isReactive(r.foo.bar)).toBe(false)
  })

  test('should not unwrap refs', () => {
    const foo = shallowReactive({
      bar: ref(123)
    })
    expect(isRef(foo.bar)).toBe(true)
    expect(foo.bar.value).toBe(123)
  })

  test('should not mutate refs', () => {
    const original = ref(123)
    const foo = shallowReactive({
      bar: original
    })
    expect(foo.bar).toBe(original)
    foo.bar = 234
    expect(foo.bar).toBe(234)
    expect(original.value).toBe(123)
  })

  test('should respect shallow/deep versions of same target on access', () => {
    const original = {}
    const shallow = shallowReactive(original)
    const deep = reactive(original)
    const r = reactive({ shallow, deep })
    expect(r.shallow).toBe(shallow)
    expect(r.deep).toBe(deep)
  })

  test('non-observable values', () => {
    const assertValue = (value) => {
      shallowReactive(value)
      expect(
        `value cannot be made reactive: ${String(value)}`
      ).toHaveBeenWarnedLast()
    }
    // number
    assertValue(1)
    // string
    assertValue('foo')
    // boolean
    assertValue(false)
    // null
    assertValue(null)
    // undefined
    assertValue(undefined)
    // symbol
    const s = Symbol('s')
    assertValue(s)
    // bigint
    const bn = BigInt('9007199254740991')
    assertValue(bn)

    // built-ins should work and return same value
    const p = Promise.resolve()
    expect(shallowReactive(p)).toBe(p)
    // eslint-disable-next-line prefer-regex-literals
    const r = new RegExp('')
    expect(shallowReactive(r)).toBe(r)
    const d = new Date()
    expect(shallowReactive(d)).toBe(d)
    const m = new Map()
    expect(shallowReactive(m)).toBe(m)
    const set = new Set()
    expect(shallowReactive(set)).toBe(set)
    const wm = new WeakMap()
    expect(shallowReactive(wm)).toBe(wm)
    const ws = new WeakSet()
    expect(shallowReactive(ws)).toBe(ws)
  })

  describe('array', () => {
    test('should be reactive', () => {
      const shallowArray = shallowReactive([])
      const a = {}
      let size

      effect(() => {
        size = shallowArray.length
      })

      expect(size).toBe(0)

      shallowArray.push(a)
      expect(size).toBe(1)

      shallowArray.pop()
      expect(size).toBe(0)
    })
    test('should not observe when iterating', () => {
      const shallowArray = shallowReactive([])
      const a = {}
      shallowArray.push(a)

      const spreadA = [...shallowArray][0]
      expect(isReactive(spreadA)).toBe(false)
    })

    test('onTrack on called on objectSpread', () => {
      const onTrackFn = jest.fn()
      const shallowArray = shallowReactive([])
      let a
      effect(
        () => {
          a = Array.from(shallowArray)
        },
        {
          onTrack: onTrackFn
        }
      )

      expect(a).toMatchObject([])
      expect(onTrackFn).toHaveBeenCalled()

      shallowArray[0] = 12
      expect(onTrackFn).toHaveBeenCalledTimes(2)
    })
  })
})
