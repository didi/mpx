import { inBrowser } from '../../../utils/env'
const callbacks = []

global.__mpxAppCbs = global.__mpxAppCbs || {
  show: [],
  hide: []
}

if (inBrowser) {
  window.addEventListener('resize', () => {
    const result = {
      size: {
        windowWidth: window.screen.width,
        windowHeight: window.screen.height
      }
    }
    callbacks.forEach(cb => cb(result))
  })
}

function onAppShow (callback) {
  global.__mpxAppCbs.show.push(callback)
}

function onAppHide (callback) {
  global.__mpxAppCbs.hide.push(callback)
}

function offAppShow (callback) {
  const cbs = global.__mpxAppCbs.show
  cbs.splice(cbs.indexOf(callback), 1)
}

function offAppHide (callback) {
  const cbs = global.__mpxAppCbs.hide
  cbs.splice(cbs.indexOf(callback), 1)
}

export {
  onAppShow,
  onAppHide,
  offAppShow,
  offAppHide
}
