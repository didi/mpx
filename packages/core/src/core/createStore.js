import {
  observable,
  action,
  extendObservable
} from '../mobx'

import Vue from '../vue'

import {
  proxy,
  getByPath,
  defineGetterSetter
} from '../helper/utils'

import { warn } from '../helper/log'

// 兼容在web和小程序平台中创建表现一致的store

import mapStore from './mapStore'

function transformGetters (getters, module, store) {
  const newGetters = {}
  for (let key in getters) {
    if (key in store.getters) {
      warn(`Duplicate getter type: ${key}.`)
    }
    const getter = function () {
      if (store.withThis) {
        return getters[key].call({
          state: module.state,
          getters: module.getters,
          rootState: store.state
        })
      }
      return getters[key](module.state, store.getters, store.state)
    }
    if (__mpx_mode__ === 'web') {
      newGetters[key] = getter
    } else {
      defineGetterSetter(newGetters, key, getter)
    }
  }
  return newGetters
}

function transformMutations (mutations, module, store) {
  const newMutations = {}
  for (let key in mutations) {
    if (store.mutations[key]) {
      warn(`Duplicate mutation type: ${key}.`)
    }

    const mutation = function (...payload) {
      if (store.withThis) return mutations[key].apply({ state: module.state }, payload)
      return mutations[key](module.state, ...payload)
    }
    if (__mpx_mode__ === 'web') {
      newMutations[key] = mutation
    } else {
      newMutations[key] = action(mutation)
    }
  }
  return newMutations
}

function transformActions (actions, module, store) {
  const newActions = {}
  for (let key in actions) {
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

function mergeDeps (module, deps, getterKeys) {
  const mergeProps = ['state', 'getters', 'mutations', 'actions']
  Object.keys(deps).forEach(key => {
    const store = deps[key]
    mergeProps.forEach(prop => {
      if (module[prop] && (key in module[prop])) {
        warn(`Deps's name [${key}] conflicts with ${prop}'s key in current options.`)
      } else {
        module[prop] = module[prop] || {}
        if (prop === 'getters') {
          getterKeys.push(key)
        }
        if (__mpx_mode__ === 'web') {
          if (prop === 'getters') {
            module[prop][key] = () => store[prop]
          } else {
            module[prop][key] = store[prop]
          }
        } else {
          if (prop === 'state') {
            extendObservable(module[prop], {
              [key]: store[prop]
            })
          } else {
            module[prop][key] = store[prop]
          }
        }
      }
    })
  })
}

class Store {
  constructor (options) {
    this.withThis = options.withThis
    this.__wrappedGetters = {}
    this.__getterKeys = []
    this.getters = {}
    this.mutations = {}
    this.actions = {}
    this.state = this.registerModule(options).state
    this.resetStoreVM()
    Object.assign(this, mapStore(this))
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
      return mutation(...payload)
    }
  }

  registerModule (module) {
    const getterKeys = []
    const state = module.state || {}
    const reactiveModule = {
      state: __mpx_mode__ !== 'web' ? observable(state) : state
    }
    if (module.getters) {
      // mobx计算属性是不可枚举的，所以单独收集
      getterKeys.push.apply(getterKeys, Object.keys(module.getters))
      const getters = transformGetters(module.getters, reactiveModule, this)
      reactiveModule.getters = __mpx_mode__ !== 'web' ? observable(getters) : getters
    }
    if (module.mutations) {
      reactiveModule.mutations = transformMutations(module.mutations, reactiveModule, this)
    }
    if (module.actions) {
      reactiveModule.actions = transformActions(module.actions, reactiveModule, this)
    }
    if (module.deps) {
      mergeDeps(reactiveModule, module.deps, getterKeys)
    }
    // merge getters, 不能用Object.assign，会导致直接执行一次getter函数
    const thisGetters = __mpx_mode__ !== 'web' ? this.getters : this.__wrappedGetters
    reactiveModule.getters && proxy(thisGetters, reactiveModule.getters, getterKeys, true)
    // merge mutations
    Object.assign(this.mutations, reactiveModule.mutations)
    // merge actions
    Object.assign(this.actions, reactiveModule.actions)
    // 子module
    if (module.modules) {
      const childs = module.modules
      Object.keys(childs).forEach(key => {
        if (__mpx_mode__ === 'web') {
          reactiveModule.state[key] = this.registerModule(childs[key]).state
        } else {
          extendObservable(reactiveModule.state, {
            [key]: this.registerModule(childs[key]).state
          })
        }
      })
    }
    this.__getterKeys = this.__getterKeys.concat(getterKeys)
    return reactiveModule
  }

  resetStoreVM () {
    if (__mpx_mode__ === 'web') {
      this._vm = new Vue({
        data: {
          __mpxState: this.state
        },
        computed: this.__wrappedGetters
      })
      proxy(this.getters, this._vm, this.__getterKeys, true)
    }
  }
}

export default function createStore (options) {
  return new Store(options)
}

export function createStoreWithThis (options) {
  options.withThis = true
  return new Store(options)
}
