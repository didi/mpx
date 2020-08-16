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
      reLaunchCount: ++reLaunchCount,
      replaced: false,
      reLaunched: false
    }
    // 在需要操作后退时，先操作后退，在beforeEach中基于当前action通过next()进行replace操作，避免部分浏览器的表现不一致
    if (delta > 0) {
      router.go(-delta)
    } else {
      router.__mpxAction.replaced = true
      router.replace({
        path: options.url,
        query: {
          reLaunchCount
        }
      })
    }
    const res = { errMsg: 'reLaunch:ok' }
    webHandleSuccess(res, options.success, options.complete)
    return Promise.resolve(res)
  }
}

function switchTab (options = {}) {
  const router = window.__mpxRouter
  const tabBarList = (window.__tabBar && window.__tabBar.list) || []
  const toUrl = options.url
  const delta = router.stack.length - 1
  let isToTabPage = false
  tabBarList.forEach((item) => {
    if (toUrl.indexOf(item.pagePath)>-1) {
      isToTabPage = true
    }
  })
  if (!isToTabPage) {
    // 跳转页面非 tabBar 页面，无法跳转
    const res = { errMsg: "switchTab:fail can not switch to no-tabBar page" }
    return Promise.reject(res)
  }

  router.__mpxAction = {
    type: 'switch',
    path: options.url,
    replaced: false,
    switchTabed: false
  }
  if (delta > 0) {
    console.log('router go', -delta)
    router.go(-delta)
  } else {
    router.__mpxAction.replaced = true
    router.replace({
      path: options.url
    })
  }
  const res = { errMsg: 'switchTab:ok' }
  webHandleSuccess(res, options.success, options.complete)
  return Promise.resolve(res)
}

export {
  redirectTo,
  navigateTo,
  navigateBack,
  reLaunch,
  switchTab
}
