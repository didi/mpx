/**
 * ✔ enable
 */
import { ReactNode, createElement, Fragment, useContext } from 'react'
import Portal from './mpx-portal'
import { warn } from '@mpxjs/utils'
import { VarContext } from './context'
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
  const varContext = useContext(VarContext)
  return enable
    ? createElement(Portal, { varContext }, children)
    : createElement(Fragment, null, children)
}

_RootPortal.displayName = 'MpxRootPortal'

export default _RootPortal
