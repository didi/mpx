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
  mapWritableState,
  storeToRefs
} from 'pinia'

vue.use(PiniaVuePlugin)

function createPinia () {
  const webPinia = webCreatePinia()
  global.__mpx_pinia = webPinia
  return webPinia
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