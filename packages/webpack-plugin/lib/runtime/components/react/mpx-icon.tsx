/**
 * ✔ type
 * ✔ size
 * ✔ color
 */
import React, { JSX, useRef, forwardRef } from 'react'
import { Text, StyleProp, TextStyle, StyleSheet, View } from 'react-native'
import useInnerProps from './getInnerListeners'
import useNodesRef, { HandlerRef } from '../../useNodesRef'
import { extractTextStyle } from './utils'

export type IconType =
  | 'success'
  | 'success_no_circle'
  | 'info'
  | 'warn'
  | 'waiting'
  | 'cancel'
  | 'download'
  | 'search'
  | 'clear'

// [unicode, color]
type UnicodeColorPairs = [string, string]

export interface IconProps {
  type: IconType
  size?: number
  color?: string
  style?: StyleProp<TextStyle>
  'enable-offset'?: boolean
}

const IconTypeMap = new Map<IconType, UnicodeColorPairs>([
  ['success', ['EA06', '#07c160']],
  ['success_no_circle', ['EA08', '#07c160']],
  ['info', ['EA03', '#10AEFF']],
  ['warn', ['EA0B', '#F76260']],
  ['waiting', ['EA09', '#10AEFF']],
  ['cancel', ['EA0D', '#F43530']],
  ['download', ['EA02', '#13bf69']],
  ['search', ['EA0E', '#7d7979']],
  ['clear', ['EA0F', '#B2B2B2']]
])

const Icon = forwardRef<HandlerRef<Text, IconProps>, IconProps>(
  (props, ref): JSX.Element => {
    const {
      type,
      size = 23,
      color,
      style = [],
      'enable-offset': enableOffset
    } = props

    const [unicode, iconColor] = IconTypeMap.get(type) || []

    const defaultViewStyle = { width: size, height: size }

    const defaultTextStyle: TextStyle[] = [
      {
        fontFamily: 'weiui',
        fontSize: size,
        lineHeight: size,
        color: color || iconColor,
        textAlign: 'center',
      },
      extractTextStyle(style)
    ]

    const layoutRef = useRef({})

    const { nodeRef } = useNodesRef(props, ref, {
      defaultStyle: StyleSheet.flatten([
        defaultViewStyle,
        ...defaultTextStyle
      ])
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

    const innerProps = useInnerProps(
      props,
      {
        ref: nodeRef,
        style: [style, { width: size, height: size }],
        ...(enableOffset ? { onLayout } : {})
      },
      [
        'enable-offset'
      ],
      {
        layoutRef
      }
    )

    return (
      <View {...innerProps}>
        <Text 
          style={defaultTextStyle}
        >
          {unicode}
        </Text>
      </View>
    )
  }
)

Icon.displayName = 'mpx-icon'

export default Icon
