import { CREATED } from '../../core/innerLifecycle'

export default function pageStatusMixin (mixinType) {
  if (mixinType === 'page') {
    return {
      activated () {
        this.onShow && this.onShow()
      },
      deactivated () {
        this.onHide && this.onHide()
      }
    }
  }
  return {
    [CREATED] () {
      let vnode = window.__mpxRouter.__mpxActiveVnode
      let pageInstance
      if (vnode && vnode.componentInstance) {
        pageInstance = vnode.tag.endsWith('mpx-tabbar-container') ? vnode.componentInstance.$children[1] : vnode.componentInstance
      }
      if (!pageInstance) return
      this.$watch(
        () => pageInstance.mpxPageStatus,
        status => {
          if (!status) return
          const pageLifetimes = (this.$rawOptions && this.$rawOptions.pageLifetimes) || {}
          // show & hide
          if (status in pageLifetimes && typeof pageLifetimes[status] === 'function') {
            pageLifetimes[status].call(this)
          }
        }
      )
    }
  }
}
