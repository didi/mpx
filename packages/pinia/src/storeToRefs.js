import { toRef } from '@mpxjs/core'
import { propsBlackList } from './const'
/**
 * * @description: all the props extracted are reactive
 * * @param: store
 * @return {*} store
 */
export function storeToRefs (store) {
  const refs = {}
  for (const key in store) {
    if (!propsBlackList.includes(key)) {
      refs[key] = toRef(store, key)
    }
  }
  return refs
}
