import { isBrowser, isReact } from '@mpxjs/utils'

global.__mpxAppCbs = global.__mpxAppCbs || {
  show: [],
  hide: [],
  error: [],
  rejection: [],
  lazyLoad: []
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
  if (callback == null) {
    global.__mpxAppCbs.rejection.length = 0
    return
  }
  off(global.__mpxAppCbs.rejection, callback)
}

function onError (callback) {
  if (isBrowser || isReact) {
    global.__mpxAppCbs.error.push(callback)
  }
}

function offError (callback) {
  if (callback == null) {
    global.__mpxAppCbs.error.length = 0
    return
  }
  off(global.__mpxAppCbs.error, callback)
}

function onAppShow (callback) {
  if (isBrowser || isReact) {
    global.__mpxAppCbs.show.push(callback)
  }
}

function offAppShow (callback) {
  if (callback == null) {
    global.__mpxAppCbs.show.length = 0
    return
  }
  off(global.__mpxAppCbs.show, callback)
}

function onAppHide (callback) {
  if (isBrowser || isReact) {
    global.__mpxAppCbs.hide.push(callback)
  }
}

function offAppHide (callback) {
  if (callback == null) {
    global.__mpxAppCbs.hide.length = 0
    return
  }
  off(global.__mpxAppCbs.hide, callback)
}

function onLazyLoadError (callback) {
  if (isReact) {
    global.__mpxAppCbs.lazyLoad.push(callback)
  }
}

function offLazyLoadError (callback) {
  if (isReact) {
    if (callback == null) {
      global.__mpxAppCbs.lazyLoad.length = 0
      return
    }
    off(global.__mpxAppCbs.lazyLoad, callback)
  }
}

export {
  onAppShow,
  onAppHide,
  offAppShow,
  offAppHide,
  onError,
  offError,
  onUnhandledRejection,
  offUnhandledRejection,
  onLazyLoadError,
  offLazyLoadError
}
