import { getCurrentInstance } from '@mpxjs/core'

export function useReadyNotice () {
  const current = getCurrentInstance()
  return () => current.target.recordReady()
}
