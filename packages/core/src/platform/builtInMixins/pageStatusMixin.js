import { is } from '../../helper/env'
export default function pageStatusMixin (mixinType) {
  if (mixinType === 'page') {
    return {
      data: {
        __pageStatus: 'show'
      },
      onShow () {
        this.__pageStatus = 'show'
      },
      onHide () {
        this.__pageStatus = 'hide'
      }
    }
  } else {
    if (is('wx')) {
      return {
        properties: {
          __pageStatus: {
            type: String
          }
        },
        watch: {
          __pageStatus: {
            handler (val) {
              if (val) {
                const rawOptions = this.$rawOptions
                const callback = val === 'show'
                  ? rawOptions.pageShow
                  : rawOptions.pageHide
                typeof callback === 'function' && callback.call(this)
              }
            },
            immediate: true
          }
        }
      }
    } else if (is('ant')) {
      return {
        watch: {
          '$page.__pageStatus': {
            handler (val) {
              if (val) {
                const rawOptions = this.$rawOptions
                const callback = val === 'show'
                  ? rawOptions.pageShow
                  : rawOptions.pageHide
                typeof callback === 'function' && callback.call(this)
              }
            },
            immediate: true
          }
        }
      }
    }
  }
}
