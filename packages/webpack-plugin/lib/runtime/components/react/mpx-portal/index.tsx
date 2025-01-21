import { ReactNode, useContext } from 'react'
import { PortalContext } from '../context'
import PortalConsumer from './portal-consumer'
import PortalHost, { portal } from './portal-host'

export type PortalProps = {
  /**
   * Content of the `Portal`.
   */
  children?: ReactNode
}

const Portal = ({ children }:PortalProps): JSX.Element => {
  const manager = useContext(PortalContext)
  return <PortalConsumer manager={manager}>{children}</PortalConsumer>
}

Portal.Host = PortalHost
Portal.add = portal.add
Portal.remove = portal.remove
Portal.update = portal.update

export default Portal
