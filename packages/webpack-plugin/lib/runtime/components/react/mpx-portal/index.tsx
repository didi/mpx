import { ReactNode, useContext, useEffect, useRef } from 'react'
import { PortalContext, ProviderContext, RouteContext, VarContext, TextPassThroughContext } from '../context'
import PortalHost, { portal } from './portal-host'

export type PortalProps = {
  children?: ReactNode
  stackPath?: number[]
}

const Portal = ({ children, stackPath }: PortalProps): null => {
  const manager = useContext(PortalContext)
  const keyRef = useRef<any>(null)
  const { pageId } = useContext(RouteContext) || {}
  const varContext = useContext(VarContext)
  const textPassThroughContext = useContext(TextPassThroughContext)
  const parentProvides = useContext(ProviderContext)

  if (textPassThroughContext) {
    children = (<TextPassThroughContext.Provider value={textPassThroughContext} key='textPassThroughWrap'>{children}</TextPassThroughContext.Provider>)
  }
  if (varContext) {
    children = (<VarContext.Provider value={varContext} key='varContextWrap'>{children}</VarContext.Provider>)
  }
  if (parentProvides) {
    children = (<ProviderContext.Provider value={parentProvides} key='providerContextWrap'>{children}</ProviderContext.Provider>)
  }

  useEffect(() => {
    manager.update(keyRef.current, children, { stackPath })
  }, [children, stackPath])
  useEffect(() => {
    if (!manager) {
      throw new Error(
        'Looks like you forgot to wrap your root component with `PortalHost` component from `@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-portal/index`.\n\n'
      )
    }
    keyRef.current = manager.mount(children, null, pageId, { stackPath })
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
