import { AnimatedStyle } from 'react-native-reanimated'
import { useNavShared } from './useNavShared'
import { NavSharedContext, NavSharedValue } from './context'
import { useLayoutEffect, useMemo, useState } from 'react'
import { StyleProp } from 'react-native'
import { isAndroid } from './utils'

interface MpxNavContainerProps {
  children?: React.ReactNode
}

export default function MpxNavContainer(props: MpxNavContainerProps) {
  const [, setCustomNav] = useNavShared()

  useLayoutEffect(() => {
    if (!isAndroid) return
    if (props.children) {
      setCustomNav(props.children)
    }

    return () => {
      setCustomNav(undefined)
    }
  }, [props.children])

  return isAndroid ? null : props.children
}

export function NavSharedProvider({ children }: { children?: React.ReactNode }) {
  const [customNav, setCustomNav] = useState()
  const value = useMemo(() => ({ customNav, setCustomNav } as NavSharedValue), [customNav])
  return <NavSharedContext.Provider value={value}>{children}</NavSharedContext.Provider>
}
