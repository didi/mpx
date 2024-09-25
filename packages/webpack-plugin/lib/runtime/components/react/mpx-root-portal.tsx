/**
 * ✔ enable
 */
import { ReactNode } from 'react'
import { Portal } from '@ant-design/react-native'

interface RootPortalProps {
  enable?: boolean
  children: ReactNode
}
const _RootPortal = (props: RootPortalProps) => {
  const { children, enable = true } = props
  return enable ? (
    // @ts-ignore
    <Portal>
      {children}
    </Portal>
  ) : (
    <>{children}</>
  );
}

_RootPortal.displayName = 'mpx-root-portal'

export default _RootPortal