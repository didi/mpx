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
      console.warn(new Error(`duplicate getter type: ${key}`))
    }
    if (typeof getters[key] === 'function') {
      defineGetter(newGetters, key, function () {
        return getters[key](module.state, store.getters, store.state)
      })
    } else {
      newGetters[key] = getters[key]
    }
  }
  return newGetters
}

function transformMutations (mutations, module, store) {
  const newMutations = {}
  for (let key in mutations) {
    if (store.mutations[key]) {
      console.warn(new Error(`duplicate mutation type: ${key}`))
    }
    newMutations[key] = typeof mutations[key] === 'function' ? action(function (...payload) {
      return mutations[key](module.state, ...payload)
    }) : mutations[key]
  }
  return newMutations
}

function transformActions (actions, module, store) {
  const newActions = {}
  for (let key in actions) {
    if (store.actions[key]) {
      console.warn(new Error(`duplicate action type: ${key}`))
    }
    newActions[key] = typeof actions[key] === 'function' ? function (...payload) {
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
    } : actions[key]
  }
  return newActions
}

function mergeDeps (options) {
  const stores = options.deps
  if (!stores) return options
  const mergeProps = ['state', 'getters', 'mutations', 'actions']
  Object.keys(stores).forEach(key => {
    const store = stores[key]
    mergeProps.forEach(prop => {
      if (options[prop] && (key in options[prop])) {
        console.warn(new Error(`deps's name: [${key}] conflicts with ${prop}'s key in current options`))
      } else {
        options[prop] = options[prop] || {}
        options[prop][key] = store[prop]
      }
    })
  })
  delete options.deps
  return options
}

class Store {
  constructor (options) {
    options = mergeDeps(options)
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
      console.warn(new Error(`unknown mutation type: ${type}`))
    } else {
      return mutation(...payload)
    }
  }

  registerModule (module) {
    const reactiveModuleOption = {
      state: module.state || {}
    }
    const reactiveModule = observable(reactiveModuleOption)
    if (module.getters) {
      extendObservable(reactiveModule, {
        getters: transformGetters(module.getters, reactiveModule, this)
      })
      // 使用proxy，保证store.getters的属性是可观察的
      proxy(this.getters, reactiveModule.getters, Object.keys(module.getters), true)
    }
    if (module.mutations) {
      Object.assign(this.mutations, transformMutations(module.mutations, reactiveModule, this))
    }
    if (module.actions) {
      Object.assign(this.actions, transformActions(module.actions, reactiveModule, this))
    }
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
