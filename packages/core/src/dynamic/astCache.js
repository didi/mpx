class DynamicAstCache {
  #astCache = {}

  getAst (id) {
    return Object.values(this.#astCache[id] || {})[0]
  }

  setAst (id, ast) {
    this.#astCache[id] = ast
  }
}

export const dynamic = new DynamicAstCache()
