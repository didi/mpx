import { expect, test } from 'vitest'
import { ref, computed } from '../src'

test('should correctly propagate changes through computed refs', () => {
  const src = ref(0)
  const c1Fn = () => src.value % 2
  const c1 = computed(c1Fn)
  const c2 = computed(() => c1.value)
  const c3 = computed(() => c2.value)

  c3.value
  src.value = 1 // c1 -> dirty, c2 -> toCheckDirty, c3 -> toCheckDirty
  c2.value // c1 -> none, c2 -> none
  src.value = 3 // c1 -> dirty, c2 -> toCheckDirty

  expect(c3.value).toBe(1)
})

/**
 * 🚀 better than mpx2/vue2, aligin with vue3.4
 */
test('should correctly handle equality check problem', () => {
  let time1 = 0
  let time2 = 0

  const src = ref(0)
  const c1 = computed(() => {
    time1++
    return src.value % 2
  })
  const c2 = computed(() => {
    time2++
    return c1.value
  })

  c2.value // c1 -> initial updated, c2 -> initial updated
  src.value = 1 // c1 -> dirty, c2 -> toCheckDirty
  c2.value // c1 -> updated, c2 -> updated
  src.value = 3 // c1 -> dirty, c2 -> toCheckDirty
  c2.value // c1 -> updated, c2 -> none

  expect(c1.value).toBe(1)
  expect(time1).toBe(3)
  expect(c2.value).toBe(1)
  expect(time2).toBe(2) // should be `2` in vue3, `3` in vue2/mpx2
})

test('should propagate updated source value through chained computations', () => {
  const src = ref(0)
  const a = computed(() => src.value)
  const b = computed(() => a.value % 2)
  const c = computed(() => src.value + b.value)
  const d = computed(() => b.value + c.value)

  expect(d.value).toBe(0)
  src.value = 2
  expect(d.value).toBe(2)
})

test('should handle flags indirectly updated during checkDirty', () => {
  const a = ref(false)
  const b = computed(() => a.value)
  const c = computed(() => {
    b.value
    return 0
  })
  const d = computed(() => {
    c.value
    return b.value
  })

  expect(d.value).toBe(false)
  a.value = true
  expect(d.value).toBe(true)
})
