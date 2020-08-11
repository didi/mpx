let systemInfo = {}

let timer = ''

let count = 0

function onResize () {
  // 避免频繁触发
  if (timer) {
    clearTimeout(timer)
  }
  timer = setTimeout(() => {
    // 设备屏幕状态
    const landscape = Math.abs(window.orientation) === 90
    const deviceOrientation = landscape ? 'landscape' : 'portrait'

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

    const vnode = window.__mpxRouter.__mpxActiveVnode
    const _t = vnode && vnode.componentInstance

    if (_t) {
      // 每当尺寸改变时触发
      _t.mpxPageStatus = `resize${count}`

      count++
    }
  }, 50)
}

export default function pageLifetimes (mixinType) {
  if (mixinType === 'page') {
    return {
      data: {
        mpxPageStatus: 'show'
      },
      activated () {
        // 页面显示\隐藏
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            this.mpxPageStatus = 'show'
          } else {
            this.mpxPageStatus = 'hide'
          }
        })

        // 屏幕尺寸变化，横竖屏
        window.addEventListener('resize', onResize)
      },
      deactivated () {
        // 卸载事件
        document.removeEventListener('visibilitychange', () => {})
        window.removeEventListener('resize', onResize)
      }
    }
  } else {
    return {
      watch: {
        '$parent.mpxPageStatus'(val) {
          if (val) {
            const rawOptions = this.$rawOptions || ''
            const pageLifetimes = rawOptions.pageLifetimes
            if (pageLifetimes) {
              if (val === 'show' && typeof pageLifetimes.show === 'function') pageLifetimes.show.call(this)
              if (val === 'hide' && typeof pageLifetimes.hide === 'function') pageLifetimes.hide.call(this)
              if (/^resize[0-9]*$/.test(val) && typeof pageLifetimes.resize === 'function') pageLifetimes.resize.call(this, systemInfo)
            }
          }
        }
      },
      created () {
        // 初始化一下，触发 show
        this.$rawOptions.pageLifetimes.show.call(this)
      }
    }
  }
}
