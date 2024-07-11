import { successHandle, failHandle } from '../../../common/js'
import { parseQuery } from '@mpxjs/utils'

function parseUrl (url) {
  if (url.startsWith('/')) {
    url = url.slice(1)
  } else {
    // todo 处理相对路径
  }
  let path = url
  let query = ''
  const queryIndex = url.indexOf('?')
  if (queryIndex >= 0) {
    path = url.slice(0, queryIndex)
    query = url.slice(queryIndex)
  }
  const queryObj = parseQuery(query || '?')
  return {
    path,
    queryObj
  }
}

function navigateTo (options = {}) {
  const navigationRef = global.__navigationRef
  const navigationHelper = global.__navigationHelper
  if (navigationHelper && navigationRef && navigationRef.isReady()) {
    const { path, queryObj } = parseUrl(options.url)
    navigationRef.dispatch(navigationHelper.StackActions.push(path, queryObj))
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
  const navigationRef = global.__navigationRef
  const navigationHelper = global.__navigationHelper
  if (navigationHelper && navigationRef && navigationRef.isReady()) {
    const { path, queryObj } = parseUrl(options.url)
    navigationRef.dispatch(navigationHelper.StackActions.replace(path, queryObj))
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
  const navigationRef = global.__navigationRef
  const navigationHelper = global.__navigationHelper
  if (navigationHelper && navigationRef && navigationRef.isReady()) {
    navigationRef.dispatch(navigationHelper.StackActions.pop(options.delta || 1))
    navigationHelper.lastSuccessCallback = () => {
      const res = { errMsg: 'navigateBack:ok' }
      successHandle(res, options.success, options.complete)
    }
    navigationHelper.lastFailCallback = (msg) => {
      const res = { errMsg: `navigateBack:fail ${msg}` }
      failHandle(res, options.fail, options.complete)
    }
  }
}

function reLaunch (options = {}) {
  const navigationRef = global.__navigationRef
  const navigationHelper = global.__navigationHelper
  if (navigationHelper && navigationRef && navigationRef.isReady()) {
    const { path, queryObj } = parseUrl(options.url)
    navigationRef.reset({
      index: 0,
      routes: [
        {
          name: path,
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
