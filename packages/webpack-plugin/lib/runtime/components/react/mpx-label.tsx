/**
 * ✘ for
 */
import { JSX, useRef, forwardRef, ReactNode, Children, cloneElement, ReactElement } from 'react'
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
import useNodesRef, { HandlerRef } from './useNodesRef'
import { every, extractTextStyle, isEmbedded, isText } from './utils'
import { recordPerformance } from './performance'

export interface LabelProps {
  for?: string
  style?: StyleProp<ViewStyle>
  'enable-offset'?: boolean
  children: ReactNode
  bindtap?: (evt: NativeSyntheticEvent<TouchEvent> | unknown) => void
}

const Label = forwardRef<HandlerRef<View, LabelProps>, LabelProps>(
  (props, ref): JSX.Element => {
    const startTime = new Date().getTime()
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

    const onTap = (evt: NativeSyntheticEvent<TouchEvent>) => {
      bindtap && bindtap(getCustomEvent('tap', evt, { layoutRef }, props))
      childRef.current?.change(evt)
    }

    const wrapChildren = (
      children: ReactNode,
      textStyle?: StyleProp<TextStyle>
    ) => {
      if (every(children, (child) => isText(child))) {
        children = [
          <Text key='labelTextWrap' style={textStyle}>
            {children}
          </Text>
        ]
        return children
      }
      return Children.toArray(children).map((child) => {
        return cloneElement(child as ReactElement, {
          style: [...((child as ReactElement).props.style ?? []), textStyle],
          ...(isEmbedded(child)
            ? {
                ref: (ref: any) => {
                  childRef.current = ref?.getNodeInstance()?.instance
                }
              }
            : {})
        })
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

    const content = <View {...innerProps}>{wrapChildren(children, textStyle)}</View>

    recordPerformance(startTime, 'mpx-label')
  
    return content
  }
)

Label.displayName = 'mpx-label'

export default Label
