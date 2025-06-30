import { isFunction, isNumber, isString } from '@mpxjs/utils'
import { createI18n } from '../builtInMixins/i18nMixin'
import * as navigationHelper from './navigationHelper'

export function init (Mpx) {
  // 为避免多个mpx应用运行时互相覆盖global __mpx对象，导致业务异常，例如插件模式下，插件应用和业务应用互相覆盖global.__mpx，因此创建mpxGlobal局部对象
  mpxGlobal.__mpx = Mpx
  global.__mpx = Mpx
  global.__mpxAppCbs = global.__mpxAppCbs || {
    show: [],
    hide: [],
    error: [],
    rejection: []
  }
  global.__navigationHelper = navigationHelper
  if (global.i18n) {
    Mpx.i18n = createI18n(global.i18n)
  }
  initGlobalErrorHandling()
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
