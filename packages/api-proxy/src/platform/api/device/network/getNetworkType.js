import { successHandle, failHandle, isBrowser, throwSSRWarning } from '../../../../common/js'

export function getNetworkType ({ success, fail = () => {}, complete = () => {} } = {}) {
  if (!isBrowser) {
    throwSSRWarning('getNetworkType API is running in non browser environments')
    return
  }
  try {
    if (navigator.connection) {
      successHandle({ networkType: navigator.connection.effectiveType }, success, complete)
    } else {
      successHandle({ networkType: 'unknown' }, success, complete)
    }
  } catch (err) {
    failHandle(err, fail, complete)
  }
}
