import { expect, test } from 'vitest'
import { isReactive, isRef, markRaw, reactive, ref, set } from '@mpxjs/core'

test('markRaw', () => {
  const obj = reactive({
    foo: { a: 1 },
    bar: markRaw({ b: 2 })
  })
  expect(isReactive(obj.bar)).toBe(false)
  expect(isReactive(obj.foo)).toBe(true)
})
