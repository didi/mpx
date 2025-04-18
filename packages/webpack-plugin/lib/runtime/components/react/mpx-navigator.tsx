/**
 * ✔ hover-class
 * ✘ hover-stop-propagation
 * ✔ hover-start-time
 * ✔ hover-stay-time
 * ✔ open-type
 * ✔ url
 * ✔ delta
 */
import { useCallback, forwardRef, JSX, createElement, MutableRefObject } from 'react'
import { redirectTo, navigateTo, navigateBack, reLaunch, switchTab } from '@mpxjs/api-proxy'

import MpxView, { _ViewProps } from './mpx-view'

interface _NavigatorProps extends _ViewProps {
  ['open-type']: 'navigate' | 'redirect' | 'switchTab' | 'reLaunch' | 'navigateBack'
  url: string
  delta: number
}

const _Navigator = forwardRef<any, _NavigatorProps>((props, ref): JSX.Element => {
  const {
    children,
    'open-type': openType,
    url = '',
    delta
  } = props

  const handleClick = useCallback(() => {
    switch (openType) {
      case 'navigateBack':
        navigateBack({ delta })
        break
      case 'redirect':
        redirectTo({ url })
        break
      case 'switchTab':
        switchTab({ url })
        break
      case 'reLaunch':
        reLaunch({ url })
        break
      default:
        navigateTo({ url })
        break
    }
  }, [openType, url, delta])

  const innerProps = {
    ref,
    bindtap: handleClick
  }

  return createElement(MpxView, innerProps, children)
})

_Navigator.displayName = 'MpxNavigator'

export default _Navigator
