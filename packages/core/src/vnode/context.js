const cache = {}

const contextMap = {
  set (id, context) {
    cache[id] = context
  },
  get (id) {
    if (!id) {
      return {}
    }
    return cache[id] || {}
  }
}

export default contextMap
