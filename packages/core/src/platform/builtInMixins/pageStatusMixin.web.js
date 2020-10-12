import { CREATED } from '../../core/innerLifecycle'

let systemInfo = {}

let timer = null

let count = 0

function getCurrentPageInstance () {
  let vnode = window.__mpxRouter.__mpxActiveVnode
  let pageInstance
  if (vnode && vnode.componentInstance) {
    pageInstance = vnode.tag.endsWith('mpx-tab-bar-container') ? vnode.componentInstance.$children[1] : vnode.componentInstance
  }
  return pageInstance
}

function onResize () {
  // 避免频繁触发
  if (timer) {
    clearTimeout(timer)
  }
  timer = setTimeout(() => {
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
    }
  }, 50)
}

export default function pageStatusMixin (mixinType) {
  if (mixinType === 'page') {
    return {
      data: {
        mpxPageStatus: 'show'
      },
      activated () {
        // listen resize
        window.addEventListener('resize', onResize)
      },
      deactivated () {
        window.removeEventListener('resize', onResize)
      }
    }
  }
  return {
    [CREATED] () {
      let pageInstance = getCurrentPageInstance()
      if (!pageInstance) return
      this.$watch(
        () => pageInstance.mpxPageStatus,
        status => {
          if (!status) return
          const pageLifetimes = (this.$rawOptions && this.$rawOptions.pageLifetimes) || {}
          // resize
          if (/^resize[0-9]*$/.test(status) && typeof pageLifetimes.resize === 'function') return pageLifetimes.resize.call(this, systemInfo)
          // show & hide
          if (status in pageLifetimes && typeof pageLifetimes[status] === 'function') {
            pageLifetimes[status].call(this)
          }
        }
      )
    }
  }
}
