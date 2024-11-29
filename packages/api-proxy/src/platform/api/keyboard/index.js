import { ENV_OBJ, envError } from '../../../common/js'

const onKeyboardHeightChange = ENV_OBJ.onKeyboardHeightChange || envError('onKeyboardHeightChange')

const offKeyboardHeightChange = ENV_OBJ.offKeyboardHeightChange || envError('offKeyboardHeightChange')

const hideKeyboard = ENV_OBJ.hideKeyboard || envError('hideKeyboard')

export {
  onKeyboardHeightChange,
  offKeyboardHeightChange,
  hideKeyboard
}
