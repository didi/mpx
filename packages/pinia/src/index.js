import {
  computed,
  toRefs,
  isRef,
  reactive,
  isReactive,
  set,
  effectScope,
  watch,
  nextTick,
  getCurrentInstance,
  markRaw
} from '@mpxjs/core'
import { error as Error, warn } from '@mpxjs/utils'
import { createPinia } from './createPinia'
import { MutationType } from './const'
import {
  isComputed,
  mergeReactiveObjects,
  activePinia,
  getActivePinia,
  setActivePinia
} from './util'
import {
  addSubscription,
  triggerSubscriptions
} from './subscription'
import {
  mapStores,
  setMapStoreSuffix,
  mapState,
  mapGetters,
  mapActions,
  mapWritableState
} from './mapHelper'
import { storeToRefs } from './storeToRefs'

const { assign } = Object

const skipHydrateMap = /* #__PURE__ */ new WeakMap()
function shouldHydrate (obj) {
  return !skipHydrateMap.has(obj)
}

/**
 * @description: create options store
 * @param id: store id
 * @param options: storeOptions
 * @param pinia: global pinia
 * @return {*} options store
 */
function createOptionsStore (id, options, pinia) {
  const { state, actions, getters } = options
  const initialState = pinia.state.value[id]
  let store = {}

  function setupFn () {
    if (!initialState) {
      // init state
      set(pinia.state.value, id, state ? state() : {})
    }
    // to make state reactive
    const localState = toRefs(pinia.state.value[id])
    return assign(localState, actions, Object.keys(getters || {}).reduce((computedGetters, name) => {
      // to wrap getters with computed to be reactive
      computedGetters[name] = markRaw(computed(() => {
        setActivePinia(pinia)
        const store = pinia._s.get(id)
        return getters[name].call(store, store)
      }))
      return computedGetters
    }, {}))
  }
  store = createSetupStore(id, setupFn, options, pinia, true)
  store.$reset = function $reset () {
    const newState = state ? state() : {}
    this.$patch(($state) => {
      assign($state, newState)
    })
  }
  return store
}

/**
 * @description: create setup store
 * @param $id: store id
 * @param setup: function
 * @param options: storeOptions
 * @param pinia: global pinia
 * @param isOptionsStore to create options store
 * @return {*} setup store
 */
