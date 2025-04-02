import { successHandle, failHandle, isTabBarPage, throwSSRWarning, isBrowser, envError } from '../../../common/js'
import { EventChannel } from '../event-channel'

let routeCount = 0

function redirectTo (options = {}) {
  if (!isBrowser) {
    throwSSRWarning('redirectTo API is running in non browser environments')
    return
  }
  const router = global.__mpxRouter
  if (router) {
    if (isTabBarPage(options.url, router)) {
      const res = { errMsg: 'redirectTo:fail can not redirectTo a tabBar page' }
      failHandle(res, options.fail, options.complete)
    }
    router.__mpxAction = { type: 'redirect' }
    if (routeCount === 0 && router.currentRoute.query.routeCount) routeCount = router.currentRoute.query.routeCount
    router.replace(
      {
        path: options.url,
        query: {
          routeCount: ++routeCount
        }
      },
      () => {
        const res = { errMsg: 'redirectTo:ok' }
        successHandle(res, options.success, options.complete)
      },
      err => {
        const res = { errMsg: `redirectTo:fail ${err}` }
        failHandle(res, options.fail, options.complete)
      }
    )
  }
}

function navigateTo (options = {}) {
  if (!isBrowser) {
    throwSSRWarning('navigateTo API is running in non browser environments')
    return
  }
  const router = global.__mpxRouter
  if (router) {
    if (isTabBarPage(options.url, router)) {
      const res = { errMsg: 'navigateTo:fail can not navigateTo a tabBar page' }
      failHandle(res, options.fail, options.complete)
    }
    const eventChannel = new EventChannel()
    router.__mpxAction = {
      type: 'to',
      eventChannel
    }
    if (options.events) {
      eventChannel._addListeners(options.events)
    }
    if (routeCount === 0 && router.currentRoute.query.routeCount) routeCount = router.currentRoute.query.routeCount
    router.push(
      {
        path: options.url,
        query: {
          routeCount: ++routeCount
        }
      },
      () => {
        const res = { errMsg: 'navigateTo:ok', eventChannel }
        successHandle(res, options.success, options.complete)
      },
      err => {
        const res = { errMsg: `navigateTo:fail ${err}` }
        failHandle(res, options.fail, options.complete)
      }
    )
  }
}

function navigateBack (options = {}) {
  if (!isBrowser) {
    throwSSRWarning('navigateBack API is running in non browser environments')
    return
  }
  const router = global.__mpxRouter
  if (router) {
    let delta = options.delta || 1
    const stackLength = router.stack.length
    if (stackLength > 1 && delta >= stackLength) {
      delta = stackLength - 1
    }
    router.__mpxAction = {
      type: 'back',
      delta
    }
    router.go(-delta)
    const res = { errMsg: 'navigateBack:ok' }
    successHandle(res, options.success, options.complete)
  }
}

function reLaunch (options = {}) {
  if (!isBrowser) {
    throwSSRWarning('reLaunch API is running in non browser environments')
    return
  }
  const router = global.__mpxRouter
  if (router) {
    if (routeCount === 0 && router.currentRoute.query.routeCount) routeCount = router.currentRoute.query.routeCount
    router.__mpxAction = {
      type: 'reLaunch',
      path: options.url,
      routeCount: ++routeCount,
      replaced: false
    }
    // 宿主环境中没有办法统计到webview中的页面跳转，所有给用户开放个userDelta，由用户根据webview中的页面跳转的个数自行传递控制relaunch跳转正确
    const delta = router.stack.length - 1 + (options.delta || 0)
    // 在需要操作后退时，先操作后退，在beforeEach中基于当前action通过next()进行replace操作，避免部分浏览器的表现不一致
    if (delta > 0) {
      router.go(-delta)
    } else {
      router.__mpxAction.replaced = true
      router.replace(
        {
          path: options.url,
          query: {
            routeCount
          }
        },
        () => {
          const res = { errMsg: 'reLaunch:ok' }
          successHandle(res, options.success, options.complete)
        },
        err => {
          const res = { errMsg: `reLaunch:fail ${err}` }
          failHandle(res, options.fail, options.complete)
        }
      )
    }
    const res = { errMsg: 'reLaunch:ok' }
    successHandle(res, options.success, options.complete)
  }
}

function switchTab (options = {}) {
  if (!isBrowser) {
    throwSSRWarning('switchTab API is running in non browser environments')
    return
  }
  const router = global.__mpxRouter
  if (router) {
    const toRoute = router.match(options.url, router.history.current)
    const currentRoute = router.currentRoute
    if (toRoute.path !== currentRoute.path) {
      if (!isTabBarPage(options.url, router)) {
        const res = { errMsg: 'switchTab:fail can not switch to no-tabBar page!' }
        failHandle(res, options.fail, options.complete)
      }
      router.__mpxAction = {
        type: 'switch',
        path: options.url,
        replaced: false
      }
      const delta = router.stack.length - 1
      if (delta > 0) {
        router.go(-delta)
      } else {
        router.__mpxAction.replaced = true
        router.replace(
          {
            path: options.url
          },
          () => {
            const res = { errMsg: 'switchTab:ok' }
            successHandle(res, options.success, options.complete)
          },
          err => {
            const res = { errMsg: `switchTab:fail ${err}` }
            failHandle(res, options.fail, options.complete)
          }
        )
      }
    }
    const res = { errMsg: 'switchTab:ok' }
    successHandle(res, options.success, options.complete)
  }
}

const reset = envError('reset')

const getState = envError('getState')

export {
  redirectTo,
  navigateTo,
  navigateBack,
  reLaunch,
  switchTab,
  reset,
  getState
}
