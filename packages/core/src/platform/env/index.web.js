import Vue from 'vue'
import install from './vuePlugin'
import { isBrowser, error, warn } from '@mpxjs/utils'
import { initEvent } from './event'

export function init (Mpx) {
  mpxGlobal.__mpx = Mpx
  mpxGlobal.__mpxAppCbs = mpxGlobal.__mpxAppCbs || {
    show: [],
    hide: [],
    error: [],
    rejection: []
  }
  Mpx.__vue = Vue
  Vue.use(install)
  initEvent()
  initGlobalErrorHandling()
}

function initGlobalErrorHandling () {
  Vue.config.errorHandler = (e, vm, info) => {
    error(`Unhandled error occurs${info ? ` during execution of [${info}]` : ''}!`, vm?.__mpxProxy?.options.mpxFileResource, e)
  }
  Vue.config.warnHandler = (msg, vm, trace) => {
    warn(msg, vm?.__mpxProxy?.options.mpxFileResource, trace)
  }

  if (isBrowser) {
    window.addEventListener('error', (event) => {
      if (mpxGlobal.__mpxAppCbs && mpxGlobal.__mpxAppCbs.error && mpxGlobal.__mpxAppCbs.error.length) {
        mpxGlobal.__mpxAppCbs.error.forEach((cb) => {
          cb(event.error)
        })
      } else {
        console.error(`${event.type}: ${event.message}\n`)
      }
    })
    window.addEventListener('unhandledrejection', (event) => {
      if (mpxGlobal.__mpxAppCbs && mpxGlobal.__mpxAppCbs.rejection && mpxGlobal.__mpxAppCbs.rejection.length) {
        mpxGlobal.__mpxAppCbs.rejection.forEach((cb) => {
          cb(event)
        })
      } else {
        console.warn(`UNHANDLED PROMISE REJECTION: ${event.reason}\n`)
      }
    })
  }
}
