import { toRef } from '@mpxjs/core'
import { makeMap, isFunction } from '@mpxjs/utils'
import { storeRefsBlackList } from './const'

const storeRefsBlackListMap = makeMap(storeRefsBlackList)

export function storeToRefs (store) {
  const refs = {}
  for (const key in store) {
    if (!storeRefsBlackListMap[key] && !isFunction(store[key])) {
      refs[key] = toRef(store, key)
    }
  }
  return refs
}
