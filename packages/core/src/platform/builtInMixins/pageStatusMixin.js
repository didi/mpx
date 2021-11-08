import { CREATED } from '../../core/innerLifecycle'

function setPausedWatch (target, isHide) {
  if (!target.$rawOptions.mpxConfig || !target.$rawOptions.mpxConfig.isPausedOnHide) return
  const watchers = target.$getWatchers()
  if (watchers && watchers.length) {
    for (let i = 0; i < watchers.length; i++) {
      const watcher = watchers[i]
      isHide && watcher.pause()
      !isHide && watcher.resume()
    }
  }
}

export default function pageStatusMixin (mixinType) {
  // 只有tt和ali没有pageLifeTimes支持，需要框架实现，其余平台一律使用原生pageLifeTimes
  // 由于业务上大量使用了pageShow进行初始化。。。下个版本再移除非必要的pageShow/Hide实现。。。
  if (mixinType === 'page') {
    const pageMixin = {
      data: {
        mpxPageStatus: 'show',
        _first: true
      },
      onShow () {
        this.mpxPageStatus = 'show'
        // show 取消暂停状态
        if (!this._first) setPausedWatch(this, false)
        this._first = false
      },
      onHide () {
        this.mpxPageStatus = 'hide'
        // hide 设置暂停状态
        setPausedWatch(this, true)
      }
    }
    if (__mpx_mode__ === 'ali') {
      pageMixin.events = {
        onResize (e) {
          this.__resizeEvent = e
          this.mpxPageStatus = 'resize'
        }
      }
    }
    if (__mpx_mode__ === 'tt') {
      pageMixin.onResize = function (e) {
        this.__resizeEvent = e
        this.mpxPageStatus = 'resize'
      }
    }
    return pageMixin
  } else {
    return {
      data: {
        _first: true
      },
      [CREATED] () {
        const options = this.$rawOptions
        const hasPageShow = options.pageShow || options.pageHide
        const needPageLifetimes = options.pageLifetimes && (__mpx_mode__ === 'ali' || __mpx_mode__ === 'tt')
        // 是否开启 isPausedOnHide
        const isPausedOnHide = !!(options.mpxConfig && options.mpxConfig.isPausedOnHide)
        if (isPausedOnHide) {
          const pageShow = options.pageShow
          options.pageShow = () => {
            if (!this._first) setPausedWatch(this, false)
            this._first = false
            typeof pageShow === 'function' && pageShow.call(this)
          }
          const pageHide = options.pageHide
          options.pageHide = () => {
            setPausedWatch(this, true)
            typeof pageHide === 'function' && pageHide.call(this)
          }
        }

        if (hasPageShow || needPageLifetimes) {
          let currentPage
          if (__mpx_mode__ === 'ali') {
            currentPage = this.$page
          } else {
            const pages = getCurrentPages()
            currentPage = pages[pages.length - 1]
          }
          if (currentPage) {
            this.$watch(() => currentPage.mpxPageStatus, (val) => {
              if (val) {
                if (val === 'show' && typeof options.pageShow === 'function') options.pageShow.call(this)
                if (val === 'hide' && typeof options.pageHide === 'function') options.pageHide.call(this)
                if (needPageLifetimes) {
                  const pageLifetimes = options.pageLifetimes
                  if (val === 'show' && typeof pageLifetimes.show === 'function') pageLifetimes.show.call(this)
                  if (val === 'hide' && typeof pageLifetimes.hide === 'function') pageLifetimes.hide.call(this)
                  if (val === 'resize' && typeof pageLifetimes.resize === 'function') pageLifetimes.resize.call(this, currentPage.__resizeEvent)
                }
              }
            }, {
              sync: true,
              immediate: true,
              pausable: false
            })
          }
        }
      }
    }
  }
}
