import SystemSetting from 'react-native-system-setting'
import { successHandle, failHandle } from '../../../common/js'

function getScreenBrightness (options) {
  const { success, fail, complete } = options
  SystemSetting.getBrightness().then((value)=>{
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

function setScreenBrightness (options) {
  const { value, success, fail, complete } = options
  SystemSetting.setBrightnessForce(value).then(()=>{
    const result = {
      errMsg: 'setScreenBrightness:ok',
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
