import {
  normalizeMap,
  getByPath
} from '../helper/utils'

import { warn } from '../helper/log'

function mapFactory (type, store) {
  return function (depPath, maps) {
    maps = normalizeMap(depPath, maps)
    const result = {}
    for (let key in maps) {
      result[key] = function (payload) {
        const value = maps[key]
        if (type === 'mutations') {
          return store.commit(value, payload)
        } else if (type === 'actions') {
          return store.dispatch(value, payload)
        } else {
          let getterVal = getByPath(store.getters, value, '', '__NOTFOUND__')
          if (getterVal === '__NOTFOUND__') {
            warn(`Unknown getter named [${value}].`)
            getterVal = ''
          }
          return getterVal
        }
      }
    }
    return result
  }
}

function checkMapInstance (maps, context, errorStr) {
  if (!context) {
    context = maps
    maps = null
  }
  if (Object.prototype.toString.call(context) != '[object Object]') {
    console.error(`调用${errorStr}时请传入当前component实例`)
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
    mapState: (depPath, maps) => {
      maps = normalizeMap(depPath, maps)
      const result = {}
      Object.keys(maps).forEach(key => {
        const value = maps[key]
        result[key] = function () {
          if (typeof value === 'function') {
            return value.call(this, store.state, store.getters)
          } else if (typeof value === 'string') {
            return getByPath(store.state, value)
          }
        }
      })
      return result
    },
    // 以下map**ToInstance用于异步store
    mapStateToInstance: (depPath, mapsNs, contextComp) => {
      let { context, maps } = checkMapInstance(mapsNs, contextComp, 'mapStateToInstance')
      maps = normalizeMap(depPath, maps)
      const result = {}
      Object.keys(maps).forEach(key => {
        const value = maps[key]
        result[key] = function () {
          if (typeof value === 'function') {
            return value.call(this, store.state, store.getters)
          } else if (typeof value === 'string') {
            return getByPath(store.state, value)
          }
        }
      })
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
