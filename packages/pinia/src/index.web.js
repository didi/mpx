import vue from 'vue'
import {
  PiniaVuePlugin,
  createPinia as webCreatePinia,
  defineStore,
  getActivePinia,
  setActivePinia,
  mapStores,
  setMapStoreSuffix,
  mapState,
  mapGetters,
  mapActions,
  mapWritableState
} from 'pinia'
import { isRef, isReactive, toRef } from '@mpxjs/core'
import { isFunction } from '@mpxjs/utils'

vue.use(PiniaVuePlugin)

function createPinia () {
  const webPinia = webCreatePinia()
  global.__mpx_pinia = webPinia
  return webPinia
}

function storeToRefs (store) {
  let refs = {}
  const isNotNativeProps = prop => {
    return typeof prop === 'string' && prop[0] !== '$' && prop[0] !== '_'
  }
  for (let key in store) {
    const value = store[key]
    if (isNotNativeProps(key) && !isRef(value) && !isReactive(value) && !isFunction(value)) {
      refs[key] = toRef(store, key)
    }
  }
  return refs
}

export {
  createPinia,
  defineStore,
  getActivePinia,
  setActivePinia,
  mapStores,
  setMapStoreSuffix,
  mapState,
  mapGetters,
  mapActions,
  mapWritableState,
  storeToRefs
}
