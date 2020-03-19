export default function pageStatusMixin (mixinType) {
  // 只有tt和ali没有pageLifeTimes支持，需要框架实现，其余平台一律使用原生pageLifeTimes
  if (__mpx_mode__ === 'tt' || __mpx_mode__ === 'ali') {
    if (mixinType === 'page') {
      const pageMixin = {
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
      if (__mpx_mode__ === 'ali') {
        Object.assign(pageMixin, {
          events: {
            onResize (e) {
              this.__resizeEvent = e
              this.mpxPageStatus = 'resize'
            }
          }
        })
      }
      return pageMixin
    } else {
      if (__mpx_mode__ === 'ali') {
        return {
          watch: {
            '$page.mpxPageStatus': {
              handler (val) {
                if (val) {
                  const pageLifetimes = this.$rawOptions.pageLifetimes
                  if (pageLifetimes) {
                    if (val === 'show' && typeof pageLifetimes.show === 'function') pageLifetimes.show.call(this)
                    if (val === 'hide' && typeof pageLifetimes.hide === 'function') pageLifetimes.hide.call(this)
                    if (val === 'resize' && typeof pageLifetimes.resize === 'function') pageLifetimes.resize.call(this, this.__resizeEvent)
                  }
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
                  const pageLifetimes = this.$rawOptions.pageLifetimes
                  if (pageLifetimes) {
                    if (val === 'show' && typeof pageLifetimes.show === 'function') pageLifetimes.show.call(this)
                    if (val === 'hide' && typeof pageLifetimes.hide === 'function') pageLifetimes.hide.call(this)
                  }
                }
              },
              immediate: true
            }
          }
        }
      }
    }
  }
}
