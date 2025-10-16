import { useMemo, useRef } from 'react'
import { PortalManagerContextValue, PortalManagerProxyContext, RouteContextValue } from '../context'
import { NavPortalContext, NavRouteContext, NavVarContext } from './context'
import PortalHost from '../mpx-portal/portal-host'
import Portal from '../mpx-portal'

export function NavPortalHostProvider({
  pageId,
  navigation,
  children
}: React.PropsWithChildren<RouteContextValue & Partial<Pick<RouteContextValue, 'pageId'>>>) {
  const id = useMemo(() => pageId ?? Math.random(), [pageId])
  const value = useMemo(() => ({ pageId: id, navigation }), [id, navigation])
  const managerRef = useRef<PortalManagerContextValue>(null)

  return (
    <PortalManagerProxyContext.Provider value={managerRef}>
      <NavRouteContext.Provider value={value}>
        <PortalHost
          disableListenExternalEvent
          PortalManagerProxyContext={PortalManagerProxyContext}
          PortalContext={NavPortalContext}
          RouteContext={NavRouteContext}>
          {children}
        </PortalHost>
      </NavRouteContext.Provider>
    </PortalManagerProxyContext.Provider>
  )
}

export function NavPortal({ children }: { children?: React.ReactNode }) {
  return (
    <Portal RouteContext={NavRouteContext} VarContext={NavVarContext} PortalContext={NavPortalContext}>
      {children}
    </Portal>
  )
}
