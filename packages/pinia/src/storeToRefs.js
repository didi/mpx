import { toRefs } from '@mpxjs/core'
/**
 * * @description: all the props extracted are reactive
 * * @param: store
 * @return {*} store
 */
export function storeToRefs (store) {
  return toRefs(store)
}
