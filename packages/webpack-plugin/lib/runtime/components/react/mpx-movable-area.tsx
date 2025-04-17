/**
 * ✘ scale-area
 */

import { View } from 'react-native'
import { JSX, forwardRef, ReactNode, useRef, useMemo, createElement } from 'react'
import useNodesRef, { HandlerRef } from './useNodesRef'
import useInnerProps from './getInnerListeners'
import { MovableAreaContext } from './context'
import { useTransformStyle, wrapChildren, useLayout, extendObject } from './utils'
import Portal from './mpx-portal'

interface MovableAreaProps {
  style?: Record<string, any>;
  children: ReactNode;
  width?: number;
  height?: number;
  'enable-offset'?: boolean;
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>;
  'parent-font-size'?: number;
  'parent-width'?: number;
  'parent-height'?: number;
}

const _MovableArea = forwardRef<HandlerRef<View, MovableAreaProps>, MovableAreaProps>((props: MovableAreaProps, ref): JSX.Element => {
  const { style = {}, 'enable-var': enableVar, 'external-var-context': externalVarContext, 'parent-font-size': parentFontSize, 'parent-width': parentWidth, 'parent-height': parentHeight } = props

  const {
    hasSelfPercent,
    normalStyle,
    hasVarDec,
    varContextRef,
    hasPositionFixed,
    setWidth,
    setHeight
  } = useTransformStyle(style, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight })

  const movableViewRef = useRef(null)
  useNodesRef(props, ref, movableViewRef, {
    style: normalStyle
  })

  const contextValue = useMemo(() => ({
    height: normalStyle.height || 10,
    width: normalStyle.width || 10
  }), [normalStyle.width, normalStyle.height])

  const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: movableViewRef })

  const innerProps = useInnerProps(props, extendObject({
    style: extendObject({ height: contextValue.height, width: contextValue.width, overflow: 'hidden' }, normalStyle, layoutStyle),
    ref: movableViewRef
  }, layoutProps), [], { layoutRef })

  let movableComponent: JSX.Element = createElement(MovableAreaContext.Provider, { value: contextValue }, createElement(
    View,
    innerProps,
    wrapChildren(
      props,
      {
        hasVarDec,
        varContext: varContextRef.current
      }
    )
  ))
  if (hasPositionFixed) {
    movableComponent = createElement(Portal, null, movableComponent)
  }
  return movableComponent
})

_MovableArea.displayName = 'MpxMovableArea'

export default _MovableArea
