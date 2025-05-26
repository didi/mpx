import { expect, test, vi } from 'vitest'
import { effect, ref } from '../src'

test('should trigger when array push', () => {
  const arr = ref(['a', 'b'])

  const spy = vi.fn(() => arr.value)
  effect(spy)
  expect(spy).toBeCalledTimes(1)

  arr.value.push('c')
  expect(spy).toBeCalledTimes(2)
  expect(arr.value).toEqual(['a', 'b', 'c'])

  arr.value.push('c')
  expect(spy).toBeCalledTimes(3)
  expect(arr.value).toEqual(['a', 'b', 'c', 'c'])
})

test('should trigger when array pop', () => {
  const arr = ref(['a', 'b'])

  const spy = vi.fn(() => arr.value)
  effect(spy)
  expect(spy).toBeCalledTimes(1)

  arr.value.pop()
  expect(spy).toBeCalledTimes(2)
  expect(arr.value).toEqual(['a'])
})

test('should trigger when array shift', () => {
  const arr = ref(['a', 'b'])

  const spy = vi.fn(() => arr.value)
  effect(spy)
  expect(spy).toBeCalledTimes(1)

  arr.value.shift()
  expect(spy).toBeCalledTimes(2)
  expect(arr.value).toEqual(['b'])
})

test('should trigger when array unshift', () => {
  const arr = ref(['a', 'b'])

  const spy = vi.fn(() => arr.value)
  effect(spy)
  expect(spy).toBeCalledTimes(1)

  arr.value.unshift('c')
  expect(spy).toBeCalledTimes(2)
  expect(arr.value).toEqual(['c', 'a', 'b'])
})

test('should trigger when array splice', () => {
  const arr = ref(['a', 'b'])

  const spy = vi.fn(() => arr.value)
  effect(spy)
  expect(spy).toBeCalledTimes(1)

  arr.value.splice(0, 1)
  expect(spy).toBeCalledTimes(2)
  expect(arr.value).toEqual(['b'])
})

test('should trigger when array sort', () => {
  const arr = ref(['b', 'a'])

  const spy = vi.fn(() => arr.value)
  effect(spy)
  expect(spy).toBeCalledTimes(1)

  arr.value.sort()
  expect(spy).toBeCalledTimes(2)
  expect(arr.value).toEqual(['a', 'b'])
})

test('should trigger when array reverse', () => {
  const arr = ref(['a', 'b'])

  const spy = vi.fn(() => arr.value)
  effect(spy)
  expect(spy).toBeCalledTimes(1)

  arr.value.reverse()
  expect(spy).toBeCalledTimes(2)
  expect(arr.value).toEqual(['b', 'a'])
})

test('should not trigger when array length change', () => {
  const arr = ref(['a', 'b'])

  const spy = vi.fn(() => arr.value)
  effect(spy)
  expect(spy).toBeCalledTimes(1)

  arr.value.length = 0
  // should not trigger
  expect(spy).toBeCalledTimes(1)
  expect(arr.value).toEqual([])
})

test('should not trigger when array set', () => {
  const arr = ref(['a', 'b'])

  const spy = vi.fn(() => arr.value)
  effect(spy)
  expect(spy).toBeCalledTimes(1)

  arr.value[0] = 'c'
  // should not trigger
  expect(spy).toBeCalledTimes(1)
  expect(arr.value).toEqual(['c', 'b'])

  arr.value[2] = 'd'
  // should not trigger
  expect(spy).toBeCalledTimes(1)
  expect(arr.value).toEqual(['c', 'b', 'd'])
})
