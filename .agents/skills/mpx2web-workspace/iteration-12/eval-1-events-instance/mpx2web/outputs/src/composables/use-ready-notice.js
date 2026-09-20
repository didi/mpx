import { getCurrentInstance } from '@mpxjs/core'

export function useReadyNotice () {
  const current = getCurrentInstance()
  const component = current && current.proxy
  return () => {
    if (component) component.recordReady()
  }
}
