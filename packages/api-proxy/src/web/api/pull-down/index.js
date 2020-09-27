import { webHandleSuccess, webHandleFail, error } from '../../../common/js'

function stopPullDownRefresh (options = {}) {
  const router = window.__mpxRouter
  if (router) {
    let err
    const vnode = router.__mpxActiveVnode
    if (vnode && vnode.componentInstance && vnode.componentInstance.__stopPullDownRefresh) {
      try {
        vnode.componentInstance.__stopPullDownRefresh()
      } catch (e) {
        err = e
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
  })
}

export {
  stopPullDownRefresh,
  startPullDownRefresh
}
