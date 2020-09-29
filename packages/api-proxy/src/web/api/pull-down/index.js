import { webHandleSuccess, webHandleFail } from '../../../common/js'

function stopPullDownRefresh (options = {}) {
  const router = window.__mpxRouter
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
  let err = 'startPullDownRefresh is not supported in web environment!'
  error(err)
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
    return new Promise((resolve, reject) => {
      if (err) {
        const res = { errMsg: `startPullDownRefresh:fail ${err}` }
        webHandleFail(res, options.fail, options.complete)
        !options.fail && reject(res)
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
