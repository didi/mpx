const callbacks = []

const windowChange = function ({ width, height }) {
  callbacks.slice().forEach(cb => {
    cb({ size: { windowWidth: width, windowHeight: height } })
  })
}

function onWindowResize (callback) {
  global.getDimensionsInfo()
  if (callbacks.length === 0) {
    global.__mpxWindowResizeHandler = windowChange
  }
  callbacks.push(callback)
}

function offWindowResize (callback) {
  if (callback == null) {
    callbacks.length = 0
  } else {
    const index = callbacks.indexOf(callback)
    if (index > -1) {
      callbacks.splice(index, 1)
    }
  }
  if (callbacks.length === 0 && global.__mpxWindowResizeHandler === windowChange) {
    delete global.__mpxWindowResizeHandler
  }
}

export {
  onWindowResize,
  offWindowResize
}
