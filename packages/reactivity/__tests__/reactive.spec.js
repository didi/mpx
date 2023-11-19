import { effect } from '../src'
import { reactive, isReactive, toRaw, markRaw } from '../src/reactive'
import { ref, isRef } from '../src/ref'
import { computed } from '../src/computed'
import { set, del } from '../../utils/src/index'

describe('test reactivity/reactive', () => {
  test('Object', () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    expect(observed).not.toBe(original)
    expect(isReactive(observed)).toBe(true)
    expect(isReactive(original)).toBe(false)
    // get
    expect(observed.foo).toBe(1)
    // has
    expect('foo' in observed).toBe(true)
    expect('fn' in observed).toBe(false)
    // ownKeys
    expect(Object.keys(observed)).toEqual(['foo'])
  })

  test('proto', () => {
    const obj = {}
    const reactiveObj = reactive(obj)
    expect(isReactive(reactiveObj)).toBe(true)
    // read prop of reactiveObject will cause reactiveObj[prop] to be reactive
    reactiveObj.__proto__
    const otherObj = { data: ['a'] }
    expect(isReactive(otherObj)).toBe(false)
    const reactiveOther = reactive(otherObj)
    expect(isReactive(reactiveOther)).toBe(true)
    expect(reactiveOther.data[0]).toBe('a')
  })

  test('nested reactives', () => {
    const original = {
      nested: {
        foo: 1
      },
      array: [{ bar: 2 }]
    }
    const observed = reactive(original)
    expect(isReactive(observed.nested)).toBe(true)
    expect(isReactive(observed.array)).toBe(true)
    expect(isReactive(observed.array[0])).toBe(true)
  })

  test('should not observing subtypes of IterableCollections(Map, Set)', () => {
    // subtypes of Map
    class CustomMap extends Map {}
    const cmap = reactive(new CustomMap())

    expect(cmap).toBeInstanceOf(Map)
    expect(isReactive(cmap)).toBe(false)

    cmap.set('key', {})
    expect(isReactive(cmap.get('key'))).toBe(false)

    // subtypes of Set
    class CustomSet extends Set {}
    const cset = reactive(new CustomSet())

    expect(cset).toBeInstanceOf(Set)
    expect(isReactive(cset)).toBe(false)

    let dummy
    effect(() => (dummy = cset.has('value')))
    expect(dummy).toBe(false)
    cset.add('value')
    expect(dummy).toBe(false)
    cset.delete('value')
    expect(dummy).toBe(false)
  })

  test('should not observing subtypes of WeakCollections(WeakMap, WeakSet)', () => {
    // subtypes of WeakMap
    class CustomMap extends WeakMap {}
    const cmap = reactive(new CustomMap())

    expect(cmap).toBeInstanceOf(WeakMap)
    expect(isReactive(cmap)).toBe(false)

    const key = {}
    cmap.set(key, {})
    expect(isReactive(cmap.get(key))).toBe(false)

    // subtypes of WeakSet
    class CustomSet extends WeakSet {}
    const cset = reactive(new CustomSet())

    expect(cset).toBeInstanceOf(WeakSet)
    expect(isReactive(cset)).toBe(false)

    // ======================
    let dummy
    effect(() => (dummy = cset.has(key)))
    expect(dummy).toBe(false)
    cset.add(key)
    expect(dummy).toBe(false)
    cset.delete(key)
    expect(dummy).toBe(false)
  })

  test('observed value should proxy mutations to original (Object)', () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    // set
    observed.bar = 1
    expect(observed.bar).toBe(1)
    expect(original.bar).toBe(1)
    // delete
    delete observed.foo
    expect('foo' in observed).toBe(false)
    expect('foo' in original).toBe(false)
  })

  test('original value change should reflect in observed value (Object)', () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    // set
    original.bar = 1
    expect(original.bar).toBe(1)
    expect(observed.bar).toBe(1)
    // delete
    delete original.foo
    expect('foo' in original).toBe(false)
    expect('foo' in observed).toBe(false)
  })

  test('setting a property with an unobserved value should wrap with reactive', () => {
    const origin = {}
    const observed = reactive(origin)
    const raw = {}
    observed.foo = raw
    // observed.foo 由于被 reactive 了，observed.foo 的值为代理后的对象，因此不等于 raw
    expect(observed.foo).not.toBe(raw)
    expect(isReactive(observed.foo)).toBe(true)
  })

  test('observing already observed value should return same Proxy', () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    const observed2 = reactive(observed)
    expect(observed2).toBe(observed)
  })

  test('observing the same value multiple times should return same Proxy', () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    const observed2 = reactive(original)
    expect(observed2).toBe(observed)
  })

  test('should not pollute original object with Proxies', () => {
    const original = { foo: 1 }
    const original2 = { bar: 2 }
    const observed = reactive(original)
    const observed2 = reactive(original2)
    observed.bar = observed2
    expect(observed.bar).toBe(observed2)
    expect(original.bar).toBe(original2)
  })

  test('toRaw', () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    expect(toRaw(observed)).toBe(original)
    expect(toRaw(original)).toBe(original)
  })

  test('toRaw on object using reactive as prototype', () => {
    const original = reactive({})
    const obj = Object.create(original)
    const raw = toRaw(obj)
    expect(raw).toBe(obj)
    expect(raw).not.toBe(toRaw(original))
  })

  test('should not unwrap Ref<T>', () => {
    const observedNumberRef = reactive(ref(1))
    const observedObjectRef = reactive(ref({ foo: 1 }))

    expect(isRef(observedNumberRef)).toBe(true)
    expect(isRef(observedObjectRef)).toBe(true)
  })

  test('should unwrap computed refs', () => {
    // readonly
    const a = computed(() => 1)
    // writable
    const b = computed({
      get: () => 1,
      set: () => {}
    })
    const obj = reactive({ a, b })
    // check type
    obj.a + 1
    obj.b + 1
    expect(typeof obj.a).toBe('number')
    expect(typeof obj.b).toBe('number')
  })

  test('should allow setting property from a ref to another ref', () => {
    const foo = ref(0)
    const bar = ref(1)
    const observed = reactive({ a: foo })
    const dummy = computed(() => observed.a)
    expect(dummy.value).toBe(0)

    observed.a = bar
    expect(dummy.value).toBe(1)

    bar.value++
    expect(dummy.value).toBe(2)
  })

  test('non-observable values', () => {
    const assertValue = (value) => {
      reactive(value)
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
    expect(reactive(p)).toBe(p)
    // eslint-disable-next-line prefer-regex-literals
    const r = new RegExp('')
    expect(reactive(r)).toBe(r)
    const d = new Date()
    expect(reactive(d)).toBe(d)
    const m = new Map()
    expect(reactive(m)).toBe(m)
    const set = new Set()
    expect(reactive(set)).toBe(set)
    const wm = new WeakMap()
    expect(reactive(wm)).toBe(wm)
    const ws = new WeakSet()
    expect(reactive(ws)).toBe(ws)
  })

  test('markRaw', () => {
    const obj = reactive({
      foo: { a: 1 },
      bar: markRaw({ b: 2 })
    })
    expect(isReactive(obj.foo)).toBe(true)
    expect(isReactive(obj.bar)).toBe(false)
  })

  test('should not observe non-extensible objects', () => {
    const obj = reactive({
      foo: Object.preventExtensions({ a: 1 }),
      // sealed or frozen objects are considered non-extensible as well
      bar: Object.freeze({ a: 1 }),
      baz: Object.seal({ a: 1 })
    })
    expect(isReactive(obj.foo)).toBe(false)
    expect(isReactive(obj.bar)).toBe(false)
    expect(isReactive(obj.baz)).toBe(false)
  })

  test('should not observe objects with __mpx_skip', () => {
    const original = {
      foo: 1,
      __mpx_skip: true
    }
    const observed = reactive(original)
    expect(isReactive(observed)).toBe(false)
  })

  test('Set a property on an reactive object should triggers change', () => {
    const origin = {
      count: 1
    }
    const obj = reactive(origin)
    const spy = jest.fn(() => {
      return obj.num
    })
    effect(spy)

    expect(spy).toHaveBeenCalledTimes(1)
    expect(obj).toEqual({
      count: 1
    })
    expect(origin).toEqual({
      count: 1
    })

    set(obj, 'num', 23)
    expect(obj).toEqual({
      count: 1,
      num: 23
    })
    expect(origin).toEqual({
      count: 1,
      num: 23
    })
    expect(spy).toHaveBeenCalledTimes(2)

    set(obj, 'count', 2)
    expect(obj).toEqual({
      count: 2,
      num: 23
    })
    expect(origin).toEqual({
      count: 2,
      num: 23
    })
    expect(spy).toHaveBeenCalledTimes(2)
  })

  test('Delete a property on an reactive object should triggers change', () => {
    const origin = {
      count: 1
    }
    const obj = reactive(origin)
    const spy = jest.fn(() => {
      return obj.count
    })
    effect(spy)

    expect(obj.count).toBe(1)
    expect(spy).toHaveBeenCalledTimes(1)
    del(obj, 'count')
    expect(obj.count).toBeUndefined()
    expect(origin).toEqual({})
    expect(spy).toHaveBeenCalledTimes(2)

    set(obj, 'count', 2)
    expect(spy).toHaveBeenCalledTimes(3)
    expect(obj.count).toBe(2)
  })
})
