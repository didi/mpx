import SystemSetting from 'react-native-system-setting'
import { webHandleSuccess, webHandleFail } from '../../../common/js'

function getScreenBrightness (options) {
  const { success, fail, complete } = options
  SystemSetting.getBrightness().then((value)=>{
    const result = {
      errMsg: 'getScreenBrightness:ok',
      value
    }
    webHandleSuccess(result, success, complete)
  }).catch(() => {
    const result = {
      errMsg: 'getScreenBrightness:fail'
    }
    webHandleFail(result, fail, complete)
  })
}

function setScreenBrightness (options) {
  const { value, success, fail, complete } = options
  SystemSetting.setBrightnessForce(value).then(()=>{
    const result = {
      errMsg: 'setScreenBrightness:ok',
    }
    webHandleSuccess(result, success, complete)
  }).catch(() => {
    const result = {
      errMsg: 'setScreenBrightness:fail'
    }
    webHandleFail(result, fail, complete)
  })
}

export {
  getScreenBrightness,
  setScreenBrightness
}
