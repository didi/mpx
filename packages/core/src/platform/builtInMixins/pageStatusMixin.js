import { is } from '../../helper/env'

export default function pageStatusMixin (mixinType, options) {
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
      // 因为支付宝并不支持events的mixin，直接改写options
      options.events = Object.assign({
        onResize(e) {
          this.__mpxWindowSizeEvent = e
          this.mpxPageStatus = 'resize'
        }
      }, options.events)
    }
    return pageMixin
  } else {
    if (is('ali')) {
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
