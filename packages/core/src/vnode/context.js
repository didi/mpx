const cache = {}

const contextMap = {
  set (id, context) {
    cache[id] = context
  },
  get (id) {
    if (!id) {
      return null
    }
    return cache[id]
  }
}

export default contextMap
