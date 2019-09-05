
export default function pageStatusMixin (mixinType) {
  if (mixinType === 'page') {
    return {
      data: {
        mpxPageStatus: 'show'
      },
      onShow () {
        this.mpxPageStatus = 'show'
      },
      onHide () {
        this.mpxPageStatus = 'hide'
      }
    }
  } else {
    if (__mpx_mode__ === 'ali') {
      return {
        watch: {
          '$page.mpxPageStatus': {
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
    } else {
      return {
        properties: {
          mpxPageStatus: {
            type: String
          }
        },
        watch: {
          mpxPageStatus: {
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