function createSetupStore ($id, setup, options = {}, pinia, isOptionsStore = false) {
  let scope
  const optionsForPlugin = assign({ actions: {} }, options)
  if ((process.env.NODE_ENV !== 'production') && !pinia._e.active) {
    throw new Error('Pinia destroyed')
  }
  const $subscribeOptions = {
    deep: true
    // flush: 'post',
  }
  if ((process.env.NODE_ENV !== 'production')) {
    $subscribeOptions.onTrigger = (event) => {
      if (isListening) {
        debuggerEvents = event
      } else if (isListening === false) {
        if (Array.isArray(debuggerEvents)) {
          debuggerEvents.push(event)
        } else {
          Error('🍍 debuggerEvents should be an array. This is most likely an internal Pinia bug.')
        }
      }
    }
  }

  // internal state
  let isListening
  let isSyncListening
  let subscriptions = markRaw([])
  let actionSubscriptions = markRaw([])
  let debuggerEvents
  const initialState = pinia.state.value[$id]
  if (!isOptionsStore && !initialState) {
    set(pinia.state.value, $id, {})
  }

  let activeListener
  function $patch (stateOrMutator) {
    if (isOptionsStore) {
      if (this && this.$id === $id) {
        this && Object.assign({}, this)
      }
    }
    let subscriptionMutation
    isListening = isSyncListening = false
    // reset the debugger events since patches are sync
    if ((process.env.NODE_ENV !== 'production')) {
      debuggerEvents = []
    }
    if (typeof stateOrMutator === 'function') {
      stateOrMutator(pinia.state.value[$id])
      subscriptionMutation = {
        type: MutationType.patchFunction,
        storeId: $id,
        events: debuggerEvents
      }
    } else {
      mergeReactiveObjects(pinia.state.value[$id], stateOrMutator)
      subscriptionMutation = {
        type: MutationType.patchObject,
        payload: stateOrMutator,
        storeId: $id,
        events: debuggerEvents
      }
    }
    // eslint-disable-next-line
    const myListenerId = (activeListener = Symbol())
    isSyncListening = true
    nextTick().then(() => {
      if (activeListener === myListenerId) {
        isListening = true
      }
    })
    triggerSubscriptions(subscriptions, subscriptionMutation, pinia.state.value[$id])
  }

  const $reset = (process.env.NODE_ENV !== 'production')
    ? () => {
        throw new Error(`🍍: Store "${$id}" is build using the setup syntax and does not implement $reset().`)
      }
    : () => {}

  function $dispose () {
    scope.stop()
    // clean data
    subscriptions = []
    actionSubscriptions = []
    pinia._s.delete($id)
  }
  /**
  * Wraps an action to handle subscriptions.
  * @param name - name of the action
  * @param action - action to wrap
  * @returns a wrapped action to handle subscriptions
  */
  function wrapAction (name, action) {
    return function () {
      setActivePinia(pinia)
      const args = Array.from(arguments)
      const afterCallbackList = []
      const onErrorCallbackList = []
      function after (callback) {
        afterCallbackList.push(callback)
      }
      function onError (callback) {
        onErrorCallbackList.push(callback)
      }
      triggerSubscriptions(actionSubscriptions, {
        args,
        name,
        store,
        after,
        onError
      })
      let ret
      try {
        ret = action.apply(this && this.$id === $id ? this : store, args)
        // handle sync errors
      } catch (error) {
        triggerSubscriptions(onErrorCallbackList, error)
        throw error
      }
      if (ret instanceof Promise) {
        return ret.then((value) => {
          triggerSubscriptions(afterCallbackList, value)
          return value
        }).catch((error) => {
          triggerSubscriptions(onErrorCallbackList, error)
          return Promise.reject(error)
        })
      }
      // allow the afterCallback to override the return value
      triggerSubscriptions(afterCallbackList, ret)
      return ret
    }
  }
  const partialStore = {
    _p: pinia,
    _s: scope,
    $id,
    $onAction: addSubscription.bind(null, actionSubscriptions),
    $patch,
    $reset,
    $subscribe (callback, options = {}) {
      const removeSubscription = addSubscription(subscriptions, callback, options.detached, () => stopWatcher())
      const stopWatcher = scope.run(() =>
        watch(() => pinia.state.value[$id], (state) => {
          if (options.flush === 'sync' ? isSyncListening : isListening) {
            // eslint-disable-next-line
            callback({
              storeId: $id,
              type: MutationType.direct,
              events: debuggerEvents
            }, state)
          }
        }, assign({}, $subscribeOptions, options))
      )
      return removeSubscription
    },
    $dispose
  }
  const store = reactive(assign({}, partialStore))
  // store the partial store now so the setup of stores can instantiate each other before they are finished without
  // creating infinite loops.
  pinia._s.set($id, store)
  const setupStore = pinia._e.run(() => {
    scope = effectScope()
    return scope.run(() => setup())
  })
  for (const key in setupStore) {
    const prop = setupStore[key]
    if ((isRef(prop) && !isComputed(prop)) || isReactive(prop)) {
      if (!isOptionsStore) {
        // in setup stores we must hydrate the state and sync pinia state tree with the refs the user just created
        if (initialState && shouldHydrate(prop)) {
          if (isRef(prop)) {
            prop.value = initialState[key]
          } else {
            // composition style ordinarily create ref or reactive prop
            mergeReactiveObjects(prop, initialState[key])
          }
        }
        // sync pinia
        set(pinia.state.value[$id], key, prop)
      }
    } else if (typeof prop === 'function') {
      const actionValue = wrapAction(key, prop)
      set(setupStore, key, actionValue)
      optionsForPlugin.actions[key] = prop
    }
  }
  // add props to store
  Object.keys(setupStore).forEach((key) => {
    set(store, key, setupStore[key])
  })
  // define $state
  Object.defineProperty(store, '$state', {
    get: () => pinia.state.value[$id],
    set: (state) => {
      $patch(($state) => {
        assign($state, state)
      })
    }
  })
  // apply all plugins
  pinia._p.forEach((extender) => {
    if ((process.env.NODE_ENV !== 'production')) {
      const extensions = scope.run(() => extender({
        store,
        app: pinia._a || getCurrentInstance(),
        pinia,
        options: optionsForPlugin
      }))
      assign(store, extensions)
    } else {
      assign(store, scope.run(() => extender({
        store,
        app: pinia._a || getCurrentInstance(),
        pinia,
        options: optionsForPlugin
      })))
    }
  })
  if ((process.env.NODE_ENV !== 'production') &&
    store.$state &&
    typeof store.$state === 'object' &&
    typeof store.$state.constructor === 'function' &&
    !store.$state.constructor.toString().includes('[native code]')) {
    warn('[🍍]: The "state" must be a plain object. It cannot be\n' +
        '\tstate: () => new MyClass()\n' +
        `Found in store "${store.$id}".`)
  }
  // only apply hydrate to option stores with an initial state in pinia
  if (initialState &&
      isOptionsStore &&
      options.hydrate) {
    options.hydrate(store.$state, initialState)
  }
  isListening = true
  isSyncListening = true
  nextTick().then(() => {
    isListening = true
  })

  return store
}
function defineStore (idOrOptions, setup, setupOptions) {
  let id
  let options
  const isSetupStore = typeof setup === 'function'
  if (typeof idOrOptions === 'string') {
    id = idOrOptions
    options = isSetupStore ? setupOptions : setup
  } else {
    options = idOrOptions
    id = idOrOptions.id
  }
  function useStore (pinia) {
    if ((process.env.NODE_ENV !== 'production') && !activePinia) {
      Error('[🍍]: getActivePinia was called with no active Pinia. Did you forget to install pinia?\n' +
          '\tconst pinia = createPinia()\n' +
          '\tapp.use(pinia)\n' +
          'This will fail in production.')
    }
    pinia = pinia || activePinia
    if (pinia) setActivePinia(pinia)
    if (!pinia._s.has(id)) {
      if (isSetupStore) {
        createSetupStore(id, setup, options, pinia)
      } else {
        createOptionsStore(id, options, pinia)
      }
      if ((process.env.NODE_ENV !== 'production')) {
        useStore._pinia = pinia
      }
    }
    const store = pinia._s.get(id)
    return store
  }

  useStore.$id = id
  return useStore
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
