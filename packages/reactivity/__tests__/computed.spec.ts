import { test, expect, vi } from 'vitest'
import { ref, computed, reactive } from '../src'

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

/**
 * 🚀 Better than Mpx2/Vue2, align with Vue>=3.4
 */
test('should correctly handle equality-check problem', () => {
  const src = ref(0)

  const getter1 = vi.fn(() => src.value % 2)
  const getter2 = vi.fn(() => c1.value)

  const c1 = computed(getter1)
  const c2 = computed(getter2)

  expect(c2.value).toBe(0) // c1 -> initial updated, c2 -> initial updated
  src.value = 1 // c1 -> dirty, c2 -> toCheckDirty
  expect(c2.value).toBe(1) // c1 -> updated, c2 -> updated
  src.value = 3 // c1 -> dirty, c2 -> toCheckDirty
  expect(c2.value).toBe(1) // c1 -> updated, c2 -> none

  expect(getter1).toHaveBeenCalledTimes(3)
  // expect(getter2).toHaveBeenCalledTimes(2) // should be `2` in vue3, `3` in Mpx2/Vue2
})

test('should propagate updated source value through chained computations', () => {
  const src = ref(0)
  const c1 = computed(() => src.value)
  const c2 = computed(() => c1.value % 2)
  const c3 = computed(() => src.value + c2.value)
  const c4 = computed(() => c2.value + c3.value)

  expect(c4.value).toBe(0)
  src.value = 2
  expect(c4.value).toBe(2)
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
