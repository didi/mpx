import React, { useEffect, useRef } from 'react'
import { PortalContextValue } from '../context'

export type PortalConsumerProps = {
  manager: PortalContextValue
  children?: React.ReactNode
}
const PortalConsumer = ({ manager, children } :PortalConsumerProps): JSX.Element | null => {
  const keyRef = useRef<any>(null)
  useEffect(() => {
    if (!manager) {
      throw new Error(
        'Looks like you forgot to wrap your root component with `Provider` component from `@ant-design/react-native`.\n\n'
      )
    }
    keyRef.current = manager.mount(children)
    manager.update(keyRef.current, children)
    return () => {
      manager.unmount(keyRef.current)
    }
  }, [])
  return null
}

export default PortalConsumer
