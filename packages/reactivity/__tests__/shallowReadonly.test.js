import { isReactive, isReadonly, readonly, shallowReadonly } from '../src'

describe('reactivity/shallowReadonly', () => {
  test('should not make non-reactive properties reactive', () => {
    const props = shallowReadonly({ n: { foo: 1 } })
    expect(isReactive(props.n)).toBe(false)
  })

  test('should make root level properties readonly', () => {
    const props = shallowReadonly({ n: 1 })
    props.n = 2
    expect(props.n).toBe(1)
    expect(
      'Set operation on key "n" failed: target is readonly.'
    ).toHaveBeenWarned()
  })

  // to retain 2.x behavior.
  test('should NOT make nested properties readonly', () => {
    const props = shallowReadonly({ n: { foo: 1 } })

    props.n.foo = 2
    expect(props.n.foo).toBe(2)
    expect(
      'Set operation on key "foo" failed: target is readonly.'
    ).not.toHaveBeenWarned()
  })

  test('should differentiate from normal readonly calls', () => {
    const original = { foo: {} }
    const shallowProxy = shallowReadonly(original)
    const reactiveProxy = readonly(original)
    expect(shallowProxy).not.toBe(reactiveProxy)
    expect(isReadonly(shallowProxy.foo)).toBe(false)
    expect(isReadonly(reactiveProxy.foo)).toBe(true)
  })

  test('non-observable values', () => {
    const assertValue = (value) => {
      shallowReadonly(value)
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
    expect(shallowReadonly(p)).toBe(p)
    // eslint-disable-next-line prefer-regex-literals
    const r = new RegExp('')
    expect(shallowReadonly(r)).toBe(r)
    const d = new Date()
    expect(shallowReadonly(d)).toBe(d)
    const m = new Map()
    expect(shallowReadonly(m)).toBe(m)
    const set = new Set()
    expect(shallowReadonly(set)).toBe(set)
    const wm = new WeakMap()
    expect(shallowReadonly(wm)).toBe(wm)
    const ws = new WeakSet()
    expect(shallowReadonly(ws)).toBe(ws)
  })
})
