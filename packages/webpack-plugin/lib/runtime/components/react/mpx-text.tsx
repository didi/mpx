
/**
 * ✔ selectable
 * ✘ space
 * ✘ decode
 */
import { Text, TextStyle, TextProps } from 'react-native'
import { useRef, useEffect, forwardRef, ReactNode, JSX } from 'react'
import useInnerProps from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数
import { transformTextStyle, DEFAULT_STYLE } from './utils'

interface _TextProps extends TextProps {
  style?: TextStyle
  children?: ReactNode
  selectable?: boolean
  'enable-offset'?: boolean
  'user-select'?: boolean
  userSelect?: boolean
  ['disable-default-style']?: boolean
}

const _Text = forwardRef<HandlerRef<Text, _TextProps>, _TextProps>((props, ref): JSX.Element => {
  const {
    style = {},
    children,
    selectable,
    'enable-offset': enableOffset,
    'user-select': userSelect,
    'disable-default-style': disableDefaultStyle = false,
  } = props

  const layoutRef = useRef({})

  let defaultStyle = {}

  if (!disableDefaultStyle) {
    defaultStyle = DEFAULT_STYLE
    transformTextStyle(style)
  }

  const { nodeRef } = useNodesRef<Text, _TextProps>(props, ref, {
    defaultStyle
  })

  const innerProps = useInnerProps(props, {
    ref: nodeRef
  }, [
    'style',
    'children',
    'selectable',
    'user-select',
    'useInherit',
    'enable-offset'
  ], {
    layoutRef
  })

  useEffect(() => {
    let measureTimeout: ReturnType<typeof setTimeout> | null = null
    if (enableOffset) {
      measureTimeout = setTimeout(() => {
        nodeRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
          layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
        })
      })
      return () => {
        if (measureTimeout) {
          clearTimeout(measureTimeout)
        }
      }
    }
  }, [])


  return (
    <Text
      style={{ ...defaultStyle, ...style }}
      selectable={!!selectable || !!userSelect}
      {...innerProps}
    >
      {children}
    </Text>
  )
})

_Text.displayName = '_mpxText'

export default _Text
