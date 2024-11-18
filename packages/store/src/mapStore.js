import {
  warn,
  error,
  getByPath,
  isObject
} from '@mpxjs/utils'

import { computed } from '@mpxjs/core'

function normalizeMap (prefix, arr) {
  if (typeof prefix !== 'string') {
    arr = prefix
    prefix = ''
  }
  if (Array.isArray(arr)) {
    const map = {}
    arr.forEach(value => {
      map[value] = prefix ? `${prefix}.${value}` : value
    })
    return map
  }
  if (prefix && isObject(arr)) {
    arr = Object.assign({}, arr)
    Object.keys(arr).forEach(key => {
      if (typeof arr[key] === 'string') {
        arr[key] = `${prefix}.${arr[key]}`
      }
    })
  }
  return arr
}

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
          case 'getters': {
            let getterVal = getByPath(store.getters, value, '', '__NOTFOUND__')
            if (getterVal === '__NOTFOUND__') {
              warn(`Unknown getter named [${value}].`)
              getterVal = ''
            }
            return getterVal
          }
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
    error('调用map**ToInstance时必须传入当前component实例this')
  }

  args.splice(-1)

  return {
    restParams: args,
    context
  }
}

function mapComputedToInstance (result, context) {
  const options = __mpx_mode__ === 'web' ? context.$options : context.__mpxProxy.options
  options.computed = options.computed || {}
  Object.assign(options.computed, result)
}

export default function (store) {
  const mapState = mapFactory('state', store)
  const mapGetters = mapFactory('getters', store)
  const mapMutations = mapFactory('mutations', store)
  const mapActions = mapFactory('actions', store)

  return {
    mapState,
    mapGetters,
    mapMutations,
    mapActions,
    // map*ToRefs用于组合式API解构获取响应式数据
    mapStateToRefs: (...args) => {
      const result = {}
      Object.entries(mapState(...args)).forEach(([key, value]) => {
        result[key] = computed(value)
      })
      return result
    },
    mapGettersToRefs: (...args) => {
      const result = {}
      Object.entries(mapGetters(...args)).forEach(([key, value]) => {
        result[key] = computed(value)
      })
      return result
    },
    // 以下是map*ToInstance用于异步store的,参数args：depPath, maps, context
    mapStateToInstance: (...args) => {
      const { context, restParams } = checkMapInstance(args)
      const result = mapState(...restParams)
      // 将result挂载到mpxProxy实例属性上
      mapComputedToInstance(result, context)
    },
    mapGettersToInstance: (...args) => {
      const { context, restParams } = checkMapInstance(args)
      const result = mapGetters(...restParams)
      mapComputedToInstance(result, context)
    },
    mapMutationsToInstance: (...args) => {
      const { context, restParams } = checkMapInstance(args)
      const result = mapMutations(...restParams)
      Object.assign(context, result)
    },
    mapActionsToInstance: (...args) => {
      const { context, restParams } = checkMapInstance(args)
      const result = mapActions(...restParams)
      Object.assign(context, result)
    }
  }
}
