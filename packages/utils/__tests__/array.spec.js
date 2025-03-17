// /Users/didi/blackdir/mpx/packages/utils/__tests__/array.test.js
import { makeMap, findItem, remove, testArrayProtoAugment, isValidArrayIndex } from '../src/array'

describe('makeMap', () => {
  test('应该处理空数组', () => {
    expect(makeMap([])).toEqual({})
  })

  test('应该正确处理基本类型', () => {
    expect(makeMap(['a', 1, true])).toEqual({
      a: true,
      1: true,
      true: true
    })
  })

  test.each([
    [[null], { null: true }],
    [[undefined], { undefined: true }],
    [[0], { 0: true }],
    [[NaN], { NaN: true }],
    [[Symbol('test')], { [Symbol('test')]: true }]
  ])('应该处理特殊值 %p', (input, expected) => {
    const result = makeMap(input)
    // Symbol 需要特殊处理
    if (typeof input[0] === 'symbol') {
      expect(Object.getOwnPropertySymbols(result)[0]).toBe(input[0])
    } else {
      expect(result).toEqual(expected)
    }
  })

  test('应该覆盖重复值', () => {
    expect(makeMap(['a', 'a'])).toEqual({ a: true })
  })

  test('应该保持插入顺序', () => {
    const arr = ['z', 'a', 'm']
    const keys = Object.keys(makeMap(arr))
    expect(keys).toEqual(arr)
  })

  test('应该处理混合类型', () => {
    const date = new Date()
    const obj = { foo: 'bar' }
    const arr = [123, '123', true, false, null, undefined, date, obj]
    
    const result = makeMap(arr)
    expect(result).toEqual({
      123: true,
      '123': true,
      true: true,
      false: true,
      null: true,
      undefined: true,
      [date.toString()]: true,
      [obj.toString()]: true
    })
  })
})

describe('findItem', () => {
    test('应该正确匹配字符串', () => {
      // 精确匹配
      expect(findItem(['apple', 'banana'], 'apple')).toBe(true)
      // 大小写敏感
      expect(findItem(['Apple'], 'apple')).toBe(false)
      // 数字类型匹配
      expect(findItem([123, 456], 123)).toBe(true)
    })
  
    test('应该处理正则表达式匹配', () => {
      // 基础正则匹配
      expect(findItem(['apple', 'banana'], /app/)).toBe(true)
      // 正则不匹配
      expect(findItem(['apple', 'banana'], /orange/)).toBe(false)
      // 复杂正则
      expect(findItem(['test123', 'demo'], /^\w+\d+$/)).toBe(true)
    })
  
    test('应该处理边界条件, 默认修改为', () => {
      // 空数组
      expect(findItem([], 'test')).toBe(false)
      // undefined/null输入
      expect(findItem(['test'], undefined)).toBe(false)
      // 混合类型数组
      expect(findItem([123, '456', /789/], '456')).toBe(true)
    })
  
    test('应该优先正则匹配', () => {
      // 同时满足正则和精确匹配
      expect(findItem(['apple', /app/], /app/)).toBe(true)
      // 正则对象本身作为数组元素
      expect(findItem([/apple/], /apple/)).toBe(true)
    })
  
    test('应该处理特殊值', () => {
      // 布尔值
      expect(findItem([true, false], true)).toBe(true)
      // 对象引用
      const obj = {}
      expect(findItem([obj], obj)).toBe(true)
    })
  })

// /Users/didi/blackdir/mpx/packages/utils/__tests__/array.test.js
describe('remove', () => {
  test('空数组应该返回undefined', () => {
    const arr = []
    const result = remove(arr, 1)
    expect(result).toBeUndefined()
    expect(arr).toEqual([])
  })

  test('存在目标项时应该正确移除', () => {
    const arr = [1, 2, 3]
    const result = remove(arr, 2)
    expect(result).toEqual([2])
    expect(arr).toEqual([1, 3])
  })

  test('不存在目标项时返回undefined', () => {
    const arr = [1, 2, 3]
    const result = remove(arr, 4)
    expect(result).toBeUndefined()
    expect(arr).toEqual([1, 2, 3])
  })

  test('应该只移除第一个匹配项', () => {
    const arr = [1, 2, 2, 3]
    const result = remove(arr, 2)
    expect(result).toEqual([2])
    expect(arr).toEqual([1, 2, 3])
  })

  test('应该处理不同类型的值', () => {
    const arr = [1, '1', true, { a: 1 }]
    const obj = { a: 1 }
    
    // 测试数字1和字符串'1'
    expect(remove(arr, '1')).toEqual(['1'])
    expect(arr).toEqual([1, true, obj])
  })

  test('应该保持数组不变当参数无效时', () => {
    const arr = [1, 2, 3]
    const testCases = [null, undefined, {}, () => {}]
    
    testCases.forEach(item => {
      const original = [...arr]
      const result = remove(arr, item)
      expect(result).toBeUndefined()
      expect(arr).toEqual(original)
    })
  })
})

describe('isValidArrayIndex', () => {
  test('should return true for valid array indices', () => {
    expect(isValidArrayIndex(0)).toBe(true)
    expect(isValidArrayIndex(1)).toBe(true)
    expect(isValidArrayIndex(Number.MAX_SAFE_INTEGER)).toBe(true)
    expect(isValidArrayIndex('0')).toBe(true)
    expect(isValidArrayIndex('123')).toBe(true)
  })

  test('should return false for non-integer values', () => {
    expect(isValidArrayIndex(3.14)).toBe(false)
    expect(isValidArrayIndex('3.14')).toBe(false)
    expect(isValidArrayIndex(Math.PI)).toBe(false)
  })

  test('should return false for negative numbers', () => {
    expect(isValidArrayIndex(-1)).toBe(false)
    expect(isValidArrayIndex('-5')).toBe(false)
    expect(isValidArrayIndex(Number.MIN_SAFE_INTEGER)).toBe(false)
  })

  test('should return false for non-numeric values', () => {
    expect(isValidArrayIndex(null)).toBe(false)
    expect(isValidArrayIndex(undefined)).toBe(false)
    expect(isValidArrayIndex({})).toBe(false)
    expect(isValidArrayIndex([])).toBe(false)
    expect(isValidArrayIndex(() => {})).toBe(false)
    expect(isValidArrayIndex(Symbol())).toBe(false)
  })

  test('should handle edge cases', () => {
    expect(isValidArrayIndex(Infinity)).toBe(false)
    expect(isValidArrayIndex(-Infinity)).toBe(false)
    expect(isValidArrayIndex(NaN)).toBe(false)
    expect(isValidArrayIndex('')).toBe(false)
    expect(isValidArrayIndex('123abc')).toBe(false)
    expect(isValidArrayIndex(true)).toBe(false)
    expect(isValidArrayIndex(false)).toBe(false)
  })
})