import { useEffect, useRef, ReactNode } from 'react'
import { PortalContextValue } from '../context'

export type PortalConsumerProps = {
  manager: PortalContextValue
  children?: ReactNode
}
const PortalConsumer = ({ manager, children } :PortalConsumerProps): JSX.Element | null => {
  const keyRef = useRef<any>(null)
  useEffect(() => {
    manager.update(keyRef.current, children)
  }, [children])
  useEffect(() => {
    if (!manager) {
      throw new Error(
        'Looks like you forgot to wrap your root component with `Provider` component from `@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-portal/index`.\n\n'
      )
    }
    keyRef.current = manager.mount(children)
    return () => {
      manager.unmount(keyRef.current)
    }
  }, [])
  return null
}

export default PortalConsumer
