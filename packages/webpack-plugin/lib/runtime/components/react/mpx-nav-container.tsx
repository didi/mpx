import { NavSharedValue } from './context'
import { useMemo, useState } from 'react'
import { NavPortal } from './nav/components'

interface MpxNavContainerProps {
  children?: React.ReactNode
}

export default function MpxNavContainer(props: MpxNavContainerProps) {
  return <NavPortal>{props.children}</NavPortal>
}
