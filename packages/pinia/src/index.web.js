import {
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

function createPinia () {
  const webPinia = webCreatePinia()
  global.__mpx_pinia = webPinia
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