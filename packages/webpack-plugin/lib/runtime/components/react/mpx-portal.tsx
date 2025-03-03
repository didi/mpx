import { ReactNode, useContext } from 'react'
import { PortalContext, PortalContextValue, VarContext } from './context'
import PortalConsumer from './mpx-portal/portal-consumer'
import PortalHost, { portal } from './mpx-portal/portal-host'

export type PortalProps = {
  /**
   * Content of the `Portal`.
   */
  children?: ReactNode
  key?: string
  manager?: PortalContextValue,
  varContext?: Record<string, any> | undefined
}

const Portal = ({ children }:PortalProps): JSX.Element => {
  const varContext = useContext(VarContext)
  if (varContext) {
    children = (<VarContext.Provider value={varContext} key='varContextWrap'>{children}</VarContext.Provider>)
  }
  return (
    <PortalContext.Consumer>
      {(manager) => (
        <PortalConsumer manager={manager}>{children}</PortalConsumer>
      )}
    </PortalContext.Consumer>
  )
}

Portal.Host = PortalHost
Portal.add = portal.add
Portal.remove = portal.remove
Portal.update = portal.update

export default Portal
