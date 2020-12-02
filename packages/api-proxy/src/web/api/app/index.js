const callbacks = []

window.__mpxAppCbs = window.__mpxAppCbs || {
  show: [],
  hide: []
}

window.addEventListener('resize', () => {
  const result = {
    size: {
      windowWidth: window.screen.width,
      windowHeight: window.screen.height
    }
  }
  callbacks.forEach(cb => cb(result))
})

function onAppShow (callback) {
  window.__mpxAppCbs.show.push(callback)
}

function onAppHide (callback) {
  window.__mpxAppCbs.hide.push(callback)
}

function offAppShow (callback) {
  const cbs = window.__mpxAppCbs.show
  cbs.splice(cbs.indexOf(callback), 1)
}

function offAppHide (callback) {
  const cbs = window.__mpxAppCbs.hide
  cbs.splice(cbs.indexOf(callback), 1)
}

export {
  onAppShow,
  onAppHide,
  offAppShow,
  offAppHide
}
