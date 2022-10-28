import {
  CREATED,
  ONHIDE,
  ONSHOW,
  ONLOAD
} from '../../core/innerLifecycle'
import { isFunction, isBrowser } from '@mpxjs/utils'

let systemInfo = {}

let count = 0

function getCurrentPageInstance () {
  const vnode = global.__mpxRouter && global.__mpxRouter.__mpxActiveVnode
  let pageInstance
  if (vnode && vnode.componentInstance) {
    pageInstance = vnode.tag.endsWith('mpx-tab-bar-container') ? vnode.componentInstance.$children[1] : vnode.componentInstance
  }
  return pageInstance
}

function onResize () {
  // 设备屏幕状态
  const deviceOrientation = window.screen.width > window.screen.height ? 'landscape' : 'portrait'

  // 设备参数
  systemInfo = {
    deviceOrientation,
    size: {
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      windowWidth: document.documentElement.clientWidth,
      windowHeight: document.documentElement.clientHeight
    }
  }

  const _t = getCurrentPageInstance()

  if (_t) {
    _t.mpxPageStatus = `resize${count++}`
    isFunction(_t.onResize) && _t.onResize(systemInfo)
  }
}

// listen resize
if (isBrowser) {
  window.addEventListener('resize', onResize)
}

export default function pageStatusMixin (mixinType) {
  const mixin = {}

  if (mixinType === 'page') {
    Object.assign(mixin, {
      data: {
        mpxPageStatus: null
      },
      activated () {
        this.mpxPageStatus = 'show'
      },
      deactivated () {
        this.mpxPageStatus = 'hide'
      },
      created () {
        // onLoad应该在用户声明周期CREATED后再执行，故此处使用原生created声明周期来触发onLoad
        const query = (global.__mpxRouter && global.__mpxRouter.currentRoute && global.__mpxRouter.currentRoute.query) || {}
        this.__mpxProxy.callHook(ONLOAD, [query])
      }
    })
  }

  Object.assign(mixin, {
    [CREATED] () {
      const pageInstance = mixinType === 'page' ? this : getCurrentPageInstance()
      if (pageInstance) {
        this.$watch(() => pageInstance.mpxPageStatus, status => {
          if (!status) return
          if (status === 'show') this.__mpxProxy.callHook(ONSHOW)
          if (status === 'hide') this.__mpxProxy.callHook(ONHIDE)
          const pageLifetimes = this.__mpxProxy.options.pageLifetimes
          if (pageLifetimes) {
            if (/^resize/.test(status) && isFunction(pageLifetimes.resize)) {
              // resize
              pageLifetimes.resize.call(this, systemInfo)
            } else if (isFunction(pageLifetimes[status])) {
              // show & hide
              pageLifetimes[status].call(this)
            }
          }
        }, {
          sync: true
        })
      }
    }
  })

  return mixin
}
