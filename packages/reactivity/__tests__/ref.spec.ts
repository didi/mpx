import { expect, test, vi } from 'vitest'
import {
  type Ref,
  computed,
  customRef,
  effect,
  isReactive,
  isRef,
  reactive,
  ref,
  shallowRef,
  toRef,
  toRefs,
  triggerRef,
  unref
} from '../src'

test('should hold a value', () => {
  const a = ref(1)
  expect(a.value).toBe(1)
  a.value = 2
  expect(a.value).toBe(2)
})

test('should be reactive', () => {
  const a = ref(1)
  let dummy
  let calls = 0
  effect(() => {
    calls++
    dummy = a.value
  })
  expect(calls).toBe(1)
  expect(dummy).toBe(1)
  a.value = 2
  expect(calls).toBe(2)
  expect(dummy).toBe(2)
  // same value should not trigger
  a.value = 2
  expect(calls).toBe(2)
})

test('should make nested properties reactive', () => {
  const a = ref({
    count: 1
  })
  let dummy
  effect(() => {
    dummy = a.value.count
  })
  expect(dummy).toBe(1)
  a.value.count = 2
  expect(dummy).toBe(2)
})

test('should work without initial value', () => {
  const a = ref()
  let dummy
  effect(() => {
    dummy = a.value
  })
  expect(dummy).toBeUndefined()
  a.value = 1
  expect(dummy).toBe(1)
})

test('should unwrap nested ref in types', () => {
  const a = ref(0)
  const b = ref(a)
  expect(typeof (b.value + 1)).toBe('number')
})

test('should unwrap nested values in types', () => {
  const a = {
    b: ref(0)
  }
  const c = ref(a)
  expect(typeof (c.value.b + 1)).toBe('number')
})

test('should NOT unwrap ref types nested inside arrays', () => {
  const arr = ref([1, ref(3)]).value
  expect(isRef(arr[0])).toBe(false)
  expect(isRef(arr[1])).toBe(true)
  expect((arr[1] as Ref).value).toBe(3)
})

test('should keep tuple types', () => {
  const tuple: [number, string, { a: number }, () => number, Ref<number>] = [
    0,
    '1',
    { a: 1 },
    () => 0,
    ref(0)
  ]
  const tupleRef = ref(tuple)
  tupleRef.value[0]++
  expect(tupleRef.value[0]).toBe(1)
  tupleRef.value[1] += '1'
  expect(tupleRef.value[1]).toBe('11')
  tupleRef.value[2].a++
  expect(tupleRef.value[2].a).toBe(2)
  expect(tupleRef.value[3]()).toBe(0)
  tupleRef.value[4].value++
  expect(tupleRef.value[4].value).toBe(1)
})

test('unref', () => {
  expect(unref(1)).toBe(1)
  expect(unref(ref(1))).toBe(1)
})

test('shallowRef', () => {
  const sref = shallowRef({ a: 1 })
  expect(isReactive(sref.value)).toBe(false)

  let dummy
  effect(() => {
    dummy = sref.value.a
  })
  expect(dummy).toBe(1)

  sref.value = { a: 2 }
  expect(isReactive(sref.value)).toBe(false)
  expect(dummy).toBe(2)
})

test('shallowRef force trigger', () => {
  const sref = shallowRef({ a: 1 })

  let dummy
  effect(() => {
    dummy = sref.value.a
  })
  expect(dummy).toBe(1)

  sref.value.a = 2
  expect(dummy).toBe(1) // should not trigger yet

  // force trigger
  triggerRef(sref)
  expect(dummy).toBe(2)
})

test('isRef', () => {
  expect(isRef(ref(1))).toBe(true)
  expect(isRef(computed(() => 1))).toBe(true)
  expect(isRef(0)).toBe(false)
  expect(isRef(1)).toBe(false)
  // an object that looks like a ref isn't necessarily a ref
  expect(isRef({ value: 0 })).toBe(false)
})

