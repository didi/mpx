const callbacks = []

const windowChange = function ({ width, height }) {
  callbacks.slice().forEach(cb => {
    cb({ size: { windowWidth: width, windowHeight: height } })
  })
}

function onWindowResize (callback) {
  if (callbacks.length === 0) {
    global.__mpxWindowResizeHandler = windowChange
  }
  callbacks.push(callback)
}

function offWindowResize (callback) {
  const index = callbacks.indexOf(callback)
  if (index > -1) {
    callbacks.splice(index, 1)
  }
  if (callbacks.length === 0 && global.__mpxWindowResizeHandler === windowChange) {
    delete global.__mpxWindowResizeHandler
  }
}

export {
  onWindowResize,
  offWindowResize
}
