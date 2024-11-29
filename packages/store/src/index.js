import Mpx, { reactive, computed, effectScope } from '@mpxjs/core'
import createHummerPlugin from './builtInPlugins/hummerStorePlugin'
import {
  getByPath,
  warn,
  proxy
} from '@mpxjs/utils'

// 兼容在web和小程序平台中创建表现一致的store

import mapStore from './mapStore'

function transformGetters (getters, module, store) {
  const newGetters = {}
  for (const key in getters) {
    if (key in store.getters) {
      warn(`Duplicate getter type: ${key}.`)
    }
    const getter = function () {
      if (store.withThis) {
        return getters[key].call({
          state: module.state,
          getters: store.getters,
          rootState: store.state
        })
      }
      return getters[key](module.state, store.getters, store.state)
    }
    newGetters[key] = getter
  }
  return newGetters
}

function transformMutations (mutations, module, store) {
  const newMutations = {}
  for (const key in mutations) {
    if (store.mutations[key]) {
      warn(`Duplicate mutation type: ${key}.`)
    }
    const context = {
      state: module.state,
      commit: store.commit.bind(store)
    }
    const mutation = function (...payload) {
      if (store.withThis) return mutations[key].apply(context, payload)
      return mutations[key](module.state, ...payload)
    }
    newMutations[key] = mutation
  }
  return newMutations
}

function transformActions (actions, module, store) {
  const newActions = {}
  for (const key in actions) {
    if (store.actions[key]) {
      warn(`Duplicate action type: ${key}.`)
    }
    newActions[key] = function (...payload) {
      const context = {
        rootState: store.state,
        state: module.state,
        getters: store.getters,
        dispatch: store.dispatch.bind(store),
        commit: store.commit.bind(store)
      }

      let result
      if (store.withThis) {
        result = actions[key].apply(context, payload)
      } else {
        result = actions[key](context, ...payload)
      }
      // action一定返回一个promise
      if (result && typeof result.then === 'function' && typeof result.catch === 'function') {
        return result
      } else {
        return Promise.resolve(result)
      }
    }
  }
  return newActions
}

function mergeDeps (module, deps) {
  const mergeProps = ['state', 'getters', 'mutations', 'actions']
  Object.keys(deps).forEach(key => {
    const store = deps[key]
    mergeProps.forEach(prop => {
      if (module[prop] && (key in module[prop])) {
        warn(`Deps's name [${key}] conflicts with ${prop}'s key in current options.`)
      } else {
        module[prop] = module[prop] || {}
        if (prop === 'getters') {
          // depsGetters单独存放，不需要重新进行初始化
          module.depsGetters = module.depsGetters || {}
          module.depsGetters[key] = store.getters
          // module[prop][key] = () => store[prop]
        } else {
          module[prop][key] = store[prop]
        }
      }
    })
  })
}

class Store {
  constructor (options) {
    const {
      plugins = []
    } = options
    this.withThis = options.withThis
    this.__wrappedGetters = {}
    this.__depsGetters = {}
    this.getters = {}
    this.mutations = {}
    this.actions = {}
    this._subscribers = []
    this._scope = effectScope(true)
    this.state = this.registerModule(options).state
    this.resetStoreVM()
    Object.assign(this, mapStore(this))
    if (__mpx_mode__ === 'tenon') {
      plugins.push(createHummerPlugin({
        /* eslint-disable camelcase */
        store_key: `MPX_STORE${options.__store_id}`
      }))
    }
    plugins.forEach(plugin => plugin(this))
  }

  dispatch (type, ...payload) {
    const action = getByPath(this.actions, type)
    if (!action) {
      return Promise.reject(new Error(`unknown action type: ${type}`))
    } else {
      return action(...payload)
    }
  }

  commit (type, ...payload) {
    const mutation = getByPath(this.mutations, type)
    if (!mutation) {
      warn(`Unknown mutation type: ${type}.`)
    } else {
      mutation(...payload)
      return this._subscribers.slice().forEach(sub => sub({ type, payload }, this.state))
    }
  }

  subscribe (fn, options) {
    return genericSubscribe(fn, this._subscribers, options)
  }

  registerModule (module) {
    const state = module.state || {}
    const reactiveModule = __mpx_mode__ === 'tenon'
      ? Mpx.__vue.reactive({ state })
      : { state }
    if (module.getters) {
      reactiveModule.getters = transformGetters(module.getters, reactiveModule, this)
    }
    if (module.mutations) {
      reactiveModule.mutations = transformMutations(module.mutations, reactiveModule, this)
    }
    if (module.actions) {
      reactiveModule.actions = transformActions(module.actions, reactiveModule, this)
    }
    if (module.deps) {
      mergeDeps(reactiveModule, module.deps)
    }
    Object.assign(this.__depsGetters, reactiveModule.depsGetters)
    Object.assign(this.__wrappedGetters, reactiveModule.getters)
    // merge mutations
    Object.assign(this.mutations, reactiveModule.mutations)
    // merge actions
    Object.assign(this.actions, reactiveModule.actions)
    // 子module
    if (module.modules) {
      const childs = module.modules
      Object.keys(childs).forEach(key => {
        reactiveModule.state[key] = this.registerModule(childs[key]).state
      })
    }
    return reactiveModule
  }

  resetStoreVM () {
    this._scope.run(() => {
      if (__mpx_mode__ === 'web') {
        const Vue = Mpx.__vue
        const vm = new Vue({
          data: {
            __mpxState: this.state
          },
          computed: this.__wrappedGetters
        })
        const computedKeys = Object.keys(this.__wrappedGetters)
        proxy(this.getters, vm, computedKeys)
        proxy(this.getters, this.__depsGetters)
      } else if (__mpx_mode__ === 'tenon') {
        const computedObj = {}
        Object.keys(this.__wrappedGetters).forEach(k => {
          const getter = this.__wrappedGetters[k]
          computedObj[k] = () => getter(this.state)
          Object.defineProperty(this.getters, k, {
            get: () => computedObj[k](),
            enumerable: true // for local getters
          })
        })
      } else {
        reactive(this.state)
        const computedObj = {}
        Object.entries(this.__wrappedGetters).forEach(([key, value]) => {
          computedObj[key] = computed(value)
        })
        proxy(this.getters, computedObj)
        proxy(this.getters, this.__depsGetters)
      }
    })
  }

  /**
   * 替换state，tenon环境中使用
   */
  replaceState (state) {
    // todo 某些key可能无法删除
    Object.assign(this.state, state)
    // this.resetStoreVM()
  }

  _withCommit (fn) {
    fn()
  }
}

function genericSubscribe (fn, subs, options) {
  if (subs.indexOf(fn) < 0) {
    options && options.prepend
      ? subs.unshift(fn)
      : subs.push(fn)
  }
  return () => {
    const i = subs.indexOf(fn)
    if (i > -1) {
      subs.splice(i, 1)
    }
  }
}

export function createStore (options) {
  return new Store(options)
}

// ts util functions
export function createStateWithThis (state) {
  return state
}

export function createGettersWithThis (getters, options = {}) {
  return getters
}

export function createMutationsWithThis (mutations, options = {}) {
  return mutations
}

export function createActionsWithThis (actions, options = {}) {
  return actions
}

export function createStoreWithThis (options) {
  options.withThis = true
  return new Store(options)
}
