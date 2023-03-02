export type ItemType = string | Record<string, unknown>
export type SetType = Set<ItemType>
export type FnType = (item: ItemType) => unknown

export default {
  every (set: SetType, fn: FnType) {
    for (const item of set) {
      if (!fn(item)) return false
    }
    return true
  },
  has (set: SetType, fn: FnType) {
    for (const item of set) {
      if (fn(item)) return true
    }
    return false
  },
  map (set: SetType, fn: FnType) {
    const result = new Set()
    set.forEach((item: ItemType) => {
      result.add(fn(item))
    })
    return result
  },
  filter (set: SetType, fn: FnType) {
    const result = new Set()
    set.forEach((item: ItemType) => {
      if (fn(item)) {
        result.add(item)
      }
    })
    return result
  },
  concat (setA: SetType, setB: SetType) {
    const result = new Set()
    setA.forEach((item: ItemType) => {
      result.add(item)
    })
    setB.forEach((item: ItemType) => {
      result.add(item)
    })
    return result
  },
  mapToArr (set: SetType, fn: FnType) {
    const result: Array<unknown> = []
    set.forEach((item: ItemType) => {
      result.push(fn(item))
    })
    return result
  }
}
