import Vue from 'vue'
import install from './vuePlugin'
import { isBrowser, error, warn } from '@mpxjs/utils'
import { initEvent } from './event'

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
      if (global.__mpxAppCbs && global.__mpxAppCbs.error && global.__mpxAppCbs.error.length) {
        global.__mpxAppCbs.error.forEach((cb) => {
          cb(event.error)
        })
      } else {
        console.error(`${event.type}: ${event.message}\n`)
      }
    })
    window.addEventListener('unhandledrejection', (event) => {
      if (global.__mpxAppCbs && global.__mpxAppCbs.rejection && global.__mpxAppCbs.rejection.length) {
        global.__mpxAppCbs.rejection.forEach((cb) => {
          cb(event)
        })
      } else {
        console.warn(`UNHANDLED PROMISE REJECTION: ${event.reason}\n`)
      }
    })
  }
}
