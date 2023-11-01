import {
  readonly,
  isReactive,
  isReadonly,
  effect,
  isProxy,
  reactive
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

  describe('Array', () => {
    it('should make nested values readonly', () => {
      const original = [{ foo: 1 }]
      const wrapped = readonly(original)
      expect(wrapped).not.toBe(original)
      expect(isProxy(wrapped)).toBe(true)
      expect(isReactive(wrapped)).toBe(false)
      expect(isReadonly(wrapped)).toBe(true)
      expect(isReactive(original)).toBe(false)
      expect(isReadonly(original)).toBe(false)
      expect(isReactive(wrapped[0])).toBe(false)
      expect(isReadonly(wrapped[0])).toBe(true)
      expect(isReactive(original[0])).toBe(false)
      expect(isReadonly(original[0])).toBe(false)
      // get
      expect(wrapped[0].foo).toBe(1)
      // has
      expect(0 in wrapped).toBe(true)
      // ownKeys
      expect(Object.keys(wrapped)).toEqual(['0'])
    })

    it('should not allow mutation', () => {
      const wrapped = readonly([{ foo: 1 }])
      wrapped[0] = 1
      expect(wrapped[0]).not.toBe(1)
      expect(
        `Set operation on key "0" failed: target is readonly.`
      ).toHaveBeenWarned()
      wrapped[0].foo = 2
      expect(wrapped[0].foo).toBe(1)
      expect(
        `Set operation on key "foo" failed: target is readonly.`
      ).toHaveBeenWarned()

      // // should block length mutation
      wrapped.length = 0
      expect(wrapped.length).toBe(1)
      expect(wrapped[0].foo).toBe(1)
      expect(
        `Set operation on key "length" failed: target is readonly.`
      ).toHaveBeenWarned()

      // // mutation methods invoke set/length internally and thus are blocked as well
      wrapped.push(2)
      expect(wrapped.length).toBe(1)
      // push triggers two warnings on [1] and .length
      expect(`target is readonly.`).toHaveBeenWarnedTimes(5)
    })

    it('should not trigger effects', () => {
      const wrapped = readonly([{ a: 1 }])
      let dummy
      effect(() => {
        dummy = wrapped[0].a
      })
      expect(dummy).toBe(1)
      wrapped[0].a = 2
      expect(wrapped[0].a).toBe(1)
      expect(dummy).toBe(1)
      expect(`target is readonly`).toHaveBeenWarnedTimes(1)
      wrapped[0] = { a: 2 }
      expect(wrapped[0].a).toBe(1)
      expect(dummy).toBe(1)
      expect(`target is readonly`).toHaveBeenWarnedTimes(2)
    })
  })

  const maps = [Map, WeakMap]
  maps.forEach((Collection) => {
    describe(Collection.name, () => {
      test('should not make nested values readonly', () => {
        const key1 = {}
        const key2 = {}
        const original = new Collection([
          [key1, {}],
          [key2, {}]
        ])
        const wrapped = readonly(original)
        expect(wrapped).toBe(original)

        expect(isProxy(wrapped)).toBe(false)
        expect(isReactive(wrapped)).toBe(false)
        expect(isReadonly(wrapped)).toBe(false)
        expect(isReactive(original)).toBe(false)
        expect(isReadonly(original)).toBe(false)
        expect(isReactive(wrapped.get(key1))).toBe(false)
        expect(isReadonly(wrapped.get(key1))).toBe(false)
        expect(isReactive(original.get(key1))).toBe(false)
        expect(isReadonly(original.get(key1))).toBe(false)
      })

      test('should not allow mutation & not trigger effect', () => {
        const map = readonly(new Collection())
        const key = {}
        let dummy
        effect(() => {
          dummy = map.get(key)
        })
        expect(dummy).toBeUndefined()
        map.set(key, 1)
        expect(dummy).toBeUndefined()
        expect(map.has(key)).toBe(true)
      })

      if (Collection === Map) {
        test('should not retrieve readonly values on iteration', () => {
          const key1 = {}
          const key2 = {}
          const original = new Map([
            [key1, {}],
            [key2, {}]
          ])
          const wrapped = readonly(original)
          expect(wrapped.size).toBe(2)
          for (const [key, value] of wrapped) {
            expect(isReadonly(key)).toBe(false)
            expect(isReadonly(value)).toBe(false)
          }
          wrapped.forEach((value) => {
            expect(isReadonly(value)).toBe(false)
          })
          for (const value of wrapped.values()) {
            expect(isReadonly(value)).toBe(false)
          }
        })

        test('should not retrieve reactive + readonly values on iteration', () => {
          const key1 = {}
          const key2 = {}
          const original = reactive(
            new Map([
              [key1, {}],
              [key2, {}]
            ])
          )
          const wrapped = readonly(original)
          expect(wrapped.size).toBe(2)
          for (const [key, value] of wrapped) {
            expect(isReadonly(key)).toBe(false)
            expect(isReadonly(value)).toBe(false)
            expect(isReactive(key)).toBe(false)
            expect(isReactive(value)).toBe(false)
          }
          wrapped.forEach((value) => {
            expect(isReadonly(value)).toBe(false)
            expect(isReactive(value)).toBe(false)
          })
          for (const value of wrapped.values()) {
            expect(isReadonly(value)).toBe(false)
            expect(isReactive(value)).toBe(false)
          }
        })
      }
    })
  })

  const sets = [Set, WeakSet]
  sets.forEach((Collection) => {
    describe(Collection.name, () => {
      test('should Not make nested values readonly', () => {
        const key1 = {}
        const key2 = {}
        const original = new Collection([key1, key2])
        const wrapped = readonly(original)
        expect(wrapped).toBe(original)
        expect(isProxy(wrapped)).toBe(false)
        expect(isReactive(wrapped)).toBe(false)
        expect(isReadonly(wrapped)).toBe(false)
        expect(isReactive(original)).toBe(false)
        expect(isReadonly(original)).toBe(false)
        expect(wrapped.has(reactive(key1))).toBe(false)
        expect(original.has(reactive(key1))).toBe(false)
      })

      test('should not allow mutation & not trigger effect', () => {
        const set = readonly(new Collection())
        const key = {}
        let dummy
        effect(() => {
          dummy = set.has(key)
        })
        expect(dummy).toBe(false)
        set.add(key)
        expect(dummy).toBe(false)
        expect(set.has(key)).toBe(true)
      })

      if (Collection === Set) {
        test('should not retrieve readonly values on iteration', () => {
          const original = new Collection([{}, {}])
          const wrapped = readonly(original)
          expect(wrapped.size).toBe(2)
          for (const value of wrapped) {
            expect(isReadonly(value)).toBe(false)
          }
          wrapped.forEach((value) => {
            expect(isReadonly(value)).toBe(false)
          })
          for (const value of wrapped.values()) {
            expect(isReadonly(value)).toBe(false)
          }
          for (const [v1, v2] of wrapped.entries()) {
            expect(isReadonly(v1)).toBe(false)
            expect(isReadonly(v2)).toBe(false)
          }
        })
      }
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
