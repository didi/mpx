import { Dimensions } from 'react-native'

const callbacks = []
let subscription
const addListener = function () {
  subscription = Dimensions.addEventListener(
    'change',
    ({ window }) => {
      const result = {
        size: {
          windowWidth: window.width,
          windowHeight: window.height
        }
      }
      callbacks.forEach(cb => cb(result))
    }
  )
}

const removeListener = function () {
  subscription && subscription.remove()
}

function onWindowResize (callback) {
  if (callbacks.length === 0) {
    addListener()
  }
  callbacks.push(callback)
}

function offWindowResize (callback) {
  const index = callbacks.indexOf(callback)
  if (index > -1) {
    callbacks.splice(index, 1)
  }
  if (callbacks.length === 0) {
    removeListener()
  }
}

export {
  onWindowResize,
  offWindowResize
}
