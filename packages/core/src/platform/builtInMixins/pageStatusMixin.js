import { CREATED, ONLOAD, ONSHOW, ONHIDE } from '../../core/innerLifecycle'
import { isFunction } from '../../helper/utils'

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
        this.__mpxProxy.callHook(ONSHOW)
      },
      onHide () {
        this.mpxPageStatus = 'hide'
        this.__mpxProxy.callHook(ONHIDE)
      },
      onLoad (params) {
        this.__mpxProxy.callHook(ONLOAD, params)
      }
    }
    if (__mpx_mode__ === 'ali') {
      let count = 0
      pageMixin.events = {
        onResize (e) {
          this.__resizeEvent = e
          this.mpxPageStatus = `resize${count++}`
        }
      }
    }
    return pageMixin
  } else {
    return {
      // todo 时序待确认
      [CREATED] () {
        const options = this.__mpxProxy.options
        const hasShowHooks = this.__mpxProxy.hasHook(ONSHOW) || this.__mpxProxy.hasHook(ONHIDE)
        const needPageLifetimes = options.pageLifetimes && __mpx_mode__ === 'ali'

        if (hasShowHooks || needPageLifetimes) {
          let currentPage
          if (__mpx_mode__ === 'ali') {
            currentPage = this.$page
          } else {
            const pages = getCurrentPages()
            currentPage = pages[pages.length - 1]
          }
          if (currentPage) {
            // 初始第一次执行ONSHOW
            this.__mpxProxy.callHook(ONSHOW)
            this.$watch(() => currentPage.mpxPageStatus, (val) => {
              if (!val) return
              if (val === 'show') this.__mpxProxy.callHook(ONSHOW)
              if (val === 'hide') this.__mpxProxy.callHook(ONHIDE)
              if (needPageLifetimes) {
                const pageLifetimes = options.pageLifetimes
                if (/^resize/.test(val) && isFunction(pageLifetimes.resize)) {
                  // resize
                  pageLifetimes.resize.call(this, currentPage.__resizeEvent)
                } else if (isFunction(pageLifetimes[val])) {
                  // show & hide
                  pageLifetimes[val].call(this)
                }
              }
            }, {
              sync: true
            })
          }
        }
      }
    }
  }
}
