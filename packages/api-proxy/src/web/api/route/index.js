import { webHandleSuccess, webHandleFail } from '../../../common/js'

// 用于 navigator 组件
if (window.__mpxRouter) {
  Object.defineProperty(window.__mpxRouter, 'reLaunch', {
    get () {
      return reLaunch
    }
  })
}

function redirectTo (options = {}) {
  const router = window.__mpxRouter
  if (router) {
    router.__mpxAction = { type: 'redirect' }
    return new Promise((resolve, reject) => {
      router.replace(
        {
          path: options.url
        },
        () => {
          const res = { errMsg: 'redirectTo:ok' }
          webHandleSuccess(res, options.success, options.complete)
          resolve(res)
        },
        err => {
          const res = { errMsg: `redirectTo:fail ${err}` }
          webHandleFail(res, options.fail, options.complete)
          !options.fail && reject(res)
        }
      )
    })
  }
}

function navigateTo (options = {}) {
  const router = window.__mpxRouter
  if (router) {
    router.__mpxAction = { type: 'to' }
    return new Promise((resolve, reject) => {
      router.push(
        {
          path: options.url
        },
        () => {
          const res = { errMsg: 'navigateTo:ok', eventChannel: null }
          webHandleSuccess(res, options.success, options.complete)
          resolve(res)
        },
        err => {
          const res = { errMsg: err }
          webHandleFail(res, options.fail, options.complete)
          !options.fail && reject(res)
        }
      )
    })
  }
}

function navigateBack (options = {}) {
  const router = window.__mpxRouter
  if (router) {
    const delta = options.delta || 1
    router.__mpxAction = {
      type: 'back',
      delta
    }
    router.go(-delta)
    const res = { errMsg: 'navigateBack:ok' }
    webHandleSuccess(res, options.success, options.complete)
    return Promise.resolve(res)
  }
}

function reLaunch (options = {}) {
  const router = window.__mpxRouter
  if (router) {
    const delta = router.stack.length - 1
    let reLaunchCount = router.currentRoute.query.reLaunchCount || 0
    router.__mpxAction = {
      type: 'reLaunch',
      path: options.url,
      reLaunchCount
    }
    if (delta > 0) {
      router.go(-delta)
    }
    router.replace({
      path: options.url,
      query: {
        reLaunchCount: ++reLaunchCount
      }
    })
    const res = { errMsg: 'reLaunch:ok' }
    webHandleSuccess(res, options.success, options.complete)
    return Promise.resolve(res)
  }
}

export {
  redirectTo,
  navigateTo,
  navigateBack,
  reLaunch
}
