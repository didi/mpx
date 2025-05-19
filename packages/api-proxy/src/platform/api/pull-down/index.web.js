import { successHandle, failHandle, throwSSRWarning, isBrowser } from '../../../common/js'

function stopPullDownRefresh (options = {}) {
  if (!isBrowser) {
    throwSSRWarning('stopPullDownRefresh API is running in non browser environments')
    return
  }
  const router = global.__mpxRouter
  if (router) {
    let err

    const vnode = router.__mpxActiveVnode
    if (vnode && vnode.componentInstance) {
      const currentPage = vnode.tag.endsWith('mpx-tab-bar-container') ? vnode.componentInstance.$refs.tabBarPage : vnode.componentInstance
      if (currentPage && currentPage.__stopPullDownRefresh) {
        try {
          currentPage.__stopPullDownRefresh()
        } catch (e) {
          err = e
        }
      }
    }
    if (err) {
      const res = { errMsg: `stopPullDownRefresh:fail ${err}` }
      failHandle(res, options.fail, options.complete)
    } else {
      const res = { errMsg: 'stopPullDownRefresh:ok' }
      successHandle(res, options.success, options.complete)
    }
  }
}

function startPullDownRefresh (options = {}) {
  if (!isBrowser) {
    throwSSRWarning('startPullDownRefresh API is running in non browser environments')
    return
  }
  const router = global.__mpxRouter
  if (router) {
    let err

    const vnode = router.__mpxActiveVnode
    if (vnode && vnode.componentInstance) {
      const currentPage = vnode.tag.endsWith('mpx-tab-bar-container') ? vnode.componentInstance.$refs.tabBarPage : vnode.componentInstance
      if (currentPage && currentPage.__startPullDownRefresh) {
        try {
          currentPage.__startPullDownRefresh()
        } catch (e) {
          err = e
        }
      }
    }
    if (err) {
      const res = { errMsg: `startPullDownRefresh:fail ${err}` }
      failHandle(res, options.fail, options.complete)
    } else {
      const res = { errMsg: 'startPullDownRefresh:ok' }
      successHandle(res, options.success, options.complete)
    }
  }
}

export {
  stopPullDownRefresh,
  startPullDownRefresh
}
