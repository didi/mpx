import { isObject, likeArray } from '../../helper/utils'
import { toJS, isObservable, get, isObservableArray } from 'mobx'

export default function renderHelperMixin () {
  return {
    methods: {
      __iterate (val, handler) {
        let i, l, keys, key
        if (likeArray(val) || typeof val === 'string') {
          for (i = 0, l = val.length; i < l; i++) {
            handler(val[i], i)
          }
        } else if (typeof val === 'number') {
          for (i = 0; i < val; i++) {
            handler(i + 1, i)
          }
        } else if (isObject(val)) {
          keys = Object.keys(val)
          for (i = 0, l = keys.length; i < l; i++) {
            key = keys[i]
            handler(val[key], key, i)
          }
        }
      },
      __travel (val, __seen = []) {
        // render函数中深度遍历对象，处理props传递问题
        if (isObservable(val) && __seen.indexOf(val) === -1) {
          toJS(val, false)
          __seen.push(val)
        }
        return val
      },
      __checkIgnore (exp, hasIgnore = false) {
        if (hasIgnore) {
          throw new Error('Expressions in wx:if/wx:elif/wx:for can not contain wxs module data.')
        }
        return exp
      },
      __get (target, property) {
        if (isObservable(target) && !isObservableArray(target)) {
          return get(target, property)
        }
        return target[property]
      }
    }
  }
}
