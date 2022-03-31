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

function checkMapInstance (maps, context, errorStr) {
  if (!context) {
    context = maps
    maps = null
  }
  if (Object.prototype.toString.call(context) != '[object Object]') {
    error(`调用${errorStr}时请传入当前component实例`)
  }
  return {
    context,
    maps
  }
}

export default function (store) {
  return {
    mapGetters: mapFactory('getters', store),
    mapMutations: mapFactory('mutations', store),
    mapActions: mapFactory('actions', store),
    mapState: mapFactory('state', store),
    // 以下是map**ToInstance用于异步store的map：depPath, maps, context
    mapStateToInstance: (depPath, mapsNs, contextComp) => {
      let { context, maps } = checkMapInstance(mapsNs, contextComp, 'mapStateToInstance')
      const mapStateFun =  mapFactory('state', store)
      const result = mapStateFun(depPath, maps)
      // 将result挂载到mpxProxy实例属性上
      const mpxProxyIns = context.__mpxProxy.options.computed || {}
      Object.assign(mpxProxyIns, result)
    },
    mapGettersToInstance: (depPath, mapsNs, contextComp) => {
      const { context, maps } = checkMapInstance(mapsNs, contextComp, 'mapGettersToInstance')
      const mapGet = mapFactory('getters', store)
      const result = mapGet(depPath, maps)
      const mpxProxyIns = context.__mpxProxy.options.computed || {}
      Object.assign(mpxProxyIns, result)
    },
    mapMutationsToInstance: (depPath, mapsNs, contextComp) => {
      const { context, maps } = checkMapInstance(mapsNs, contextComp, 'mapMutationsToInstance')
      const mapMutation = mapFactory('mutations', store)
      const result = mapMutation(depPath, maps)
      Object.assign(context, result)
    },
    mapActionsToInstance: (depPath, mapsNs, contextComp) => {
      const { context, maps } = checkMapInstance(mapsNs, contextComp, 'mapActionsToInstance')
      const mapAction = mapFactory('actions', store)
      const result = mapAction(depPath, maps)
      Object.assign(context, result)
    }
  }
}
