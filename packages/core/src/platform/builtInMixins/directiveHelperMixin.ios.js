import { isObject } from '@mpxjs/utils'
export default function directiveHelperMixin () {
  return {
    methods: {
      __getWxKey (item, key, index) {
        if (key === 'index' || key === '_') {
          return index
        }
        const resolved = key === '*this' ? item : item[key]
        return isObject(resolved) ? index : resolved
      }
    }
  }
}
