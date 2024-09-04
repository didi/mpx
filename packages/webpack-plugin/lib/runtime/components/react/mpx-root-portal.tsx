/**
 * ✔ enable
 */
import { ReactNode } from 'react'
import { Portal } from '@ant-design/react-native'
import { recordPerformance } from './performance'

interface RootPortalProps {
  enable?: boolean
  children: ReactNode
}
const _RootPortal = (props: RootPortalProps) => {
  const startTime = new Date().getTime()
  const { children, enable = true } = props
  const content = enable ? (
    // @ts-ignore
    <Portal>
      {children}
    </Portal>
  ) : (
    <>{children}</>
  );

  recordPerformance(startTime, 'mpx-root-portal')
  
  return content
}

_RootPortal.displayName = 'mpx-root-portal'

export default _RootPortal