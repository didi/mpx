/* eslint-disable no-unused-expressions */
import { expect, test } from 'vitest'
import { ref, computed } from '../src'

test('should correctly propagate changes through computed signals', () => {
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

test('should handle flags are indirectly updated during checkDirty', () => {
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

test('should not update if the signal value is reverted', () => {
  let times = 0

  const src = ref(0)
  const c1 = computed(() => {
    times++
    return src.value
  })
  c1.value
  expect(times).toBe(1)
  src.value = 1
  src.value = 0
  c1.value
  expect(times).toBe(1)
})
