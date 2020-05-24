export default function pageStatusMixin (mixinType) {
  // 只有tt和ali没有pageLifeTimes支持，需要框架实现，其余平台一律使用原生pageLifeTimes
  // 由于业务上大量使用了pageShow进行初始化。。。下个版本再移除非必要的pageShow/Hide实现。。。
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
                const options = this.$rawOptions
                if (val === 'show' && typeof options.pageShow === 'function') options.pageShow.call(this)
                if (val === 'hide' && typeof options.pageHide === 'function') options.pageHide.call(this)
                const pageLifetimes = options.pageLifetimes
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
    } else if (__mpx_mode__ === 'qa') {
      return {
        props: {
          'mpxPageStatus': {
            type: String
          }
        },
        watch: {
          'mpxPageStatus': {
            handler (val) {
              if (val) {
                const options = this.$rawOptions
                console.log(options, 'optionsoptions')
                if (val === 'show' && typeof options.pageShow === 'function') options.pageShow.call(this)
                if (val === 'hide' && typeof options.pageHide === 'function') options.pageHide.call(this)
                const pageLifetimes = options.pageLifetimes
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
                const options = this.$rawOptions
                if (val === 'show' && typeof options.pageShow === 'function') options.pageShow.call(this)
                if (val === 'hide' && typeof options.pageHide === 'function') options.pageHide.call(this)
                if (__mpx_mode__ === 'tt') {
                  const pageLifetimes = this.$rawOptions.pageLifetimes
                  if (pageLifetimes) {
                    if (val === 'show' && typeof pageLifetimes.show === 'function') pageLifetimes.show.call(this)
                    if (val === 'hide' && typeof pageLifetimes.hide === 'function') pageLifetimes.hide.call(this)
                  }
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
