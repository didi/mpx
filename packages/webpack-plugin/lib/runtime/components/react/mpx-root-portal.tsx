/**
 * ✔ enable
 */
import { ReactNode } from 'react'
// import { Portal } from '@ant-design/react-native'
import { warn } from '@mpxjs/utils'
interface RootPortalProps {
  enable?: boolean
  children: ReactNode
  [x: string]: any
}

const _RootPortal = (props: RootPortalProps) => {
  const { children, enable = true } = props
  if (props.style) {
    warn('The root-portal component does not support the style prop.')
  }
  // return enable
  //   ? <Portal>
  //     {children}
  //   </Portal>
  //   : <>{children}</>
  return <>{children}</>
}

_RootPortal.displayName = 'mpx-root-portal'

export default _RootPortal
