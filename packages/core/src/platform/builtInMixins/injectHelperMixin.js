import {extend, concat, stringifyClass, normalizeDynamicStyle, parseStyleText, genStyleText} from '../../helper/utils'

export default function injectHelperMixin () {
  return {
    methods: {
      __transformClass (staticClass, dynamicClass) {
        if (typeof staticClass !== 'string') {
          return console.error('Template attr class must be a string!')
        }
        return concat(staticClass, stringifyClass(dynamicClass))
      },
      __transformStyle (staticStyle, dynamicStyle) {
        if (typeof staticStyle !== 'string') {
          return console.error('Template attr style must be a string!')
        }
        let normalizedDynamicStyle = normalizeDynamicStyle(dynamicStyle)
        let parsedStaticStyle = parseStyleText(staticStyle)
        return genStyleText(extend(parsedStaticStyle, normalizedDynamicStyle))
      }
    }
  }
}
