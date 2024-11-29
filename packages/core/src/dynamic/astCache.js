import { isFunction, isObject, error } from '@mpxjs/utils'

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

export const getAst = (__getAst, moduleId) => {
  if ((__getAst && isFunction(__getAst))) {
    const ast = __getAst()
    if (!isObject(ast)) return error('__getAst returned data is not of type object')
    return Object.values(ast)[0]
  } else {
    return dynamic.getAst(moduleId)
  }
}
