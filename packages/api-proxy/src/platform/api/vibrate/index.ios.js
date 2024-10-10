import ReactNativeHapticFeedback from 'react-native-haptic-feedback'
import { Vibration } from 'react-native'
import { successHandle, failHandle } from '../../../common/js'

const getType = function (type = 'light') {
  return 'impact' + type[0].toUpperCase() + type.substr(1)
}
const vibrateShort = function (options = {}) {
  const { type = 'light', success, fail, complete } = options
  try {
    ReactNativeHapticFeedback.trigger(getType(type), {
      ignoreAndroidSystemSettings: true,
      enableVibrateFallback: true
    })
    const result = {
      errMsg: 'vibrateShort:ok'
    }
    successHandle(result, success, complete)
  } catch (e) {
    const result = {
      errMsg: 'vibrateShort:fail'
    }
    successHandle(result, fail, complete)
  }
}

const vibrateLong = function (options = {}) {
  const { success, complete } = options
  Vibration.vibrate(400)
  const result = {
    errMsg: 'vibrateLong:ok'
  }
  successHandle(result, success, complete)
}

export {
  vibrateShort,
  vibrateLong
}
