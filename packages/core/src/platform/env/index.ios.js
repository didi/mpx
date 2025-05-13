import { isFunction, isNumber, isString } from '@mpxjs/utils'
import { createI18n } from '../builtInMixins/i18nMixin'
import * as navigationHelper from './navigationHelper'

export function init (Mpx) {
  mpxGlobal.__mpx = Mpx
  mpxGlobal.__mpxAppCbs = mpxGlobal.__mpxAppCbs || {
    show: [],
    hide: [],
    error: [],
    rejection: []
  }
  mpxGlobal.__navigationHelper = navigationHelper
  if (mpxGlobal.i18n) {
    Mpx.i18n = createI18n(mpxGlobal.i18n)
  }
  initGlobalErrorHandling()
}

function initGlobalErrorHandling () {
  if (mpxGlobal.ErrorUtils) {
    const defaultHandler = mpxGlobal.ErrorUtils.getGlobalHandler()
    mpxGlobal.ErrorUtils.setGlobalHandler((error, isFatal) => {
      if (mpxGlobal.__mpxAppCbs && mpxGlobal.__mpxAppCbs.error && mpxGlobal.__mpxAppCbs.error.length) {
        mpxGlobal.__mpxAppCbs.error.forEach((cb) => {
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
    if (mpxGlobal.__mpxAppCbs && mpxGlobal.__mpxAppCbs.rejection && mpxGlobal.__mpxAppCbs.rejection.length) {
      mpxGlobal.__mpxAppCbs.rejection.forEach((cb) => {
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
  const oldOnUnhandledRejection = mpxGlobal.onunhandledrejection
  mpxGlobal.onunhandledrejection = function onunhandledrejection (event) {
    onUnhandledRejection(event)
    isFunction(oldOnUnhandledRejection) && oldOnUnhandledRejection.call(this, event)
  }
  if (global.HermesInternal?.hasPromise?.()) {
    global.HermesInternal.enablePromiseRejectionTracker?.(rejectionTrackingOptions)
  } else {
    require('promise/setimmediate/rejection-tracking').enable(rejectionTrackingOptions)
  }
}
