import {
  normalizeMap,
  getByPath
} from '../helper/utils'

import { warn, error } from '../helper/log'

function mapFactory (type, store) {
  return function (depPath, maps) {
    maps = normalizeMap(depPath, maps)
    const result = {}
    Object.entries(maps).forEach(([key, value]) => {
      result[key] = function (payload) {
        switch (type) {
          case 'state':
            if (typeof value === 'function') {
              return value.call(this, store.state, store.getters)
            } else {
              let stateVal = getByPath(store.state, value, '', '__NOTFOUND__')
              if (stateVal === '__NOTFOUND__') {
                warn(`Unknown state named [${value}].`)
                stateVal = ''
              }
              return stateVal
            }
          case 'getters':
            let getterVal = getByPath(store.getters, value, '', '__NOTFOUND__')
            if (getterVal === '__NOTFOUND__') {
              warn(`Unknown getter named [${value}].`)
              getterVal = ''
            }
            return getterVal
          case 'mutations':
            return store.commit(value, payload)
          case 'actions':
            return store.dispatch(value, payload)
        }
      }
    })
    return result
  }
}

function checkMapInstance (args) {
  const context = args[args.length - 1]
  const isValid = context && typeof context === 'object' && context.__mpxProxy
  if (!isValid) {
    error(`调用map**ToInstance时必须传入当前component实例this`)
  }

  args.splice(-1)

  return {
    restParams: args,
    context
  }
}

export default function (store) {
  return {
    mapGetters: mapFactory('getters', store),
    mapMutations: mapFactory('mutations', store),
    mapActions: mapFactory('actions', store),
    mapState: mapFactory('state', store),
    // 以下是map**ToInstance用于异步store的,参数args：depPath, maps, context
    mapStateToInstance: (...args) => {
      const { context, restParams } = checkMapInstance(args)
      const mapStateFun = mapFactory('state', store)
      const result = mapStateFun(...restParams)
      // 将result挂载到mpxProxy实例属性上
      context.__mpxProxy.options.computed = context.__mpxProxy.options.computed || {}
      Object.assign(context.__mpxProxy.options.computed, result)
    },
    mapGettersToInstance: (...args) => {
      const { context, restParams } = checkMapInstance(args)
      const mapGetFun = mapFactory('getters', store)
      const result = mapGetFun(...restParams)
      context.__mpxProxy.options.computed = context.__mpxProxy.options.computed || {}
      Object.assign(context.__mpxProxy.options.computed, result)
    },
    mapMutationsToInstance: (...args) => {
      const { context, restParams } = checkMapInstance(args)
      const mapMutationFun = mapFactory('mutations', store)
      const result = mapMutationFun(...restParams)
      Object.assign(context, result)
    },
    mapActionsToInstance: (...args) => {
      const { context, restParams } = checkMapInstance(args)
      const mapActionFun = mapFactory('actions', store)
      const result = mapActionFun(...restParams)
      Object.assign(context, result)
    }
  }
}
