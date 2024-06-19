/**
 * ✘ for
 */
import React, {
  JSX,
  useRef,
  forwardRef,
  ReactNode,
  Children,
  cloneElement,
  ReactElement
} from 'react'
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  NativeSyntheticEvent,
  TextStyle
} from 'react-native'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from '../../useNodesRef'
import { every, extractTextStyle, isEmbedded, isText } from './utils'

export interface LabelProps {
  for?: string
  style?: StyleProp<ViewStyle>
  'enable-offset'?: boolean
  children: ReactNode
  bindtap?: (evt: NativeSyntheticEvent<TouchEvent> | unknown) => void
}

const Label = forwardRef<HandlerRef<View, LabelProps>, LabelProps>(
  (props, ref): JSX.Element => {
    const {
      style = [],
      'enable-offset': enableOffset,
      children,
      bindtap
    } = props

    const textStyle = extractTextStyle(style)

    const defaultStyle = {
      flexDirection: 'row',
      ...StyleSheet.flatten(style)
    }

    const childRef = useRef<{
      change: (evt?: NativeSyntheticEvent<TouchEvent>) => void
    }>()

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

    const onChange = (evt: NativeSyntheticEvent<TouchEvent>) => {
      childRef.current?.change(evt)
    }

    const onTap = (evt: NativeSyntheticEvent<TouchEvent>) => {
      bindtap && bindtap(getCustomEvent('tap', evt, { layoutRef }, props))
      onChange(evt)
    }

    function wrapChildren(
      children: ReactNode,
      textStyle?: StyleProp<TextStyle>
    ) {
      if (every(children, (child) => isText(child))) {
        children = [
          <Text key='labelTextWrap' style={textStyle}>
            {children}
          </Text>
        ]
        return children
      }
      return Children.toArray(children).map((child) => {
        if (child && isText(child)) {
          return cloneElement(child as ReactElement, {
            style: [...((child as ReactElement).props.style ?? []), textStyle]
          })
        }
        if (!childRef.current && isEmbedded(child)) {
          return cloneElement(child as ReactElement, {
            ref: (ref) => {
              childRef.current = ref?.getNodeInstance()?.instance
            }
          })
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

    return <View {...innerProps}>{wrapChildren(children, textStyle)}</View>
  }
)

Label.displayName = 'mpx-label'

export default Label
