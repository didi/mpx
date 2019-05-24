import {
  observable,
  action,
  extendObservable
} from 'mobx'

import {
  proxy,
  getByPath,
  defineGetter
} from '../helper/utils'

import mapStore from './mapStore'
function transformGetters (getters, module, store) {
  const newGetters = {}
  for (let key in getters) {
    if (key in store.getters) {
      console.warn('【MPX ERROR】', new Error(`duplicate getter type: ${key}`))
    }
    defineGetter(newGetters, key, function () {
      return getters[key](module.state, store.getters, store.state)
    })
  }
  return newGetters
}

function transformMutations (mutations, module, store) {
  const newMutations = {}
  for (let key in mutations) {
    if (store.mutations[key]) {
      console.warn('【MPX ERROR】', new Error(`duplicate mutation type: ${key}`))
    }
    newMutations[key] = action(function (...payload) {
      return mutations[key](module.state, ...payload)
    })
  }
  return newMutations
}

function transformActions (actions, module, store) {
  const newActions = {}
  for (let key in actions) {
    if (store.actions[key]) {
      console.warn('【MPX ERROR】', new Error(`duplicate action type: ${key}`))
    }
    newActions[key] = function (...payload) {
      const result = actions[key]({
        rootState: store.state,
        state: module.state,
        getters: store.getters,
        dispatch: store.dispatch.bind(store),
        commit: store.commit.bind(store)
      }, ...payload)
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
        console.warn('【MPX ERROR】', new Error(`deps's name: [${key}] conflicts with ${prop}'s key in current options`))
      } else {
        module[prop] = module[prop] || {}
        prop === 'getters' && getterKeys.push(key)
        prop === 'state' ? extendObservable(module[prop], {
          [key]: store[prop]
        }) : (module[prop][key] = store[prop])
      }
    })
  })
}

class Store {
  constructor (options) {
    this.getters = {}
    this.mutations = {}
    this.actions = {}
    this.state = this.registerModule(options).state
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
      console.warn('【MPX ERROR】', new Error(`unknown mutation type: ${type}`))
    } else {
      return mutation(...payload)
    }
  }

  registerModule (module) {
    const getterKeys = []
    const reactiveModule = {
      state: observable(module.state || {})
    }
    if (module.getters) {
      // mobx计算属性是不可枚举的，所以单独收集
      getterKeys.push.apply(getterKeys, Object.keys(module.getters))
      reactiveModule.getters = observable(transformGetters(module.getters, reactiveModule, this))
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
    reactiveModule.getters && proxy(this.getters, reactiveModule.getters, getterKeys, true)
    // merge mutations
    Object.assign(this.mutations, reactiveModule.mutations)
    // merge actions
    Object.assign(this.actions, reactiveModule.actions)
    // 子module
    if (module.modules) {
      const childs = module.modules
      Object.keys(childs).forEach(key => {
        extendObservable(reactiveModule.state, {
          [key]: this.registerModule(childs[key]).state
        })
      })
    }
    return reactiveModule
  }
}

export default function createStore (options) {
  return new Store(options)
}