test('ref force trigger', () => {
  const a = ref({ count: 1 })
  const b = shallowRef({ count: 1 })

  const spy = vi.fn(() => a.value)
  effect(spy)
  expect(spy).toBeCalledTimes(1)

  const spy1 = vi.fn(() => a.value)
  effect(spy1)
  expect(spy1).toBeCalledTimes(1)

  // force trigger ref
  triggerRef(a)
  // force trigger shallow ref
  triggerRef(b)

  expect(spy).toBeCalledTimes(2)
  expect(spy1).toBeCalledTimes(2)
})

test('toRef', () => {
  const a = reactive({
    x: 1
  })
  const x = toRef(a, 'x')
  expect(isRef(x)).toBe(true)
  expect(x.value).toBe(1)

  // source -> proxy
  a.x = 2
  expect(x.value).toBe(2)

  // proxy -> source
  x.value = 3
  expect(a.x).toBe(3)

  // reactivity
  let dummyX
  effect(() => {
    dummyX = x.value
  })
  expect(dummyX).toBe(x.value)

  // mutating source should trigger effect using the proxy refs
  a.x = 4
  expect(dummyX).toBe(4)

  // should keep ref
  const r = { x: ref(1) }
  expect(toRef(r, 'x')).toBe(r.x)
})

test('toRef on array', () => {
  const a = reactive(['a', 'b'])
  const r = toRef(a, 1)
  expect(r.value).toBe('b')
  r.value = 'c'
  expect(r.value).toBe('c')
  expect(a[1]).toBe('c')
})

test('toRef default value', () => {
  const a: { x: number | undefined | null } = { x: undefined }
  const x = toRef(a, 'x', 1)
  // should get default value
  expect(x.value).toBe(1)

  a.x = undefined
  // should get default value
  expect(x.value).toBe(1)

  a.x = null
  // should not get default value only if undefined
  expect(x.value).toBe(null)

  a.x = 2
  expect(x.value).toBe(2)

  a.x = undefined
  // should get default value
  expect(x.value).toBe(1)
})

test('toRefs', () => {
  const a = reactive({
    x: 1,
    y: 2
  })

  const { x, y } = toRefs(a)

  expect(isRef(x)).toBe(true)
  expect(isRef(y)).toBe(true)
  expect(x.value).toBe(1)
  expect(y.value).toBe(2)

  // source -> proxy
  a.x = 2
  a.y = 3
  expect(x.value).toBe(2)
  expect(y.value).toBe(3)

  // proxy -> source
  x.value = 3
  y.value = 4
  expect(a.x).toBe(3)
  expect(a.y).toBe(4)

  // reactivity
  let dummyX, dummyY
  effect(() => {
    dummyX = x.value
    dummyY = y.value
  })
  expect(dummyX).toBe(x.value)
  expect(dummyY).toBe(y.value)

  // mutating source should trigger effect using the proxy refs
  a.x = 4
  a.y = 5
  expect(dummyX).toBe(4)
  expect(dummyY).toBe(5)
})

test('toRefs reactive array', () => {
  const { arr } = reactive({ arr: ['a', 'b', 'c'] })
  const refs = toRefs(arr)

  expect(Array.isArray(refs)).toBe(true)
  expect(isRef(refs[0])).toBe(true)

  refs[0].value = '1'
  expect(arr[0]).toBe('1')

  arr[1] = '2'
  expect(refs[1].value).toBe('2')
})

test('customRef', () => {
  let value = 1
  let _trigger: () => void

  const custom = customRef((track, trigger) => ({
    get() {
      track()
      return value
    },
    set(newValue: number) {
      value = newValue
      _trigger = trigger
    }
  }))

  expect(isRef(custom)).toBe(true)

  let dummy
  effect(() => {
    dummy = custom.value
  })
  expect(dummy).toBe(1)

  custom.value = 2
  // should not trigger yet
  expect(dummy).toBe(1)

  _trigger!()
  expect(dummy).toBe(2)
})

test('should not trigger when setting value to same proxy', () => {
  const obj = reactive({ count: 0 })

  const a = ref(obj)
  const spy1 = vi.fn(() => a.value)

  effect(spy1)

  a.value = obj
  expect(spy1).toBeCalledTimes(1)

  const b = shallowRef(obj)
  const spy2 = vi.fn(() => b.value)

  effect(spy2)
  b.value = obj
  expect(spy2).toBeCalledTimes(1)
})
