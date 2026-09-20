import { getCurrentInstance } from '@mpxjs/core'

export function useReadyNotice () {
  const current = getCurrentInstance()

  return () => {
    const target = current && current.target
    const proxy = current && current.proxy
    const instance = target && typeof target.recordReady === 'function'
      ? target
      : proxy

    if (instance && typeof instance.recordReady === 'function') {
      instance.recordReady()
    }
  }
}
