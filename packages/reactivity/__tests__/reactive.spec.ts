import { expect, test, vi } from 'vitest'
import {
  computed,
  effect,
  isReactive,
  isRef,
  markRaw,
  reactive,
  ref,
  set
} from '../src'

test('Object', () => {
  const original = { foo: 1 }
  const observed = reactive(original)
  expect(isReactive(observed)).toBe(true)
  expect(observed).toBe(original)
  expect(observed.foo).toBe(1)
  // has
  expect('foo' in observed).toBe(true)
  // ownKeys
  expect(Object.keys(observed)).toEqual(['foo'])
})

test('should return updated value', () => {
  const value = reactive({ foo: 0 })
  const cValue = computed(() => value.foo)
  expect(cValue.value).toBe(0)
  value.foo = 1
  expect(cValue.value).toBe(1)
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

test('observed value should proxy mutations to original (Object)', () => {
  const original: any = { foo: 1 }
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
  const original: any = { foo: 1 }
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
  const observed = reactive<{ foo?: object }>({})
  const raw = {}
  set(observed, 'foo', raw)
  expect(observed.foo).toBe(raw) // tip: not.toBe(raw) in Vue3 cause of proxy
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
  const original: any = { foo: 1 }
  const original2 = { bar: 2 }
  const observed = reactive(original)
  const observed2 = reactive(original2)
  observed.bar = observed2
  expect(observed.bar).toBe(observed2)
  expect(original.bar).toBe(original2)
})

test('ref wrapped in reactive should not track internal _value access', () => {
  const a = ref(1)
  const b = reactive(a)

  a.value = 3
  expect(a.value).toBe(3)
  expect(b.value).toBe(3)

  b.value = 5
  expect(a.value).toBe(5)
  expect(b.value).toBe(5)
})

test('should work like a normal property when nested in a reactive object', () => {
  const a = ref(1)
  const obj = reactive({
    a,
    b: {
      c: a
    }
  })

  let dummy1: number
  let dummy2: number

  effect(() => {
    dummy1 = obj.a
    dummy2 = obj.b.c
  })

  const assertDummiesEqualTo = (val: number) =>
    [dummy1, dummy2].forEach(dummy => expect(dummy).toBe(val))

  assertDummiesEqualTo(1)
  a.value++
  assertDummiesEqualTo(2)
  obj.a++
  assertDummiesEqualTo(3)
  obj.b.c++
  assertDummiesEqualTo(4)
})

test('should not unwrap Ref<T>', () => {
  const observedNumberRef = reactive(ref(1))
  const observedObjectRef = reactive(ref({ foo: 1 }))
  expect(isReactive(observedNumberRef)).toBe(false)
  expect(isReactive(observedObjectRef)).toBe(false)
  expect(isRef(observedNumberRef)).toBe(true)
  expect(isRef(observedObjectRef)).toBe(true)
})

test('should unwrap computed refs', () => {
  // readonly
  const a = computed(() => 1)
  // writable
  const b = computed({
    get: () => 1,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
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
  let dummy
  effect(() => {
    dummy = observed.a
  })
  expect(dummy).toBe(0)

  // @ts-expect-error test
  observed.a = bar
  expect(dummy).toBe(1)

  bar.value++
  expect(dummy).toBe(2)
})

test('markRaw', () => {
  const obj = reactive({
    foo: { a: 1 },
    bar: markRaw({ b: 2 })
  })
  expect(isReactive(obj.foo)).toBe(true)
  expect(isReactive(obj.bar)).toBe(false)
})

test('markRaw on non-extensible objects', () => {
  const foo = Object.seal({})
  markRaw(foo)
  expect(isReactive(reactive(foo))).toBe(false)
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

test('should not trigger if value did not change', () => {
  const state = reactive({
    foo: 1
  })
  const spy = vi.fn()
  effect(() => {
    state.foo
    spy()
  })
  expect(spy).toHaveBeenCalledTimes(1)
  state.foo = 1
  expect(spy).toHaveBeenCalledTimes(1)
  state.foo = NaN
  expect(spy).toHaveBeenCalledTimes(2)
  state.foo = NaN
  // Object.is(NaN, NaN) is true
  expect(spy).toHaveBeenCalledTimes(2)
  state.foo = 2
  expect(spy).toHaveBeenCalledTimes(3)
})
