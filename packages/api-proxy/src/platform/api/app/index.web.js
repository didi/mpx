import { isBrowser, isReact } from '@mpxjs/utils'

global.__mpxAppCbs = global.__mpxAppCbs || {
  show: [],
  hide: [],
  error: [],
  rejection: []
}

function off (cbs, cb) {
  if (cb) {
    const idx = cbs.indexOf(cb)
    if (idx > -1) cbs.splice(idx, 1)
  } else {
    cbs.length = 0
  }
}

function onUnhandledRejection (callback) {
  if (isBrowser || isReact) {
    global.__mpxAppCbs.rejection.push(callback)
  }
}

function offUnhandledRejection (callback) {
  off(global.__mpxAppCbs.rejection, callback)
}

function onError (callback) {
  if (isBrowser || isReact) {
    global.__mpxAppCbs.error.push(callback)
  }
}

function offError (callback) {
  off(global.__mpxAppCbs.error, callback)
}

function onAppShow (callback) {
  if (isBrowser || isReact) {
    global.__mpxAppCbs.show.push(callback)
  }
}

function offAppShow (callback) {
  off(global.__mpxAppCbs.show, callback)
}

function onAppHide (callback) {
  if (isBrowser || isReact) {
    global.__mpxAppCbs.hide.push(callback)
  }
}

function offAppHide (callback) {
  off(global.__mpxAppCbs.hide, callback)
}

export {
  onAppShow,
  onAppHide,
  offAppShow,
  offAppHide,
  onError,
  offError,
  onUnhandledRejection,
  offUnhandledRejection
}
