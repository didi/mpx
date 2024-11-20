// import * as Brightness from 'expo-brightness'
import { successHandle, failHandle } from '../../../common/js'

function getScreenBrightness (options = {}) {
  const { success, fail, complete } = options
  Brightness.getBrightnessAsync().then(value => {
    const result = {
      errMsg: 'getScreenBrightness:ok',
      value
    }
    successHandle(result, success, complete)
  }).catch(() => {
    const result = {
      errMsg: 'getScreenBrightness:fail'
    }
    failHandle(result, fail, complete)
  })
}

function setScreenBrightness (options = {}) {
  const { value, success, fail, complete } = options
  Brightness.setBrightnessAsync(value).then(() => {
    const result = {
      errMsg: 'setScreenBrightness:ok'
    }
    successHandle(result, success, complete)
  }).catch(() => {
    const result = {
      errMsg: 'setScreenBrightness:fail'
    }
    failHandle(result, fail, complete)
  })
}

export {
  getScreenBrightness,
  setScreenBrightness
}
