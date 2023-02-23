import { getActivePinia } from './util'
import { warn } from '@mpxjs/utils'
/**
 * @description: allow use state/getters of a store in computed field
 * @param {*} useStore store to map from
 * @param {*} keysOrMapper array or object
 * @return {*} store[key]
 */
function mapState (useStore, keysOrMapper) {
  const pinia = getActivePinia()
  return Array.isArray(keysOrMapper)
    ? keysOrMapper.reduce((reduced, key) => {
      reduced[key] = function () {
        return useStore(pinia)[key]
      }
      return reduced
    }, {})
    : Object.keys(keysOrMapper).reduce((reduced, key) => {
      reduced[key] = function () {
        const store = useStore(pinia)
        const storeKey = keysOrMapper[key]
        return typeof storeKey === 'function'
          // eslint-disable-next-line
          ? storeKey.call(store, store)
          : store[storeKey]
      }
      return reduced
    }, {})
}

const mapGetters = mapState

/**
 * @description: allow to use actions of a store in computed field
 * @param {*} useStore store to map from
 * @param {*} keysOrMapper array or object
 * @return {*} store[key]
 */
function mapActions (useStore, keysOrMapper) {
  const pinia = getActivePinia()
  return Array.isArray(keysOrMapper)
    ? keysOrMapper.reduce((reduced, key) => {
      reduced[key] = function (...args) {
        return useStore(pinia)[key](...args)
      }
      return reduced
    }, {})
    : Object.keys(keysOrMapper).reduce((reduced, key) => {
      reduced[key] = function (...args) {
        return useStore(pinia)[keysOrMapper[key]](...args)
      }
      return reduced
    }, {})
}
/**
  *@description: allow to use writable state/getters of a store in computed field
  * @param useStore - store to map from
  * @param keysOrMapper - array or object
  */
function mapWritableState (useStore, keysOrMapper) {
  const pinia = getActivePinia()
  return Array.isArray(keysOrMapper)
    ? keysOrMapper.reduce((reduced, key) => {
      reduced[key] = {
        get () {
          return useStore(pinia)[key]
        },
        set (value) {
          return (useStore(pinia)[key] = value)
        }
      }
      return reduced
    }, {})
    : Object.keys(keysOrMapper).reduce((reduced, key) => {
      reduced[key] = {
        get () {
          return useStore(pinia)[keysOrMapper[key]]
        },
        set (value) {
          return (useStore(pinia)[keysOrMapper[key]] = value)
        }
      }
      return reduced
    }, {})
}

let mapStoreSuffix = 'Store'
/**
  * @description: Defaults to `"Store"`, change the suffix added by mapStores()
  * @param suffix - new suffix
  */
function setMapStoreSuffix (suffix) {
  mapStoreSuffix = suffix
}
/**
 * @description: allow to stores in computed field, to avoid writing too much props by calling mapstate/getter
 * @param stores - list of stores to map to an object
 */
function mapStores (...stores) {
  const pinia = getActivePinia()
  if ((process.env.NODE_ENV !== 'production') && Array.isArray(stores[0])) {
    warn('[🍍]: Directly pass all stores to "mapStores()" without putting them in an array:\n' +
        'Replace\n' +
        '\tmapStores([useAuthStore, useCartStore])\n' +
        'with\n' +
        '\tmapStores(useAuthStore, useCartStore)\n' +
        'This will fail in production if not fixed.')
    stores = stores[0]
  }
  return stores.reduce((reduced, useStore) => {
    reduced[useStore.$id + mapStoreSuffix] = function () {
      return useStore(pinia)
    }
    return reduced
  }, {})
}
export {
  mapStores,
  setMapStoreSuffix,
  mapState,
  mapGetters,
  mapActions,
  mapWritableState
}
