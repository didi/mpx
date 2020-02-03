import { BEFORECREATE } from '../../core/innerLifecycle'
import { observable } from '../../mobx'

export default function i18nMixin () {
  if (global.i18n) {
    return {
      data: {
        mpxLocale: global.i18n.locale || 'zh-CN'
      },
      [BEFORECREATE] () {
        this.$i18n = observable({ locale: global.i18n.locale })
        this.$watch(() => {
          return global.i18n.locale
        }, (locale) => {
          this.mpxLocale = this.$i18n.locale = locale
        }, {
          sync: true
        })

        this.$watch(() => {
          return this.$i18n.locale
        }, (locale) => {
          this.mpxLocale = locale
        }, {
          sync: true
        })
        // 挂载翻译方法
        if (global.i18n.methods) {
          Object.keys(global.i18n.methods).forEach((methodName) => {
            this['$' + methodName] = (...args) => {
              args.unshift(this.mpxLocale)
              return global.i18n.methods[methodName].apply(this, args)
            }
          })
        }
      }
    }
  }
}
