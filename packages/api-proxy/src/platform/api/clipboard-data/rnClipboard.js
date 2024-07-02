import Clipboard from '@react-native-clipboard/clipboard'
import { webHandleSuccess, webHandleFail } from '../../../common/js/web'
import { type } from '@mpxjs/utils'
const setClipboardData = function (options) {
  const { data, success, fail, complete } = options
  if (!data || type(data) !== 'String') {
    const errStr = !data ? 'parameter.data should be String instead of Undefined;' : `parameter.data should be String instead of ${type(data)};`
    const result = {
      errno: 1001,
      errMsg: errStr
    }
    webHandleFail(result, fail, complete)
    return
  }
  Clipboard.setString(data)
  const result = {
    errMsg: 'setClipboardData:ok'
  }
  webHandleSuccess(result, success, complete)
}

const getClipboardData = function (options) {
  const { success, fail, complete } = options
  Clipboard.getString().then((data) => {
    const result = {
      data,
      errMsg: 'getClipboardData:ok'
    }
    webHandleSuccess(result, success, complete)
  }).catch(() => {
    const result = {
      errMsg: 'setClipboardData:fail'
    }
    webHandleFail(result, fail, complete)
  })
}

export {
  setClipboardData,
  getClipboardData
}
