import { webHandleSuccess, webHandleFail } from '../../../common/js'
import { isBrowser } from '@mpxjs/utils'

function stopPullDownRefresh (options = {}) {
  if (!isBrowser) {
    console.warn('[Mpx runtime warn]: Dangerous operation, stopPullDownRefresh is running in non browser environments, It may cause some problems, please use this method with caution')
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
    return new Promise((resolve, reject) => {
      if (err) {
        const res = { errMsg: `stopPullDownRefresh:fail ${err}` }
        webHandleFail(res, options.fail, options.complete)
        reject(res)
      } else {
        const res = { errMsg: 'stopPullDownRefresh:ok' }
        webHandleSuccess(res, options.success, options.complete)
        resolve(res)
      }
    })
  }
}

function startPullDownRefresh (options = {}) {
  if (!isBrowser) {
    console.warn('[Mpx runtime warn]: Dangerous operation, startPullDownRefresh is running in non browser environments, It may cause some problems, please use this method with caution')
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
    return new Promise((resolve, reject) => {
      if (err) {
        const res = { errMsg: `startPullDownRefresh:fail ${err}` }
        webHandleFail(res, options.fail, options.complete)
        reject(res)
      } else {
        const res = { errMsg: 'startPullDownRefresh:ok' }
        webHandleSuccess(res, options.success, options.complete)
        resolve(res)
      }
    })
  }
}

export {
  stopPullDownRefresh,
  startPullDownRefresh
}
