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
import { storeToRefs } from './storeToRefs'
import { isBrowser } from './util'

vue.use(PiniaVuePlugin)

function createPinia () {
  if (isBrowser) {
    const activePinia = getActivePinia()
    if (activePinia) {
      return activePinia
    }
  } else {
    if (!global.__mpxCreatePinia) {
      console.error('[@mpxjs/pinia error]: Pinia must be created in the onAppInit lifecycle!')
      return
    }
  }
  const pinia = webCreatePinia()
  global.__mpxPinia = pinia
  setActivePinia(pinia)
  return pinia
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
