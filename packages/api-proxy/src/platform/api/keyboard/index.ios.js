import { Keyboard } from 'react-native'
import { successHandle, failHandle, defineUnsupportedProps } from '../../../common/js'
let hasListener = false
let keyboardShowSubscription
let keyboardHideSubscription
const callbacks = []

function keyboardShowListener (e) {
  if (!callbacks.length) return
  const endCoordinates = e.endCoordinates || {}
  const result = { height: endCoordinates.height }
  defineUnsupportedProps(result, ['duration'])
  callbacks.forEach(cb => cb(result))
}
function keyboardHideListener () {
  if (!callbacks.length) return
  const result = { height: 0 }
  defineUnsupportedProps(result, ['duration'])
  callbacks.forEach(cb => cb(result))
}
const onKeyboardHeightChange = function (callback) {
  if (!hasListener) {
    keyboardShowSubscription = Keyboard.addListener('keyboardDidShow', keyboardShowListener)
    keyboardHideSubscription = Keyboard.addListener('keyboardDidHide', keyboardHideListener)
    hasListener = true
  }
  callbacks.push(callback)
}
const offKeyboardHeightChange = function (callback) {
  const index = callbacks.indexOf(callback)
  if (index > -1) {
    callbacks.splice(index, 1)
  }
  if (callbacks.length === 0 || callback == null) {
    callbacks.length = 0
    if (hasListener) {
      keyboardShowSubscription.remove()
      keyboardHideSubscription.remove()
      hasListener = false
    }
  }
}

const hideKeyboard = function (options = {}) {
  const { success, fail, complete } = options
  try {
    Keyboard.dismiss()
    const result = { errMsg: 'hideKeyboard:ok' }
    successHandle(result, success, complete)
  } catch (err) {
    const result = { errMsg: `hideKeyboard:fail ${err.message}` }
    failHandle(result, fail, complete)
  }
}

export {
  onKeyboardHeightChange,
  offKeyboardHeightChange,
  hideKeyboard
}
