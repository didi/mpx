import { warn, type } from '@mpxjs/utils'
export default function directiveHelperMixin () {
  return {
    methods: {
      __getWxKey (item, key) {
        const value = key === '*this' ? item : item[key]
        if (typeof value === 'string' || typeof value === 'number') {
          return value
        } else {
          warn(`wx:key\'s value should return a string or a number, received: ${type(value)}`, this.__mpxProxy.options.mpxFileResource);
          return
        }
      }
    }
  }
}
