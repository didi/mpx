import { webHandleSuccess, webHandleFail, isTabBarPage } from '../../../common/js'
import { EventChannel } from '../event-channel'
import { isBrowser } from '@mpxjs/utils/src'

function throwErrorMessage (info) {
  console.warn(`[Mpx runtime warn]: Dangerous operation, ${info}, It may cause some problems, please use this method with caution`)
}

function redirectTo (options = {}) {
  if (!isBrowser) {
    throwErrorMessage('redirectTo method is running in non browser environments')
  }
  const router = global.__mpxRouter
  if (router) {
    if (isTabBarPage(options.url, router)) {
      const res = { errMsg: 'redirectTo:fail can not redirectTo a tabBar page' }
      webHandleFail(res, options.fail, options.complete)
      return Promise.reject(res)
    }
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
          reject(res)
        }
      )
    })
  }
}

function navigateTo (options = {}) {
  if (!isBrowser) {
    throwErrorMessage('navigateTo method is running in non browser environments')
  }
  const router = global.__mpxRouter
  if (router) {
    if (isTabBarPage(options.url, router)) {
      const res = { errMsg: 'navigateTo:fail can not navigateTo a tabBar page' }
      webHandleFail(res, options.fail, options.complete)
      return Promise.reject(res)
    }
    const eventChannel = new EventChannel()
    router.__mpxAction = {
      type: 'to',
      eventChannel
    }
    if (options.events) {
      eventChannel._addListeners(options.events)
    }
    return new Promise((resolve, reject) => {
      router.push(
        {
          path: options.url
        },
        () => {
          const res = { errMsg: 'navigateTo:ok', eventChannel }
          webHandleSuccess(res, options.success, options.complete)
          resolve(res)
        },
        err => {
          const res = { errMsg: err }
          webHandleFail(res, options.fail, options.complete)
          reject(res)
        }
      )
    })
  }
}

function navigateBack (options = {}) {
  if (!isBrowser) {
    throwErrorMessage('navigateBack method is running in non browser environments')
  }
  const router = global.__mpxRouter
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

let reLaunchCount = 0

function reLaunch (options = {}) {
  if (!isBrowser) {
    throwErrorMessage('reLaunch method is running in non browser environments')
  }
  const router = global.__mpxRouter
  if (router) {
    if (reLaunchCount === 0 && router.currentRoute.query.reLaunchCount) reLaunchCount = router.currentRoute.query.reLaunchCount
    const delta = router.stack.length - 1
    router.__mpxAction = {
      type: 'reLaunch',
      path: options.url,
      reLaunchCount: ++reLaunchCount,
      replaced: false
    }
    // 在需要操作后退时，先操作后退，在beforeEach中基于当前action通过next()进行replace操作，避免部分浏览器的表现不一致
    if (delta > 0) {
      router.go(-delta)
    } else {
      router.__mpxAction.replaced = true
      return new Promise((resolve, reject) => {
        router.replace(
          {
            path: options.url,
            query: {
              reLaunchCount
            }
          },
          () => {
            const res = { errMsg: 'reLaunch:ok' }
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
    const res = { errMsg: 'reLaunch:ok' }
    webHandleSuccess(res, options.success, options.complete)
    return Promise.resolve(res)
  }
}

function switchTab (options = {}) {
  if (!isBrowser) {
    throwErrorMessage('switchTab method is running in non browser environments')
  }
  const router = global.__mpxRouter
  if (router) {
    const toRoute = router.match(options.url, router.history.current)
    const currentRoute = router.currentRoute
    if (toRoute.path !== currentRoute.path) {
      if (!isTabBarPage(options.url, router)) {
        const res = { errMsg: 'switchTab:fail can not switch to no-tabBar page!' }
        webHandleFail(res, options.fail, options.complete)
        return Promise.reject(res)
      }
      const delta = router.stack.length - 1
      router.__mpxAction = {
        type: 'switch',
        path: options.url,
        replaced: false
      }
      if (delta > 0) {
        router.go(-delta)
      } else {
        router.__mpxAction.replaced = true
        return new Promise((resolve, reject) => {
          router.replace(
            {
              path: options.url
            },
            () => {
              const res = { errMsg: 'switchTab:ok' }
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
    const res = { errMsg: 'switchTab:ok' }
    webHandleSuccess(res, options.success, options.complete)
    return Promise.resolve(res)
  }
}

export {
  redirectTo,
  navigateTo,
  navigateBack,
  reLaunch,
  switchTab
}
