import { expect, test } from 'vitest'
import { type Ref, isReactive, isRef, reactive, ref, shallowReactive } from '../src'

test('should not make non-reactive properties reactive', () => {
  const props = shallowReactive({ n: { foo: 1 } })
  expect(isReactive(props)).toBe(true)
  expect(isReactive(props.n)).toBe(false)
})

test('should keep reactive properties reactive', () => {
  const props: any = shallowReactive({ n: reactive({ foo: 1 }) })
  props.n = reactive({ foo: 2 })
  expect(isReactive(props.n)).toBe(true)
})

test('should not unwrap refs', () => {
  const foo = shallowReactive({
    bar: ref(123)
  })
  expect(isRef(foo.bar)).toBe(true)
  expect(foo.bar.value).toBe(123)
})

test('should not mutate refs', () => {
  const original = ref(123)
  const foo = shallowReactive<{ bar: Ref<number> | number }>({
    bar: original
  })
  expect(foo.bar).toBe(original)
  foo.bar = 234
  expect(foo.bar).toBe(234)
  expect(original.value).toBe(123)
})
