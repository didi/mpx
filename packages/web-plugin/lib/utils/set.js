module.exports = {
  every (set, fn) {
    for (const item of set) {
      if (!fn(item)) return false
    }
    return true
  },
  has (set, fn) {
    for (const item of set) {
      if (fn(item)) return true
    }
    return false
  },
  map (set, fn) {
    const result = new Set()
    set.forEach((item) => {
      result.add(fn(item))
    })
    return result
  },
  filter (set, fn) {
    const result = new Set()
    set.forEach((item) => {
      if (fn(item)) {
        result.add(item)
      }
    })
    return result
  },
  concat (setA, setB) {
    const result = new Set()
    setA.forEach((item) => {
      result.add(item)
    })
    setB.forEach((item) => {
      result.add(item)
    })
    return result
  },
  mapToArr (set, fn) {
    const result = []
    set.forEach((item) => {
      result.push(fn(item))
    })
    return result
  }
}
