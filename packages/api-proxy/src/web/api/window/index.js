const callbacks = []

if (typeof window !== 'undefined') {
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
