import { isBrowser, throwSSRWarning } from '../../../../common/js'
const fnMap = new Map()

const oldObserveList = new Set()

if (isBrowser) {
  window.addEventListener('offline', () => {
    oldObserveList.forEach(fn => fn({ isConnected: false, type: 'none' }))
  })
  window.addEventListener('online', () => {
    oldObserveList.forEach(fn => fn({ isConnected: true, type: 'unknow' }))
  })
}

export function onNetworkStatusChange (callbackFn) {
  if (!isBrowser) {
    throwSSRWarning('onNetworkStatusChange API is running in non browser environments')
    return
  }
  if (navigator.connection) {
    const proxyCallback = evt => {
      const isConnected = navigator.onLine
      callbackFn({
        isConnected,
        type: isConnected ? evt.currentTarget.effectiveType : 'none'
      })
    }
    fnMap.set(callbackFn, proxyCallback)
    navigator.connection.addEventListener('change', proxyCallback)
  } else {
    typeof callbackFn === 'function' && oldObserveList.add(callbackFn)
  }
}

export function offNetworkStatusChange (callbackFn) {
  if (!isBrowser) {
    throwSSRWarning('offNetworkStatusChange API is running in non browser environments')
    return
  }
  if (navigator.connection) {
    navigator.connection.removeEventListener('change', fnMap.get(callbackFn))
  } else {
    oldObserveList.has(callbackFn) && oldObserveList.delete(callbackFn)
  }
}
