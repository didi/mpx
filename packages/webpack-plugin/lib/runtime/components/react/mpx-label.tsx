/**
 * ✘ for
 */
import { JSX, useRef, forwardRef, ReactNode } from 'react'
import {
  View,
  Text,
  ViewStyle,
  NativeSyntheticEvent,
  TextStyle
} from 'react-native'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { every, splitStyle, splitProps, isText, throwReactWarning } from './utils'
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

    const { textStyle, imageStyle, innerStyle } = splitStyle(style)

    if (imageStyle) {
      throwReactWarning('[Mpx runtime warn]: Label does not support background image-related styles!')
    }

    const defaultStyle = {
      flexDirection: 'row'
    }

    const contextRef: LabelContextValue = useRef({
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
      textStyle?: TextStyle
    ) => {
      const { textProps } = splitProps(props)

      if (every(children, (child) => isText(child))) {
        if (textStyle || textProps) {
          children = <Text key='labelTextWrap' style={textStyle || {}} {...(textProps || {})}>{children}</Text>
        }
      } else {
        if (textStyle) throwReactWarning('[Mpx runtime warn]: Text style will be ignored unless every child of the Label is Text node!')
      }

      return children
    }

    const innerProps = useInnerProps(
      props,
      {
        ref: nodeRef,
        style: { ...defaultStyle, ...innerStyle },
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
