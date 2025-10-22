import { ReactNode, useContext, useEffect, useRef } from 'react'
import { PortalContext, ProviderContext, RouteContext, VarContext } from '../context'
import PortalHost, { portal } from './portal-host'

export type PortalProps = {
  children?: ReactNode
}

const Portal = ({ children }: PortalProps): null => {
  const manager = useContext(PortalContext)
  const keyRef = useRef<any>(null)
  const { pageId } = useContext(RouteContext) || {}
  const varContext = useContext(VarContext)
  const parentProvides = useContext(ProviderContext)

  if (varContext) {
    children = (<VarContext.Provider value={varContext} key='varContextWrap'>{children}</VarContext.Provider>)
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
