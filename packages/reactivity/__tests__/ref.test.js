import { ref, isRef, unref } from '../src/ref'

describe('reactivity/ref', () => {
  it('should hold a value', () => {
    const a = ref(1)
    expect(a.value).toBe(1)
    a.value = 2
    expect(a.value).toBe(2)
  })

  it('should unwrap nested ref in types', () => {
    const a = ref(0)
    const b = ref(a)

    expect(typeof (b.value + 1)).toBe('number')
  })

  it('should unwrap nested values in types', () => {
    const a = {
      b: ref(0)
    }

    const c = ref(a)
    c.value.b
    expect(typeof (c.value.b + 1)).toBe('number')
  })

  it('should not unwrap ref types nested inside arrays', () => {
    const arr = ref([1, ref(3)]).value
    expect(isRef(arr[0])).toBe(false)
    expect(isRef(arr[1])).toBe(true)
    expect(arr[1].value).toBe(3)
  })

  it('should unwrap ref types as props of arrays', () => {
    const arr = [ref(0)]
    const symbolKey = Symbol('')
    arr[''] = ref(1)
    arr[symbolKey] = ref(2)
    const arrRef = ref(arr).value
    expect(isRef(arrRef[0])).toBe(true)
    expect(isRef(arrRef[''])).toBe(false)
    expect(isRef(arrRef[symbolKey])).toBe(false)
    expect(arrRef['']).toBe(1)
    expect(arrRef[symbolKey]).toBe(2)
  })

  it('should keep tuple types', () => {
    const tuple = [
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

  it('should keep symbols', () => {
    const customSymbol = Symbol()
    const obj = {
      [Symbol.asyncIterator]: ref(1),
      [Symbol.hasInstance]: { a: ref('a') },
      [Symbol.isConcatSpreadable]: { b: ref(true) },
      [Symbol.iterator]: [ref(1)],
      [Symbol.match]: new Set(),
      [Symbol.matchAll]: new Map(),
      [Symbol.replace]: { arr: [ref('a')] },
      [Symbol.search]: { set: new Set() },
      [Symbol.species]: { map: new Map() },
      [Symbol.split]: new WeakSet(),
      [Symbol.toPrimitive]: new WeakMap(),
      [Symbol.toStringTag]: { weakSet: new WeakSet() },
      [Symbol.unscopables]: { weakMap: new WeakMap() },
      [customSymbol]: { arr: [ref(1)] }
    }

    const objRef = ref(obj)

    const keys = [
      Symbol.asyncIterator,
      Symbol.hasInstance,
      Symbol.isConcatSpreadable,
      Symbol.iterator,
      Symbol.match,
      Symbol.matchAll,
      Symbol.replace,
      Symbol.search,
      Symbol.species,
      Symbol.split,
      Symbol.toPrimitive,
      Symbol.toStringTag,
      Symbol.unscopables,
      customSymbol
    ]
    
    keys.forEach(key => {
      expect(objRef.value[key]).toStrictEqual(obj[key])
    })
  })

  test('unref', () => {
    expect(unref(1)).toBe(1)
    expect(unref(ref(1))).toBe(1)
  })
})
