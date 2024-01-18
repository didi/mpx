import { webHandleSuccess, webHandleFail, isBrowser, throwSSRWarning } from '../../../../common/js'

export function getNetworkType ({ success, fail = () => {}, complete = () => {} } = {}) {
  if (!isBrowser) {
    throwSSRWarning('getNetworkType API is running in non browser environments')
    return
  }
  try {
    if (navigator.connection) {
      webHandleSuccess({ networkType: navigator.connection.effectiveType }, success, complete)
    } else {
      webHandleSuccess({ networkType: 'unknown' }, success, complete)
    }
  } catch (err) {
    webHandleFail(err, fail, complete)
  }
}
