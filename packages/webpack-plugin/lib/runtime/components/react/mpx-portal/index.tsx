import { ReactNode } from 'react'
import { PortalContext, PortalContextValue } from '../context'
import PortalConsumer from './portal-consumer'
import { useNavigation } from '@react-navigation/native'
import PortalHost, { portal } from './portal-host'

export type PortalProps = {
  /**
   * Content of the `Portal`.
   */
  children?: ReactNode
  key?: string
  manager?: PortalContextValue,
  pageId?: number
}

const Portal = ({ children }:PortalProps): JSX.Element => {
  const navigation = useNavigation()
  const pageId = navigation?.pageId
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
