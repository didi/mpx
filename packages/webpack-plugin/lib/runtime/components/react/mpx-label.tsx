/**
 * ✘ for
 */
import { JSX, useRef, forwardRef, ReactNode } from 'react'
import {
  View,
  ViewStyle,
  NativeSyntheticEvent,
  LayoutChangeEvent
} from 'react-native'
import { noop } from '@mpxjs/utils'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { splitProps, splitStyle, throwReactWarning, useTransformStyle } from './utils'
import { LabelContext, LabelContextValue } from './context'
import { wrapChildren } from './common'

export interface LabelProps {
  for?: string
  style?: ViewStyle & Record<string, any>
  'enable-offset'?: boolean
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>
  children: ReactNode
  bindtap?: (evt: NativeSyntheticEvent<TouchEvent> | unknown) => void
}

const Label = forwardRef<HandlerRef<View, LabelProps>, LabelProps>(
  (labelProps, ref): JSX.Element => {
    const {
      style = {},
      'enable-offset': enableOffset,
      'enable-var': enableVar,
      'external-var-context': externalVarContext,
      bindtap
    } = labelProps

    const { textProps, innerProps: props } = splitProps(labelProps)

    const defaultStyle = {
      flexDirection: 'row'
    }

    const styleObj = {
      ...defaultStyle,
      ...style
    }

    const {
      normalStyle,
      hasPercent,
      hasVarDec,
      varContextRef,
      setContainerWidth,
      setContainerHeight
    } = useTransformStyle(styleObj, { enableVar, externalVarContext })

    const { textStyle, backgroundStyle, innerStyle } = splitStyle(normalStyle)

    if (backgroundStyle) {
      throwReactWarning('[Mpx runtime warn]: Label does not support background image-related styles!')
    }

    const contextRef: LabelContextValue = useRef({
      triggerChange: noop
    })

    const layoutRef = useRef({})

    const { nodeRef } = useNodesRef(props, ref, {
      defaultStyle
    })

    const onLayout = (res: LayoutChangeEvent) => {
      if (hasPercent) {
        const { width, height } = res?.nativeEvent?.layout || {}
        setContainerWidth(width || 0)
        setContainerHeight(height || 0)
      }
      nodeRef.current?.measure(
        (
          x: number,
          y: number,
          width: number,
          height: number,
          offsetLeft: number,
          offsetTop: number
        ) => {
          layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
        }
      )
    }

    const onTap = (evt: NativeSyntheticEvent<TouchEvent>) => {
      bindtap && bindtap(getCustomEvent('tap', evt, { layoutRef }, props))
      contextRef.current.triggerChange?.(evt)
    }

    const innerProps = useInnerProps(
      props,
      {
        ref: nodeRef,
        style: innerStyle,
        bindtap: onTap,
        ...(enableOffset ? { onLayout } : {})
      },
      ['enable-offset'],
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
              varContext: varContextRef.current
            },
            {
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
