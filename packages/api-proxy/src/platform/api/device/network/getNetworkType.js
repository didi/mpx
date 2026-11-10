import { successHandle, failHandle, isBrowser, throwSSRWarning, defineUnsupportedProps } from '../../../../common/js'

export function getNetworkType ({ success, fail = () => {}, complete = () => {} } = {}) {
  if (!isBrowser) {
    throwSSRWarning('getNetworkType API is running in non browser environments')
    return
  }
  try {
    const result = {
      errMsg: 'getNetworkType:ok',
      networkType: navigator.connection ? navigator.connection.effectiveType : 'unknown'
    }
    defineUnsupportedProps(result, ['signalStrength', 'hasSystemProxy', 'weakNet'])
    successHandle(result, success, complete)
  } catch (err) {
    failHandle({ errMsg: `getNetworkType:fail ${err}` }, fail, complete)
  }
}
