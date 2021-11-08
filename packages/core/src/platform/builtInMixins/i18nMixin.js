import { BEFORECREATE } from '../../core/innerLifecycle'
import { observe } from '../../observer/index'

export default function i18nMixin () {
  if (global.i18n) {
    return {
      // 替换为dataFn注入，再每次组件创建时重新执行获取，处理reLaunch后无法拿到更新后语言的问题
      data () {
        return { mpxLocale: global.i18n.locale || 'zh-CN' }
      },
      [BEFORECREATE] () {
        this.$i18n = { locale: global.i18n.locale }
        observe(this.$i18n)
        this.$watch(() => {
          return global.i18n.locale
        }, (locale) => {
          this.mpxLocale = this.$i18n.locale = locale
        }, {
          sync: true,
          pausable: false
        })

        this.$watch(() => {
          return this.$i18n.locale
        }, (locale) => {
          this.mpxLocale = locale
        }, {
          sync: true,
          pausable: false
        })
        // 挂载翻译方法
        if (global.i18nMethods) {
          Object.keys(global.i18nMethods).forEach((methodName) => {
            if (/^__/.test(methodName)) return
            this['$' + methodName] = (...args) => {
              // tap i18n.version
              args.unshift((global.i18n.version, this.mpxLocale))
              return global.i18nMethods[methodName].apply(this, args)
            }
          })
        }
      }
    }
  }
}
