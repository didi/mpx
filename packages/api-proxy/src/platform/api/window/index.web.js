import { isBrowser } from '../../../common/js'

const callbacks = []

if (isBrowser) {
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
  const index = callbacks.indexOf(callback)
  if (index > -1) {
    callbacks.splice(index, 1)
  }
}

export {
  onWindowResize,
  offWindowResize
}
