import { useContext, useImperativeHandle } from 'react'
import { PortalManagerProxyContext } from '../context'
import { usePortalHostManager } from '../mpx-portal/portal-manager'

export function useNavPortalManagerSource () {
  const managerRef = useContext(PortalManagerProxyContext)
  const manager = usePortalHostManager()
  useImperativeHandle(managerRef, () => manager)
  return manager
}
