import { reactive, isReactive, set, del } from '../src/reactive'
import { effect } from '../src/effect'

describe('test reactivity/reactive/arrary', () => {
  test('should make Array reactive', () => {
    const original = [{ foo: 1 }]
    const observed = reactive(original)
    expect(observed).not.toBe(original)
    expect(isReactive(observed)).toBe(true)
    expect(isReactive(original)).toBe(false)
    expect(isReactive(observed[0])).toBe(true)
    expect(isReactive(original[0])).toBe(false)
    // get
    expect(observed[0].foo).toBe(1)
    // has
    expect(0 in observed).toBe(true)
    // ownKeys
    expect(Object.keys(observed)).toEqual(['0'])
  })

  test('cloned reactive Array should point to observed values', () => {
    const original = [{ foo: 1 }]
    const observed = reactive(original)
    const clone = observed.slice()
    expect(isReactive(clone[0])).toBe(true)
    expect(clone[0]).not.toBe(original[0])
    expect(clone[0]).toBe(observed[0])
  })

  test('observed value should proxy mutations to original (Array)', () => {
    const original = [{ foo: 1 }, { bar: 2 }]
    const observed = reactive(original)
    // set
    const value = { baz: 3 }
    const reactiveValue = reactive(value)
    observed[0] = value
    expect(observed[0]).toBe(reactiveValue)
    expect(original[0]).toBe(value)
    // delete
    delete observed[0]
    expect(observed[0]).toBeUndefined()
    expect(original[0]).toBeUndefined()
    // mutating methods
    observed.push(value)
    expect(observed[2]).toBe(reactiveValue)
    expect(original[2]).toBe(value)
  })

  test('Array identity methods should work with raw values', () => {
    const raw = {}
    const arr = reactive([{}, {}])
    arr.push(raw)

    // proxy obj =》 arr， arr !== raw
    expect(arr.indexOf(raw)).toBe(2)
    expect(arr.indexOf(raw, 3)).toBe(-1)
    expect(arr.includes(raw)).toBe(true)
    expect(arr.includes(raw, 3)).toBe(false)
    expect(arr.lastIndexOf(raw)).toBe(2)
    expect(arr.lastIndexOf(raw, 1)).toBe(-1)

    // should work also for the observed version
    const observed = arr[2]
    expect(arr.indexOf(observed)).toBe(2)
    expect(arr.indexOf(observed, 3)).toBe(-1)
    expect(arr.includes(observed)).toBe(true)
    expect(arr.includes(observed, 3)).toBe(false)
    expect(arr.lastIndexOf(observed)).toBe(2)
    expect(arr.lastIndexOf(observed, 1)).toBe(-1)
  })

  test('Array identity methods should work if raw value contains reactive objects', () => {
    const raw = []
    const obj = reactive({})
    raw.push(obj)
    const arr = reactive(raw)
    expect(arr.includes(obj)).toBe(true)
  })

  describe('Array subclasses', () => {
    class SubArray extends Array {
      lastPushed
      lastSearched
      push (item) {
        this.lastPushed = item
        return super.push(item)
      }

      indexOf (searchElement, fromIndex) {
        this.lastSearched = searchElement
        return super.indexOf(searchElement, fromIndex)
      }
    }

    test('calls correct mutation method on Array subclass', () => {
      const subArray = new SubArray(4, 5, 6)
      const observed = reactive(subArray)

      subArray.push(7)
      expect(subArray.lastPushed).toBe(7)
      observed.push(9)
      expect(observed.lastPushed).toBe(9)
    })

    test('calls correct identity-sensitive method on Array subclass', () => {
      const subArray = new SubArray(4, 5, 6)
      const observed = reactive(subArray)
      let index

      index = subArray.indexOf(4)
      expect(index).toBe(0)
      expect(subArray.lastSearched).toBe(4)

      index = observed.indexOf(6)
      expect(index).toBe(2)
      expect(observed.lastSearched).toBe(6)
    })
  })

  test('Set a property on an reactive arrary should triggers change', () => {
    const origin = [10]
    const obj = reactive(origin)
    const spy = jest.fn(() => {
      return obj[0]
    })
    effect(spy)

    expect(spy).toHaveBeenCalledTimes(1)
    expect(obj).toEqual([10])
    expect(origin).toEqual([10])

    set(obj, 1, 20)
    expect(obj).toEqual([10, 20])
    expect(origin).toEqual([10, 20])
    expect(spy).toHaveBeenCalledTimes(1)

    set(obj, 0, 1)
    expect(obj).toEqual([1, 20])
    expect(spy).toHaveBeenCalledTimes(2)

    set(obj, 'name', 'jack')
    expect(spy).toHaveBeenCalledTimes(2)
  })

  test('Del property on an reactive arrary should triggers change', () => {
    const origin = [10]
    const obj = reactive(origin)
    const spy = jest.fn(() => {
      return obj[0]
    })
    effect(spy)

    expect(spy).toHaveBeenCalledTimes(1)
    expect(obj).toEqual([10])
    expect(origin).toEqual([10])

    del(obj, 1)
    expect(obj).toEqual([10])
    expect(origin).toEqual([10])
    expect(spy).toHaveBeenCalledTimes(1)

    del(obj, 0)
    expect(obj).toEqual([undefined])
    expect(spy).toHaveBeenCalledTimes(2)

    del(obj, 'name')
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
