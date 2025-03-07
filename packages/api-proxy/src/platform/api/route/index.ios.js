import { successHandle, failHandle } from '../../../common/js'
import { parseUrlQuery as parseUrl } from '@mpxjs/utils'
import { nextTick } from '../next-tick'

function getBasePath (navigation) {
  if (navigation) {
    const state = navigation.getState()
    return '/' + state.routes[state.index].name
  }
  return '/'
}

function resolvePath (relative, base) {
  const firstChar = relative.charAt(0)
  if (firstChar === '/') {
    return relative
  }
  const stack = base.split('/')
  stack.pop()
  // resolve relative path
  const segments = relative.replace(/^\//, '').split('/')
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    if (segment === '..') {
      stack.pop()
    } else if (segment !== '.') {
      stack.push(segment)
    }
  }
  // ensure leading slash
  if (stack[0] !== '') {
    stack.unshift('')
  }
  return stack.join('/')
}
let timerId = null
function isLock (navigationHelper, type, options) {
  if (navigationHelper.lastSuccessCallback && navigationHelper.lastFailCallback) {
    const res = { errMsg: `${type}:fail the previous routing event didn't complete` }
    failHandle(res, options.fail, options.complete)
    return true
  }
  clearTimeout(timerId)
  timerId = setTimeout(() => {
    if (navigationHelper.lastSuccessCallback && navigationHelper.lastFailCallback) {
      navigationHelper.lastFailCallback('timeout')
      navigationHelper.lastFailCallback = null
    }
  }, 350)
  return false
}

function getNavigationCallback (type, options) {
  return {
    successCallback: () => {
      const res = { errMsg: `${type}: ok` }
      successHandle(res, options.success, options.complete)
    },
    failCallback: (msg) => {
      const res = { errMsg: `${type}: fail ${msg}` }
      failHandle(res, options.fail, options.complete)
    }
  }
}

function navigateTo (options = {}) {
  const navigationHelper = global.__navigationHelper
  const asyncPagesMap = global.__mpxAsyncPagesMap
  if (isLock(navigationHelper, 'navigateTo', options)) {
    return
  }
  const navigation = Object.values(global.__mpxPagesMap || {})[0]?.[1]
  if (navigation && navigationHelper) {
    const { path, queryObj } = parseUrl(options.url)
    const basePath = getBasePath(navigation)
    const finalPath = resolvePath(path, basePath).slice(1)
    const { successCallback, failCallback } = getNavigationCallback('navigateTo', options)
    const navigationHandle = () => {
      navigation.push(finalPath, queryObj)
      navigationHelper.lastSuccessCallback = successCallback
      navigationHelper.lastFailCallback = failCallback
    }
    if (asyncPagesMap[finalPath]) {
      asyncPagesMap[finalPath]()
        .then(navigationHandle)
        .catch((e) => failCallback(e.message))
    } else {
      navigationHandle()
    }
  }
}

function redirectTo (options = {}) {
  const navigation = Object.values(global.__mpxPagesMap || {})[0]?.[1]
  const navigationHelper = global.__navigationHelper
  const asyncPagesMap = global.__mpxAsyncPagesMap
  if (isLock(navigationHelper, 'redirectTo', options)) {
    return
  }
  if (navigation && navigationHelper) {
    const { path, queryObj } = parseUrl(options.url)
    const basePath = getBasePath(navigation)
    const finalPath = resolvePath(path, basePath).slice(1)
    const { successCallback, failCallback } = getNavigationCallback('redirectTo', options)
    const navigationHandle = () => {
      navigation.replace(finalPath, queryObj)
      navigationHelper.lastSuccessCallback = successCallback
      navigationHelper.lastFailCallback = failCallback
    }

    if (asyncPagesMap[finalPath]) {
      asyncPagesMap[finalPath]()
        .then(navigationHandle)
        .catch((e) => failCallback(e.message))
    } else {
      navigationHandle()
    }
  }
}

function navigateBack (options = {}) {
  const navigation = Object.values(global.__mpxPagesMap || {})[0]?.[1]
  const navigationHelper = global.__navigationHelper
  if (isLock(navigationHelper, 'navigateBack', options)) {
    return
  }
  if (navigation && navigationHelper) {
    const delta = options.delta || 1
    const routeLength = navigation.getState().routes.length
    navigationHelper.lastSuccessCallback = () => {
      const res = { errMsg: 'navigateBack:ok' }
      successHandle(res, options.success, options.complete)
    }
    navigationHelper.lastFailCallback = (msg) => {
      const res = { errMsg: `navigateBack:fail ${msg}` }
      failHandle(res, options.fail, options.complete)
    }
    if (delta >= routeLength && global.__mpx?.config.rnConfig.onAppBack?.(delta - routeLength + 1)) {
      nextTick(() => {
        navigationHelper.lastSuccessCallback()
        navigationHelper.lastSuccessCallback = null
      })
    } else {
      navigation.pop(delta)
    }
  }
}

function reLaunch (options = {}) {
  const navigation = Object.values(global.__mpxPagesMap || {})[0]?.[1]
  const navigationHelper = global.__navigationHelper
  const asyncPagesMap = global.__mpxAsyncPagesMap
  if (isLock(navigationHelper, 'reLaunch', options)) {
    return
  }
  if (navigation && navigationHelper) {
    const { path, queryObj } = parseUrl(options.url)
    const basePath = getBasePath(navigation)
    const finalPath = resolvePath(path, basePath).slice(1)
    const { successCallback, failCallback } = getNavigationCallback('redirectTo', options)
    const navigationHandle = () => {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: finalPath,
            params: queryObj
          }
        ]
      })
      navigationHelper.lastSuccessCallback = successCallback
      navigationHelper.lastFailCallback = failCallback
    }

    if (asyncPagesMap[finalPath]) {
      asyncPagesMap[finalPath]()
        .then(navigationHandle)
        .catch((e) => failCallback(e.message))
    } else {
      navigationHandle()
    }
  }
}

function switchTab () {

}

export {
  redirectTo,
  navigateTo,
  navigateBack,
  reLaunch,
  switchTab
}
