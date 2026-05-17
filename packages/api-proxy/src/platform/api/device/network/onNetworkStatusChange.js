import { isBrowser, throwSSRWarning } from '../../../../common/js'
const fnMap = new Map()

const oldObserveList = new Set()

if (isBrowser) {
  window.addEventListener('offline', () => {
    oldObserveList.forEach(fn => fn({ isConnected: false, networkType: 'none' }))
  })
  window.addEventListener('online', () => {
    oldObserveList.forEach(fn => fn({ isConnected: true, networkType: 'unknow' }))
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
        networkType: isConnected ? evt.currentTarget.effectiveType : 'none'
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
  if (callbackFn == null) {
    // 不传 callback 时清除所有监听
    fnMap.forEach((proxyCallback, originalCallback) => {
      if (navigator.connection) {
        navigator.connection.removeEventListener('change', proxyCallback)
      }
    })
    fnMap.clear()
    oldObserveList.clear()
    return
  }
  if (navigator.connection) {
    navigator.connection.removeEventListener('change', fnMap.get(callbackFn))
    fnMap.delete(callbackFn)
  } else {
    oldObserveList.has(callbackFn) && oldObserveList.delete(callbackFn)
  }
}
