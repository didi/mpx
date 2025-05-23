import { test, expect, vi } from 'vitest'
import { ref, computed, reactive, effect } from '../src'

test('should return updated value', () => {
  const value = reactive({ foo: 0 })
  const cValue = computed(() => value.foo)
  expect(cValue.value).toBe(0)
  value.foo = 1
  expect(cValue.value).toBe(1)
})

test('pass oldValue to computed getter', () => {
  const count = ref(0)
  const oldValue = ref()
  const curValue = computed(pre => {
    oldValue.value = pre
    return count.value
  })
  expect(curValue.value).toBe(0)
  expect(oldValue.value).toBe(undefined)
  count.value++
  expect(curValue.value).toBe(1)
  expect(oldValue.value).toBe(0)
})

test('should compute lazily', () => {
  const value = reactive<{ foo?: number }>({ foo: undefined })
  const getter = vi.fn(() => value.foo)
  const cValue = computed(getter)

  // lazy
  expect(getter).not.toHaveBeenCalled()

  expect(cValue.value).toBe(undefined)
  expect(getter).toHaveBeenCalledTimes(1)

  // should not compute again
  cValue.value
  expect(getter).toHaveBeenCalledTimes(1)

  // should not compute until needed
  value.foo = 1
  expect(getter).toHaveBeenCalledTimes(1)

  // now it should compute
  expect(cValue.value).toBe(1)
  expect(getter).toHaveBeenCalledTimes(2)

  // should not compute again
  cValue.value
  expect(getter).toHaveBeenCalledTimes(2)
})

test('should correctly propagate changes through computed refs', () => {
  const src = ref(0)
  const c1Fn = () => src.value % 2
  const c1 = computed(c1Fn)
  const c2 = computed(() => c1.value)
  const c3 = computed(() => c2.value)

  expect(c3.value).toBe(0)
  src.value = 1 // c1 -> dirty, c2 -> toCheckDirty, c3 -> toCheckDirty
  expect(c2.value).toBe(1) // c1 -> none, c2 -> none
  src.value = 3 // c1 -> dirty, c2 -> toCheckDirty
  expect(c3.value).toBe(1)
})

test('should handle flags indirectly updated during checkDirty', () => {
  const c1 = ref(false)
  const c2 = computed(() => c1.value)
  const c3 = computed(() => {
    c2.value
    return 0
  })
  const c4 = computed(() => {
    c3.value
    return c2.value
  })

  expect(c4.value).toBe(false)
  c1.value = true
  expect(c4.value).toBe(true)
})

test('should trigger effect', () => {
  const value = reactive<{ foo?: number }>({ foo: undefined })
  const cValue = computed(() => value.foo)
  let dummy
  effect(() => {
    dummy = cValue.value
  })
  expect(dummy).toBe(undefined)
  value.foo = 1
  expect(dummy).toBe(1)
})

test('should work when chained', () => {
  const value = reactive({ foo: 0 })
  const c1 = computed(() => value.foo)
  const c2 = computed(() => c1.value + 1)
  expect(c2.value).toBe(1)
  expect(c1.value).toBe(0)
  value.foo++
  expect(c2.value).toBe(2)
  expect(c1.value).toBe(1)
})

test('should trigger effect when chained', () => {
  const value = reactive({ foo: 0 })
  const getter1 = vi.fn(() => value.foo)
  const getter2 = vi.fn(() => {
    return c1.value + 1
  })
  const c1 = computed(getter1)
  const c2 = computed(getter2)

  let dummy
  effect(() => {
    dummy = c2.value
  })
  expect(dummy).toBe(1)
  expect(getter1).toHaveBeenCalledTimes(1)
  expect(getter2).toHaveBeenCalledTimes(1)
  value.foo++
  expect(dummy).toBe(2)
  // should not result in duplicate calls
  expect(getter1).toHaveBeenCalledTimes(2)
  expect(getter2).toHaveBeenCalledTimes(2)
})

test('should trigger effect when chained (mixed invocations)', () => {
  const value = reactive({ foo: 0 })
  const getter1 = vi.fn(() => value.foo)
  const getter2 = vi.fn(() => {
    return c1.value + 1
  })
  const c1 = computed(getter1)
  const c2 = computed(getter2)

  let dummy
  effect(() => {
    dummy = c1.value + c2.value
  })
  expect(dummy).toBe(1)

  expect(getter1).toHaveBeenCalledTimes(1)
  expect(getter2).toHaveBeenCalledTimes(1)
  value.foo++
  expect(dummy).toBe(3)
  // should not result in duplicate calls
  expect(getter1).toHaveBeenCalledTimes(2)
  expect(getter2).toHaveBeenCalledTimes(2)
})

test('should support setter', () => {
  const n = ref(1)
  const plusOne = computed({
    get: () => n.value + 1,
    set: val => {
      n.value = val - 1
    }
  })

  expect(plusOne.value).toBe(2)
  n.value++
  expect(plusOne.value).toBe(3)

  plusOne.value = 0
  expect(n.value).toBe(-1)
})

test('should trigger effect w/ setter', () => {
  const n = ref(1)
  const plusOne = computed({
    get: () => n.value + 1,
    set: val => {
      n.value = val - 1
    }
  })

  let dummy
  effect(() => {
    dummy = n.value
  })
  expect(dummy).toBe(1)

  plusOne.value = 0
  expect(dummy).toBe(-1)
})

/**
 * 🚀 Better than Mpx2/Vue2, align with Vue>=3.4
 */
test('should correctly handle equality-check problem (computed)', () => {
  const src = ref(0)

  const getter1 = vi.fn(() => src.value % 2)
  const getter2 = vi.fn(() => c1.value)

  const c1 = computed(getter1)
  const c2 = computed(getter2)

  expect(c2.value).toBe(0) // c1 -> initial updated, c2 -> initial updated
  expect(getter2).toHaveBeenCalledTimes(1)
  expect(getter1).toHaveBeenCalledTimes(1)

  src.value = 1 // c1 -> dirty, c2 -> toCheckDirty
  expect(c2.value).toBe(1) // c1 -> updated, c2 -> updated
  expect(getter2).toHaveBeenCalledTimes(2)
  expect(getter1).toHaveBeenCalledTimes(2)

  src.value = 3 // c1 -> dirty, c2 -> toCheckDirty
  expect(c2.value).toBe(1) // c1 -> updated, c2 -> none
  expect(getter1).toHaveBeenCalledTimes(3)
  expect(getter2).toHaveBeenCalledTimes(2) // should be `3` in Mpx2/Vue2
})

/**
 * 🚀 Better than Mpx2/Vue2, align with Vue>=3.4
 */
test('should correctly handle equality-check problem (effect)', () => {
  const src = ref(0)
  const c = computed(() => src.value % 2)
  const spy = vi.fn()
  effect(() => {
    spy(c.value)
  })
  expect(spy).toHaveBeenCalledTimes(1)
  src.value = 2

  // should not trigger
  expect(spy).toHaveBeenCalledTimes(1) // should be `2` in Mpx2/Vue2

  src.value = 3
  src.value = 5
  // should trigger because latest value changes
  expect(spy).toHaveBeenCalledTimes(2) // should be `4` in Mpx2/Vue2
})
