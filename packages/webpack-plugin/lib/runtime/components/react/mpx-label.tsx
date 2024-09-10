/**
 * ✘ for
 */
import { JSX, useRef, forwardRef, ReactNode } from 'react'
import {
  View,
  Text,
  StyleProp,
  ViewStyle,
  NativeSyntheticEvent,
  TextStyle,
} from 'react-native'
import { isEmptyObject } from '@mpxjs/utils'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { every, splitStyle, splitProps, isText, isNativeText } from './utils'
import { LabelContext, LabelContextValue } from './context'

export interface LabelProps {
  for?: string
  style?: ViewStyle & Record<string, any>
  'enable-offset'?: boolean
  children: ReactNode
  bindtap?: (evt: NativeSyntheticEvent<TouchEvent> | unknown) => void
}

const Label = forwardRef<HandlerRef<View, LabelProps>, LabelProps>(
  (props, ref): JSX.Element => {
    const {
      style = {},
      'enable-offset': enableOffset,
      children,
      bindtap
    } = props

    const { textStyle, innerStyle } = splitStyle(style)

    const defaultStyle = {
      flexDirection: 'row',
      ...innerStyle
    }

    const contextRef: LabelContextValue = useRef({
      textStyle,
      triggerChange: () => { }
    })

    const layoutRef = useRef({})

    const { nodeRef } = useNodesRef(props, ref, {
      defaultStyle
    })

    const onLayout = () => {
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

    const wrapChildren = (
      children: ReactNode,
      textStyle?: StyleProp<TextStyle>
    ) => {
      const hasTextStyle = !isEmptyObject(textStyle || {})
      const { textProps } = splitProps(props)

      if (every(children, (child) => isText(child))) {
        if (hasTextStyle || textProps) {
          return <Text key='labelTextWrap' style={textStyle} {...(textProps || {})}>{children}</Text>
        }
      }

      const childrenArray = Array.isArray(children) ? children : [children]
      return childrenArray.map((child, index) => {
        if (hasTextStyle && isNativeText(child)) {
          return <Text key={index} style={textStyle}>{child}</Text>
        }
        return child
      })
    }

    const innerProps = useInnerProps(
      props,
      {
        ref: nodeRef,
        style: defaultStyle,
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
        {wrapChildren(children, textStyle)}
      </LabelContext.Provider>
    </View>
  }
)

Label.displayName = 'mpx-label'

export default Label
