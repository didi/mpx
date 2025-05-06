import { isBrowser, isReact } from '@mpxjs/utils'

mpxGlobal.__mpxAppCbs = mpxGlobal.__mpxAppCbs || {
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
    mpxGlobal.__mpxAppCbs.rejection.push(callback)
  }
}

function offUnhandledRejection (callback) {
  off(mpxGlobal.__mpxAppCbs.rejection, callback)
}

function onError (callback) {
  if (isBrowser || isReact) {
    mpxGlobal.__mpxAppCbs.error.push(callback)
  }
}

function offError (callback) {
  off(mpxGlobal.__mpxAppCbs.error, callback)
}

function onAppShow (callback) {
  if (isBrowser || isReact) {
    mpxGlobal.__mpxAppCbs.show.push(callback)
  }
}

function offAppShow (callback) {
  off(mpxGlobal.__mpxAppCbs.show, callback)
}

function onAppHide (callback) {
  if (isBrowser || isReact) {
    mpxGlobal.__mpxAppCbs.hide.push(callback)
  }
}

function offAppHide (callback) {
  off(mpxGlobal.__mpxAppCbs.hide, callback)
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
