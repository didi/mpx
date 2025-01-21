import { useEffect, useRef, ReactNode, useContext } from 'react'
import { PortalContextValue, RouteContext } from '../context'

export type PortalConsumerProps = {
  manager: PortalContextValue
  children?: ReactNode
}
const PortalConsumer = ({ manager, children } :PortalConsumerProps): JSX.Element | null => {
  const keyRef = useRef<any>(null)
  const pageId = useContext(RouteContext)
  useEffect(() => {
    manager.update(keyRef.current, children)
  }, [children])
  useEffect(() => {
    if (!manager) {
      throw new Error(
        'Looks like you forgot to wrap your root component with `Provider` component from `@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-portal/index`.\n\n'
      )
    }
    keyRef.current = manager.mount(children, null, pageId)
    return () => {
      manager.unmount(keyRef.current)
    }
  }, [])
  return null
}

export default PortalConsumer
