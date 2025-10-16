import { ReactNode, useContext, useEffect, useRef } from 'react'
import { PortalContext, ProviderContext, RouteContext, VarContext } from '../context'
import PortalHost, { portal } from './portal-host'

export type PortalProps = {
  children?: ReactNode,
  RouteContext?: typeof RouteContext,
  VarContext?: typeof VarContext
  PortalContext?: typeof PortalContext
}

const Portal = ({
    children,
    PortalContext: ScopePortalContext = PortalContext,
    RouteContext: ScopeRouteContext = RouteContext,
    VarContext: ScopeVarContext = VarContext,
}: PortalProps): null => {
  const manager = useContext(ScopePortalContext)
  const keyRef = useRef<any>(null)
  const { pageId } = useContext(ScopeRouteContext) || {}
  const varContext = useContext(ScopeVarContext)
  const parentProvides = useContext(ProviderContext)

  if (varContext) {
    children = (<ScopeVarContext.Provider value={varContext} key='varContextWrap'>{children}</ScopeVarContext.Provider>)
  }
  if (parentProvides) {
    children = (<ProviderContext.Provider value={parentProvides} key='providerContextWrap'>{children}</ProviderContext.Provider>)
  }

  useEffect(() => {
    manager.update(keyRef.current, children)
  }, [children])
  useEffect(() => {
    if (!manager) {
      throw new Error(
        'Looks like you forgot to wrap your root component with `PortalHost` component from `@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-portal/index`.\n\n'
      )
    }
    keyRef.current = manager.mount(children, null, pageId)
    return () => {
      manager.unmount(keyRef.current)
    }
  }, [])
  return null
}

Portal.Host = PortalHost
Portal.add = portal.add
Portal.remove = portal.remove
Portal.update = portal.update

export default Portal
