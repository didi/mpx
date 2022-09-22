import { toRef } from '@mpxjs/core'
import { propsBlackList } from './const'
/**
 * * @description: all the props extracted are reactive
 * * @param: store
 * @return {*} store
 */
export function storeToRefs (store) {
  let refs = {}
  for (let key in store) {
    if (!propsBlackList.includes(key)) {
      refs[key] = toRef(store, key)
    }
  }
  return refs
}
