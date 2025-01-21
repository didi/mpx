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
function isLock (navigationHelper, type, options) {
  if (navigationHelper.lastSuccessCallback && navigationHelper.lastFailCallback) {
    const res = { errMsg: `${type}:fail the previous routing event didn't complete` }
    failHandle(res, options.fail, options.complete)
    return true
  }
  setTimeout(() => {
    if (navigationHelper.lastSuccessCallback && navigationHelper.lastFailCallback) {
      navigationHelper.lastFailCallback('timeout')
      navigationHelper.lastFailCallback = null
    }
  }, 350)
  return false
}

function navigateTo (options = {}) {
  const navigationHelper = global.__navigationHelper
  if (isLock(navigationHelper, 'navigateTo', options)) {
    return
  }
  const navigation = Object.values(global.__mpxPagesMap || {})[0]?.[1]
  if (navigation && navigationHelper) {
    const { path, queryObj } = parseUrl(options.url)
    const basePath = getBasePath(navigation)
    const finalPath = resolvePath(path, basePath).slice(1)
    navigation.push(finalPath, queryObj)
    navigationHelper.lastSuccessCallback = () => {
      const res = { errMsg: 'navigateTo:ok' }
      successHandle(res, options.success, options.complete)
    }
    navigationHelper.lastFailCallback = (msg) => {
      const res = { errMsg: `navigateTo:fail ${msg}` }
      failHandle(res, options.fail, options.complete)
    }
  }
}

function redirectTo (options = {}) {
  const navigation = Object.values(global.__mpxPagesMap || {})[0]?.[1]
  const navigationHelper = global.__navigationHelper
  if (isLock(navigationHelper, 'redirectTo', options)) {
    return
  }
  if (navigation && navigationHelper) {
    const { path, queryObj } = parseUrl(options.url)
    const basePath = getBasePath(navigation)
    const finalPath = resolvePath(path, basePath).slice(1)
    navigation.replace(finalPath, queryObj)
    navigationHelper.lastSuccessCallback = () => {
      const res = { errMsg: 'redirectTo:ok' }
      successHandle(res, options.success, options.complete)
    }
    navigationHelper.lastFailCallback = (msg) => {
      const res = { errMsg: `redirectTo:fail ${msg}` }
      failHandle(res, options.fail, options.complete)
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
        const res = { errMsg: 'navigateBack:ok' }
        successHandle(res, options.success, options.complete)
      })
    } else {
      navigation.pop(delta)
    }
  }
}

function reLaunch (options = {}) {
  const navigation = Object.values(global.__mpxPagesMap || {})[0]?.[1]
  const navigationHelper = global.__navigationHelper
  if (isLock(navigationHelper, 'reLaunch', options)) {
    return
  }
  if (navigation && navigationHelper) {
    const { path, queryObj } = parseUrl(options.url)
    const basePath = getBasePath(navigation)
    const finalPath = resolvePath(path, basePath).slice(1)
    navigation.reset({
      index: 0,
      routes: [
        {
          name: finalPath,
          params: queryObj
        }
      ]
    })
    navigationHelper.lastSuccessCallback = () => {
      const res = { errMsg: 'redirectTo:ok' }
      successHandle(res, options.success, options.complete)
    }
    navigationHelper.lastFailCallback = (msg) => {
      const res = { errMsg: `redirectTo:fail ${msg}` }
      failHandle(res, options.fail, options.complete)
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
