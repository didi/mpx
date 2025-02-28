import { ReactNode } from 'react'
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

const Portal = ({ children, varContext }:PortalProps): JSX.Element => {
  const hasVarContext = varContext && Object.keys(varContext).length
  if (hasVarContext) {
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
