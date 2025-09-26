import { useContext } from 'react'
import { NavSharedContext } from './context'

export function useNavShared () {
  const navSharedValue = useContext(NavSharedContext)

  return [navSharedValue.customNav, navSharedValue.setCustomNav] as const
}
