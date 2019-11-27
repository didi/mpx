const callbacks = []

window.addEventListener('resize', () => {
  const size = {
    windowWidth: window.screen.width,
    windowHeight: window.screen.height
  }
  callbacks.forEach(callback => {
    callback({
      size
    })
  })
})

function onWindowResize (callback) {
  callbacks.push(callback)
}

function offWindowResize (callback) {
  callbacks.splice(callbacks.indexOf(callback), 1)
}

export {
  onWindowResize,
  offWindowResize
}
