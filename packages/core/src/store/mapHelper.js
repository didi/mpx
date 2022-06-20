import { getCurrentInstance } from '../core/proxy'
import { isRef } from '../observer/ref'
/**
 * @description: for mapping state/getters from store
 * @param {*} store target store
 * @param {*} keys keys
 * @return {*} store[key]
 */
export function mapState(store, keys) {
  // @todo get instance failed here
  const instance = getCurrentInstance()
  return Array.isArray(keys)
    ? keys.reduce((reduced, key) => {
        reduced[key] = function () {
          // @todo tobe checked
          return isRef(store(global.mpxStore)[key].value) ? (store(global.mpxStore)[key].value).value : store(global.mpxStore)[key].value
        }
        return reduced
      }, {})
    : Object.keys(keys).reduce((reduced, key) => {
        reduced[key] = function () {
          const _store = store(global.mpxStore)
          const storeKey = keys[key]
          return typeof storeKey === 'function'
            ? storeKey.call(_store, _store).value
            : _store[storeKey].value
        }
        return reduced
      }, {})
}

export const mapGetters = mapState

/**
 * @description: for mapping actions from store
 * @param {*} store target store
 * @param {*} keys keys
 * @return {*} store[key]
 */
export function mapActions(store, keys) {
  // const instance = getCurrentInstance()
  return Array.isArray(keys)
    ? keys.reduce((reduced, key) => {
        reduced[key] = function (...args) {
          return store(global.mpxStore)[key](...args)
        }
        return reduced
      }, {})
    : Object.keys(keys).reduce((reduced, key) => {
        reduced[key] = function (...args) {
          return store(global.mpxStore)[keys[key]](...args)
        }
        return reduced
      }, {})
}