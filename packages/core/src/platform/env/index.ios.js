import { isFunction, isNumber, isString } from '@mpxjs/utils'
import { createI18n } from '../builtInMixins/i18nMixin'
import * as navigationHelper from './navigationHelper'

export function init (Mpx) {
  global.__mpx = Mpx
  global.__mpxAppCbs = global.__mpxAppCbs || {
    show: [],
    hide: [],
    error: [],
    rejection: [],
    lazyLoad: []
  }
  global.__navigationHelper = navigationHelper
  if (global.i18n) {
    Mpx.i18n = createI18n(global.i18n)
  }
  initGlobalErrorHandling()
  initGlobalLazyLoadHandling()
}

function initGlobalErrorHandling () {
  if (global.ErrorUtils) {
    const defaultHandler = global.ErrorUtils.getGlobalHandler()
    global.ErrorUtils.setGlobalHandler((error, isFatal) => {
      if (global.__mpxAppCbs && global.__mpxAppCbs.error && global.__mpxAppCbs.error.length) {
        global.__mpxAppCbs.error.forEach((cb) => {
          cb(error)
        })
      } else if (defaultHandler) {
        defaultHandler(error, isFatal)
      } else {
        console.error(`${error.name}: ${error.message}\n`)
      }
    })
  }

  function onUnhandledRejection (event) {
    if (global.__mpxAppCbs && global.__mpxAppCbs.rejection && global.__mpxAppCbs.rejection.length) {
      global.__mpxAppCbs.rejection.forEach((cb) => {
        cb(event)
      })
    } else {
      console.warn(`UNHANDLED PROMISE REJECTION ${(isNumber(event.id) || isString(event.id)) ? '(id:' + event.id + ')' : ''}: ${event.reason}\n`)
    }
  }
  const rejectionTrackingOptions = {
    allRejections: true,
    onUnhandled (id, error) {
      onUnhandledRejection({ id, reason: error, promise: null })
    }
  }

  // 支持 core-js promise polyfill
  const oldOnUnhandledRejection = global.onunhandledrejection
  global.onunhandledrejection = function onunhandledrejection (event) {
    onUnhandledRejection(event)
    isFunction(oldOnUnhandledRejection) && oldOnUnhandledRejection.call(this, event)
  }
  if (global.HermesInternal?.hasPromise?.()) {
    global.HermesInternal.enablePromiseRejectionTracker?.(rejectionTrackingOptions)
  } else {
    require('promise/setimmediate/rejection-tracking').enable(rejectionTrackingOptions)
  }
}

function initGlobalLazyLoadHandling () {
  global.onLazyLoadError = function (error) {
    if (global.__mpxAppCbs?.lazyLoad?.length) {
      global.__mpxAppCbs.lazyLoad.forEach((cb) => {
        cb(error)
      })
    }
  }
}
