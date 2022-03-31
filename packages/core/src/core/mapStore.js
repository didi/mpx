import {
  normalizeMap,
  getByPath
} from '../helper/utils'

import { warn } from '../helper/log'

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
          case  'actions':
            return store.dispatch(value, payload)
        }
      }
    })
    return result
  }
}

export default function (store) {
  return {
    mapGetters: mapFactory('getters', store),
    mapMutations: mapFactory('mutations', store),
    mapActions: mapFactory('actions', store),
    mapState: mapFactory('state', store)
  }
}
