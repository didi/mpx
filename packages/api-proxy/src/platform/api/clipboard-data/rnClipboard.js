import { successHandle, failHandle } from '../../../common/js'
import { type } from '@mpxjs/utils'
// import { getStringAsync, setStringAsync } from 'expo-clipboard'

const setClipboardData = function (options = {}) {
  const { data, success, fail, complete } = options
  if (!data || type(data) !== 'String') {
    const errStr = !data ? 'parameter.data should be String instead of Undefined;' : `parameter.data should be String instead of ${type(data)};`
    const result = {
      errno: 1001,
      errMsg: errStr
    }
    failHandle(result, fail, complete)
    return
  }
  // setStringAsync(data).then(() => {
  //   const result = {
  //     errMsg: 'setClipboardData:ok'
  //   }
  //   successHandle(result, success, complete)
  // }).catch((e) => {
  //   const result = {
  //     errMsg: `setClipboardData:fail ${e}`
  //   }
  //   failHandle(result, fail, complete)
  // })
}

const getClipboardData = function (options = {}) {
  // const { success, fail, complete } = options
  // getStringAsync().then((data) => {
  //   const result = {
  //     data,
  //     errMsg: 'getClipboardData:ok'
  //   }
  //   successHandle(result, success, complete)
  // }).catch((e) => {
  //   const result = {
  //     errMsg: `getClipboardData:fail ${e}`
  //   }
  //   failHandle(result, fail, complete)
  // })
}

export {
  setClipboardData,
  getClipboardData
}
