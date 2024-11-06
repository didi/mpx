/**
 * ✘ for
 */
import { JSX, useRef, forwardRef, ReactNode } from 'react'
import { View, ViewStyle, NativeSyntheticEvent } from 'react-native'
import { noop, warn } from '@mpxjs/utils'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { splitProps, splitStyle, useLayout, useTransformStyle, wrapChildren, extendObject } from './utils'
import { LabelContext, LabelContextValue } from './context'

export interface LabelProps {
  for?: string
  style?: ViewStyle & Record<string, any>
  'enable-offset'?: boolean
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>
  'parent-font-size'?: number
  'parent-width'?: number
  'parent-height'?: number
  children: ReactNode
  bindtap?: (evt: NativeSyntheticEvent<TouchEvent> | unknown) => void
}

const Label = forwardRef<HandlerRef<View, LabelProps>, LabelProps>(
  (labelProps, ref): JSX.Element => {
    const { textProps, innerProps: props = {} } = splitProps(labelProps)

    const {
      style = {},
      'enable-var': enableVar,
      'external-var-context': externalVarContext,
      'parent-font-size': parentFontSize,
      'parent-width': parentWidth,
      'parent-height': parentHeight,
      bindtap
    } = props

    const defaultStyle = {
      flexDirection: 'row'
    }

    const styleObj = extendObject(defaultStyle, style)

    const {
      hasSelfPercent,
      normalStyle,
      hasVarDec,
      varContextRef,
      setWidth,
      setHeight
    } = useTransformStyle(styleObj, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight })

    const nodeRef = useRef(null)
    useNodesRef(props, ref, nodeRef, { defaultStyle })

    const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef })

    const { textStyle, backgroundStyle, innerStyle = {} } = splitStyle(normalStyle)

    if (backgroundStyle) {
      warn('Label does not support background image-related styles!')
    }

    const contextRef: LabelContextValue = useRef({
      triggerChange: noop
    })

    const onTap = (evt: NativeSyntheticEvent<TouchEvent>) => {
      bindtap && bindtap(getCustomEvent('tap', evt, { layoutRef }, props))
      contextRef.current.triggerChange?.(evt)
    }

    const innerProps = useInnerProps(
      props,
      extendObject(
        {
          ref: nodeRef,
          style: extendObject(innerStyle, layoutStyle)
        },
        layoutProps,
        {
          bindtap: onTap
        }
      ),
      [],
      {
        layoutRef
      }
    )

    return <View {...innerProps}>
      <LabelContext.Provider value={contextRef}>
        {
          wrapChildren(
            props,
            {
              hasVarDec,
              varContext: varContextRef.current,
              textStyle,
              textProps
            }
          )
        }
      </LabelContext.Provider>
    </View>
  }
)

Label.displayName = 'mpx-label'

export default Label
