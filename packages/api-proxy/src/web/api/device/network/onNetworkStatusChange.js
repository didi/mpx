import { inBrowser } from '../../../../utils/env'
const fnMap = new Map()

const oldObserveList = new Set()

if (inBrowser) {
  window.addEventListener('offline', () => {
    oldObserveList.forEach(fn => fn({ isConnected: false, type: 'none' }))
  })
  window.addEventListener('online', () => {
    oldObserveList.forEach(fn => fn({ isConnected: true, type: 'unknow' }))
  })
}

export function onNetworkStatusChange (callbackFn) {
  if (navigator.connection) {
    let proxyCallback = evt => {
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
  if (navigator.connection) {
    navigator.connection.removeEventListener('change', fnMap.get(callbackFn))
  } else {
    oldObserveList.has(callbackFn) && oldObserveList.delete(callbackFn)
  }
}
