import {
  readonly,
  isReactive,
  isReadonly,
  effect,
  isProxy
} from '../src'

describe('reactivity/readonly', () => {
  describe('Object', () => {
    it('should make nested values readonly', () => {
      const original = { foo: 1, bar: { baz: 2 } }
      // return a readonly proxy
      const wrapped = readonly(original)

      expect(wrapped).not.toBe(original)
      expect(isProxy(wrapped)).toBe(true)
      expect(isReactive(wrapped)).toBe(false)
      expect(isReadonly(wrapped)).toBe(true)
      expect(isReactive(original)).toBe(false)
      expect(isReadonly(original)).toBe(false)
      expect(isReactive(wrapped.bar)).toBe(false)
      expect(isReadonly(wrapped.bar)).toBe(true)
      expect(isReactive(original.bar)).toBe(false)
      expect(isReadonly(original.bar)).toBe(false)
      // get
      expect(wrapped.foo).toBe(1)
      // has
      expect('foo' in wrapped).toBe(true)
      // ownKeys
      expect(Object.keys(wrapped)).toEqual(['foo', 'bar'])
    })

    it('should not allow mutation', () => {
      const qux = Symbol('qux')
      const original = {
        foo: 1,
        bar: {
          baz: 2
        },
        [qux]: 3
      }
      const wrapped = readonly(original)

      wrapped.foo = 2
      expect(wrapped.foo).toBe(1)
      expect(
        'Set operation on key "foo" failed: target is readonly.'
      ).toHaveBeenWarnedLast()

      wrapped.bar.baz = 3
      expect(wrapped.bar.baz).toBe(2)
      expect(
        'Set operation on key "baz" failed: target is readonly.'
      ).toHaveBeenWarnedLast()

      wrapped[qux] = 4
      expect(wrapped[qux]).toBe(3)
      expect(
        'Set operation on key "Symbol(qux)" failed: target is readonly.'
      ).toHaveBeenWarnedLast()

      delete wrapped.foo
      expect(wrapped.foo).toBe(1)
      expect(
        'Delete operation on key "foo" failed: target is readonly.'
      ).toHaveBeenWarnedLast()

      delete wrapped.bar.baz
      expect(wrapped.bar.baz).toBe(2)
      expect(
        'Delete operation on key "baz" failed: target is readonly.'
      ).toHaveBeenWarnedLast()

      delete wrapped[qux]
      expect(wrapped[qux]).toBe(3)
      expect(
        'Delete operation on key "Symbol(qux)" failed: target is readonly.'
      ).toHaveBeenWarnedLast()
    })

    it('should not trigger effects', () => {
      const wrapped = readonly({ a: 1 })
      let dummy
      effect(() => {
        dummy = wrapped.a
      })
      expect(dummy).toBe(1)
      wrapped.a = 2
      expect(wrapped.a).toBe(1)
      expect(dummy).toBe(1)
      expect('target is readonly').toHaveBeenWarned()
    })
  })

  test('non-observable values', () => {
    const assertValue = (value) => {
      readonly(value)
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
    expect(readonly(p)).toBe(p)
    // eslint-disable-next-line prefer-regex-literals
    const r = new RegExp('')
    expect(readonly(r)).toBe(r)
    const d = new Date()
    expect(readonly(d)).toBe(d)
    const m = new Map()
    expect(readonly(m)).toBe(m)
    const set = new Set()
    expect(readonly(set)).toBe(set)
    const wm = new WeakMap()
    expect(readonly(wm)).toBe(wm)
    const ws = new WeakSet()
    expect(readonly(ws)).toBe(ws)
  })
})
