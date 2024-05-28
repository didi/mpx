
/**
 * ✔ selectable
 * ✘ space
 * ✘ decode
 */
import { Text, TextStyle, TextProps, StyleSheet } from 'react-native'
import * as React from 'react'
import useInnerProps from './getInnerListeners';
import useNodesRef from '../../useNodesRef' // 引入辅助函数

interface _TextProps extends TextProps {
  style?: TextStyle
  children?: React.ReactNode
  selectable?: boolean
  ['enable-offset']?: boolean
  ['user-select']?: boolean
  userSelect?: boolean
  useInherit?: boolean
}

const DEFAULT_STYLE = {
  fontSize: 16
}

const _Text: React.FC<_TextProps & React.RefAttributes<any>> = React.forwardRef((props: _TextProps, ref: React.ForwardedRef<any>):React.JSX.Element => {
  const {
    style = [],
    children,
    selectable,
    'enable-offset': enableOffset,
    'user-select': userSelect,
    useInherit = false,
    } = props

    const measureTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    const layoutRef = React.useRef({})

    const styleObj = StyleSheet.flatten(style)

    const { nodeRef } = useNodesRef(props, ref, {
      defaultStyle: DEFAULT_STYLE
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
    React.useEffect(() => {
      if (enableOffset) {
        setTimeout(() => {
          nodeRef.current = nodeRef.current.measure((x, y, width, height, offsetLeft, offsetTop) => {
            layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
          })
        })
        return () => {
          measureTimeout.current && clearTimeout(measureTimeout.current);
          measureTimeout.current = null
        }
      }
    })


    return (
      <Text
        style={{...useInherit && DEFAULT_STYLE, ...styleObj}}
        selectable={!!selectable || !!userSelect}
        {...innerProps}
      >
        {children}
      </Text>
    )
})

_Text.displayName = 'mpx-text'

export default _Text
