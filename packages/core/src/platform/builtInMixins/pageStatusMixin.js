
export default function pageStatusMixin (mixinType) {
  if (mixinType === 'page') {
    let pageMixin = {
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
    if (is('ali')) {
      Object.assign(pageMixin, {
        events: {
          onResize (e) {
            this.__mpxWindowSizeEvent = e
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
                const rawOptions = this.$rawOptions
                let callback = () => {}
                if (val === 'show') callback = rawOptions.pageShow
                if (val === 'hide') callback = rawOptions.pageHide
                typeof callback === 'function' && callback.call(this)
              }
              // 让支付宝支持pageLifetimes
              const pageLifetimes = this.$rawOptions.pageLifetimes
              if (pageLifetimes) {
                if (val === 'show' && typeof pageLifetimes.show === 'function') pageLifetimes.show.call(this)
                if (val === 'hide' && typeof pageLifetimes.hide === 'function') pageLifetimes.hide.call(this)
                if (val === 'resize' && typeof pageLifetimes.resize === 'function') pageLifetimes.resize.call(this, this.__mpxWindowSizeEvent)
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
                let callback = () => {}
                if (val === 'show') callback = rawOptions.pageShow
                if (val === 'hide') callback = rawOptions.pageHide
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
