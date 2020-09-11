import { webHandleSuccess, webHandleFail } from '../../../common/js'

export function getNetworkType ({ success, fail = () => {}, complete = () => {} }) {
  try {
    if (navigator.connection) {
      webHandleSuccess({ networkType: navigator.connection.effectiveType }, success, complete)
    } else {
      webHandleSuccess({ networkType: 'unknow' }, success, complete)
    }
  } catch (err) {
    webHandleFail(err, fail, complete)
  }
}
