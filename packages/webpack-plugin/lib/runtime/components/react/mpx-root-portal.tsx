/**
 * ✔ enable
 */
import { ReactNode } from 'react'
import { Portal, View } from '@ant-design/react-native'

interface RootPortalProps {
  enable?: boolean
  children: ReactNode
  style?: Record<string, any>
}
const _RootPortal = (props: RootPortalProps) => {
  const { children, enable = true, style } = props
  return enable ? (
    <Portal>
      <View style={style}>{children}</View>
    </Portal>
  ) : (
    <View style={style}>{children}</View>
  );
}

_RootPortal.displayName = 'mpx-root-portal'

export default _RootPortal