import { Keyboard } from 'react-native'
import { successHandle, failHandle } from '../../../common/js'
let hasListener = false
const callbacks = []

function keyboardShowListener (e) {
  const endCoordinates = e.endCoordinates || {}
  // eslint-disable-next-line node/no-callback-literal
  callbacks.forEach(cb => cb({
    height: endCoordinates.height
  }))
}
function keyboardHideListener (e) {
  const endCoordinates = e.endCoordinates || {}
  let height
  if (__mpx_mode__ === 'ios') {
    height = 0
  } else {
    height = endCoordinates.height
  }
  // eslint-disable-next-line node/no-callback-literal
  callbacks.forEach(cb => cb({
    height
  }))
}
const onKeyboardHeightChange = function (callback) {
  if (!hasListener) {
    Keyboard.addListener('keyboardDidShow', keyboardShowListener)
    Keyboard.addListener('keyboardDidHide', keyboardHideListener)
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

const hideKeyboard = function (options = {}) {
  const { success, fail, complete } = options
  try {
    Keyboard.dismiss()
    const result = { errMsg: 'hideKeyboard:ok' }
    successHandle(result, success, complete)
  } catch (err) {
    const result = { errMsg: err.message }
    failHandle(result, fail, complete)
  }
}

export {
  onKeyboardHeightChange,
  offKeyboardHeightChange,
  hideKeyboard
}
