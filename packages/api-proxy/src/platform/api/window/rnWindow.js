import { DeviceEventEmitter, Dimensions } from 'react-native'
import { getFocusedNavigation } from '@mpxjs/utils'

const callbacks = []
let subscription
const addListener = function () {
  const listener = ({ window, navigation }) => {
    if (__mpx_mode__ === 'ios' && navigation !== getFocusedNavigation()) return
    const result = {
      size: {
        windowWidth: window.width,
        windowHeight: window.height
      }
    }
    callbacks.forEach(cb => cb(result))
  }
  subscription = __mpx_mode__ === 'ios'
    ? DeviceEventEmitter.addListener('mpxWindowResize', listener)
    : Dimensions.addEventListener('change', listener)
}

const removeListener = function () {
  subscription && subscription.remove()
  subscription = null
}

function onWindowResize (callback) {
  if (callbacks.length === 0) {
    addListener()
  }
  callbacks.push(callback)
}

function offWindowResize (callback) {
  if (callback == null) {
    // 不传 callback 时清除所有监听
    callbacks.length = 0
    removeListener()
    return
  }
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
