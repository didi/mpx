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
import { toRef } from '@mpxjs/core'
import { propsBlackList } from './const'

vue.use(PiniaVuePlugin)

function createPinia () {
  const webPinia = webCreatePinia()
  global.__mpx_pinia = webPinia
  return webPinia
}

function storeToRefs (store) {
  const refs = {}
  for (const key in store) {
    if (!propsBlackList.includes(key)) {
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
