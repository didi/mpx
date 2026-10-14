import { envError, successHandle, failHandle, resolvePath, getFocusedNavigation } from '../../../common/js'
import { parseUrlQuery as parseUrl } from '@mpxjs/utils'
import { nextTick } from '../next-tick'
import { EventChannel } from '../event-channel'

function getBasePath (navigation) {
  if (navigation) {
    const state = navigation.getState()
    return '/' + state.routes[state.index].name
  }
  return '/'
}

let timerId = null
function canNavigate (navigation, navigationHelper, type, options) {
  if (!navigation || !navigationHelper) {
    failHandle({ errMsg: `${type}:fail navigation is not available` }, options.fail, options.complete)
    return false
  }
  if (navigationHelper.lastSuccessCallback && navigationHelper.lastFailCallback) {
    const { path } = parseUrl(options.url || '')
    const res = {
      errMsg: `${type}:fail the previous routing event didn't complete`,
      path
    }
    failHandle(res, options.fail, options.complete)
    return false
  }
  clearTimeout(timerId)
  timerId = setTimeout(() => {
    if (navigationHelper.lastSuccessCallback && navigationHelper.lastFailCallback) {
      const callback = navigationHelper.lastFailCallback
      navigationHelper.lastSuccessCallback = null
      navigationHelper.lastFailCallback = null
      callback(`timeout ${options.url || ''}`)
    }
  }, 1000)
  return true
}

function navigateTo (options = {}) {
  const navigationHelper = global.__navigationHelper
  const navigation = getFocusedNavigation()
  if (canNavigate(navigation, navigationHelper, 'navigateTo', options)) {
    const eventChannel = new EventChannel()
    if (options.events) {
      eventChannel._addListeners(options.events)
    }
    const { path, queryObj } = parseUrl(options.url, true)
    const basePath = getBasePath(navigation)
    const finalPath = resolvePath(path, basePath).slice(1)

    global.__mpxEventChannel = {
      route: finalPath,
      eventChannel
    }
    navigationHelper.lastSuccessCallback = () => {
      const res = { errMsg: 'navigateTo:ok', eventChannel }
      successHandle(res, options.success, options.complete)
    }
    navigationHelper.lastFailCallback = (msg) => {
      if (global.__mpxEventChannel?.eventChannel === eventChannel) {
        delete global.__mpxEventChannel
      }
      const res = { errMsg: `navigateTo:fail ${msg}` }
      failHandle(res, options.fail, options.complete)
    }
    navigation.push(finalPath, queryObj)
  }
}

function redirectTo (options = {}) {
  const navigation = getFocusedNavigation()
  const navigationHelper = global.__navigationHelper
  if (canNavigate(navigation, navigationHelper, 'redirectTo', options)) {
    const { path, queryObj } = parseUrl(options.url, true)
    const basePath = getBasePath(navigation)
    const finalPath = resolvePath(path, basePath).slice(1)
    navigationHelper.lastSuccessCallback = () => {
      const res = { errMsg: 'redirectTo:ok' }
      successHandle(res, options.success, options.complete)
    }
    navigationHelper.lastFailCallback = (msg) => {
      const res = { errMsg: `redirectTo:fail ${msg}` }
      failHandle(res, options.fail, options.complete)
    }
    navigation.replace(finalPath, queryObj)
  }
}

function navigateBack (options = {}) {
  const navigation = getFocusedNavigation()
  const navigationHelper = global.__navigationHelper
  if (canNavigate(navigation, navigationHelper, 'navigateBack', options)) {
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
        if (navigationHelper.lastSuccessCallback) {
          const callback = navigationHelper.lastSuccessCallback
          navigationHelper.lastSuccessCallback = null
          navigationHelper.lastFailCallback = null
          callback()
        }
      })
    } else {
      navigation.pop(delta)
    }
  }
}

function reLaunch (options = {}) {
  const navigation = getFocusedNavigation()
  const navigationHelper = global.__navigationHelper
  if (canNavigate(navigation, navigationHelper, 'reLaunch', options)) {
    const { path, queryObj } = parseUrl(options.url, true)
    const basePath = getBasePath(navigation)
    const finalPath = resolvePath(path, basePath).slice(1)
    navigationHelper.lastSuccessCallback = () => {
      const res = { errMsg: 'reLaunch:ok' }
      successHandle(res, options.success, options.complete)
    }
    navigationHelper.lastFailCallback = (msg) => {
      const res = { errMsg: `reLaunch:fail ${msg}` }
      failHandle(res, options.fail, options.complete)
    }
    navigation.reset({
      index: 0,
      routes: [
        {
          name: finalPath,
          params: queryObj
        }
      ]
    })
  }
}

const switchTab = envError('switchTab')

export {
  redirectTo,
  navigateTo,
  navigateBack,
  reLaunch,
  switchTab
}
