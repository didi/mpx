import { CREATED, ONLOAD, ONSHOW, ONHIDE, ONRESIZE } from '../../core/innerLifecycle'

export default function pageStatusMixin (mixinType) {
  const pageIdMixin = {
    methods: {
      getPageId () {
        if (this.__mpxProxy.options.__type__ === 'component') {
         return this.$page.$id
        } else {
          return this.$id
        }
      }
    }
  }
  if (mixinType === 'page') {
    const pageMixin = {
      onShow () {
        this.__mpxProxy.callHook(ONSHOW)
      },
      onHide () {
        this.__mpxProxy.callHook(ONHIDE)
      },
      onResize (e) {
        this.__mpxProxy.callHook(ONRESIZE, [e])
      },
      onLoad (query) {
        this.__mpxProxy.callHook(ONLOAD, [query])
      }
    }
    if (__mpx_mode__ === 'ali') {
      let count = 0
      const resolvedPromise = Promise.resolve()
      Object.assign(pageMixin, pageIdMixin, {
        data: {
          mpxPageStatus: null
        },
        onShow () {
          // 支付宝首次延时触发，确保同步组件的onShow能够执行
          if (this.mpxPageStatus === null) {
            resolvedPromise.then(() => {
              this.mpxPageStatus = 'show'
              this.__mpxProxy.callHook(ONSHOW)
            })
          } else {
            this.mpxPageStatus = 'show'
            this.__mpxProxy.callHook(ONSHOW)
          }
        },
        onHide () {
          this.mpxPageStatus = 'hide'
          this.__mpxProxy.callHook(ONHIDE)
        },
        events: {
          onResize (e) {
            this.__resizeEvent = e
            this.mpxPageStatus = `resize${count++}`
            this.__mpxProxy.callHook(ONRESIZE, [e])
          }
        }
      })
      delete pageMixin.onResize
    }
    return pageMixin
  } else {
    if (__mpx_mode__ === 'ali') {
      return Object.assign(pageIdMixin, {
        [CREATED] () {
          const options = this.__mpxProxy.options
          const hasHook = this.__mpxProxy.hasHook.bind(this.__mpxProxy)
          const hasHooks = hasHook(ONSHOW) || hasHook(ONHIDE) || hasHook(ONRESIZE)
          const pageLifetimes = options.pageLifetimes
          const currentPage = this.$page

          if ((hasHooks || pageLifetimes) && currentPage) {
            this.$watch(() => currentPage.mpxPageStatus, (val) => {
              if (!val) return
              if (val === 'show') {
                this.__mpxProxy.callHook(ONSHOW)
                return pageLifetimes?.show?.call(this)
              }
              if (val === 'hide') {
                this.__mpxProxy.callHook(ONHIDE)
                return pageLifetimes?.hide?.call(this)
              }
              if (/^resize/.test(val)) {
                const e = currentPage.__resizeEvent
                this.__mpxProxy.callHook(ONRESIZE, [e])
                return pageLifetimes?.resize?.call(this, e)
              }
            }, {
              sync: true
            })
          }
        }
      })
    } else {
      return {
        pageLifetimes: {
          show () {
            this.__mpxProxy.callHook(ONSHOW)
          },
          hide () {
            this.__mpxProxy.callHook(ONHIDE)
          },
          resize (e) {
            this.__mpxProxy.callHook(ONRESIZE, [e])
          }
        }
      }
    }
  }
}
