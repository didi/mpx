
const cache = new Map()

class MultiNode {
  constructor (data, child = []) {
    this.data = data
    this.child = child
  }

  add (data) {
    this.child.push(data)
  }

  get (path) {
    if (cache.get(path)) return cache.get(path)

    if (this.data.path === path) {
      return this
    } else {
      let result = null
      for (let i = 0; i < this.child.length; i++) {
        result = this.child[i].get(path)
        if (result) {
          cache.set(path, result)
          return result
        }
      }
      return result
    }
  }
}

module.exports = {
  MultiNode,
  clearCache () {
    cache.clear()
  }
}
