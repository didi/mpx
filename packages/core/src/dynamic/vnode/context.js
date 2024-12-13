const cache = {}

const contextMap = {
  set (id, context) {
    cache[id] = context
  },
  get (id) {
    return cache[id]
  },
  remove (id) {
    if (cache[id]) {
      delete cache[id]
    }
  }
}

export default contextMap
