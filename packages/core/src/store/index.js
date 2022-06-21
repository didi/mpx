import createStore from './createStore'
import { computed } from '../observer/computed'
import {
  ref,
  toRefs,
  isRef,
  toRef
} from '../observer/ref'
import { 
  set,
  reactive,
  isReactive 
} from '../observer/reactive'
import { effectScope } from '../observer/effectScope'
import { isEmptyObject } from '../helper/utils'
import { isComputed } from './util'

const { assign } = Object

/**
 * @description: create options store
 * @param id: store id
 * @param options: storeOptions
 * @param mpxStore: global mpxStore instance
 * @return {*} options store
 */
function createOptionsStore (id, options, mpxStore) {
  const { state, actions, getters } = options
  // @todo sometimes ref state transfered is not reactive, its wired
  const initialState = mpxStore.state?.value[id]
  let store

  const setup = () => {
    if (!initialState) {
      // to create ref state for current store instance to build state tree
      const _buildState = state ? state() : {}
      mpxStore.state[id] = _buildState
    }
    // to get local state
    const localState = state ? toRefs(state()) : toRefs({})
    // wrap getters with computed
    const computedGetters = Object.keys(getters || {}).reduce((cGetters, name) => {
      cGetters[name] = computed(() => {
          const store = mpxStore._s.get(id)
          return getters[name].call(store, store)
        })
      return cGetters
    }, {})
    return assign(
      localState,
      actions,
      computedGetters
    )
  }
  store = createSetupStore(id ,setup, options, mpxStore)
  console.error('createOptionsStore-return', store, mpxStore)
  return store
}

/**
 * @description: create setup store
 * @param id: store id
 * @param setup: function
 * @param options: storeOptions
 * @param mpxStore: global mpxStore instance
 * @return {*} setup store
 */
function createSetupStore($id, _setup, options = {}, mpxStore) {
  let scope
  const buildState = options?.state || {}
  const optionsForPlugin = assign({actions: {}}, options)
  const initialState = mpxStore.state[$id]
  const tempObj = new Object()
  tempObj[$id] = {}
  if (!initialState) mpxStore.state = assign({}, tempObj)
  // component store
  const partialStore = {
    _mpxStore: mpxStore,
    $id
  }
  // set store reactive and store it in global mpxStore
  const store = reactive(assign({}, partialStore))
  mpxStore._s.set($id, store)

  const setupStore = mpxStore._e.run(() => {
    // to set child scope
    scope = effectScope()
    return scope.run(() => _setup())
  })
  for (const key in setupStore) {
    const prop = setupStore[key]
    // @todo isComputed
    if (isRef(prop)) {
      mpxStore.state[$id][key] = prop
    } else if (typeof prop === 'function') {
      // @todo wrapAction
      const actionValue = prop
      setupStore[key] = actionValue
      optionsForPlugin.actions[key] = prop
    }
  }
  assign(store, setupStore)
  console.error('createSetupStore-return', store, mpxStore)
  return store
}

/**
 * @description: create options|setup store
 * @param idOrOptions: store id should be unique, required
 * @param setup: optional
 * @param setupOptions: optional
 * @return {*} mpxStore instance
 */
export function defineStore(idOrOptions, setup, setupOptions) {
  let id = ''
  let options = Object.create({})
  const isSetupStore = typeof setup === 'function'

   // create global mpxStore
   if (!global.mpxStore) {
    global.mpxStore = createStore()
  }

  // get config info of id/options 
  if (typeof idOrOptions === 'string') {
    id = idOrOptions
    options = isSetupStore ? setupOptions : setup
  } else {
    options = idOrOptions
    id = idOrOptions.id
  }
  /**
   * @description: to create store
   * @return generic store
   */  
  function useStore () {
    if (!global.mpxStore._s.has(id)) {
      if (isSetupStore) {
        createSetupStore(id, setup, options, global.mpxStore)
      } else {
        createOptionsStore(id, options, global.mpxStore)
      }
    }
    const store = global.mpxStore._s.get(id)
    return store
  }
  useStore.$id = id
  console.error('defineStore-global.mpxStore', global.mpxStore)
  return useStore
}