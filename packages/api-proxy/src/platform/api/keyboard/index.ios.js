import { Keyboard } from 'react-native'

import { ENV_OBJ, envError } from '../../../common/js'
let hasListener = false
let callbacks = []

function keyboardShowListener(e) {
  const endCoordinates = e.endCoordinates || {}
  callbacks.forEach(cb => cb({
    height: endCoordinates.height
  }))
}
function keyboardHideListener(e) {
  const endCoordinates = e.endCoordinates || {}
  let height
  if (__mpx_mode__ === 'ios') {
    height = 0
  } else {
    height = endCoordinates.height
  }
  callbacks.forEach(cb => cb({
    height
  }))
}
const onKeyboardHeightChange = function (callback) {
  if (!hasListener) {
    Keyboard.addListener("keyboardDidShow", keyboardShowListener)
    Keyboard.addListener("keyboardDidHide", keyboardHideListener)
    hasListener = true
  }
  callbacks.push(callback)
}
const offKeyboardHeightChange = function (callback) {
  const index = callbacks.indexOf(callback)
  if (index > -1) {
    callbacks.splice(index, 1)
  }
  if (callbacks.length === 0) {
    Keyboard.removeAllListeners('keyboardDidShow')
    Keyboard.removeAllListeners('keyboardDidHide')
    hasListener = false
  }
}

export {
  onKeyboardHeightChange,
  offKeyboardHeightChange
}
