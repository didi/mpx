class DynamicAstCache {
  #astCache = {}

  getAst (id) {
    return this.#astCache[id]
  }

  setAst (id, ast) {
    this.#astCache[id] = ast
  }
}

export const dynamic = new DynamicAstCache()
