import vue from 'vue'
import { createPinia } from 'pinia'

const pinia = createPinia()
vue.use(pinia)

export {
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
