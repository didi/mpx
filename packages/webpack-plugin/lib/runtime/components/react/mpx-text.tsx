
/**
 * ✔ selectable
 * ✘ space
 * ✘ decode
 */
import { Text, TextStyle, TextProps, StyleSheet } from 'react-native'
import * as React from 'react'
import { useImperativeHandle } from 'react'
// @ts-ignore
import useInnerProps from './getInnerListeners';
// @ts-ignore
import useNodesRef from '../../useNodesRef' // 引入辅助函数

interface _TextProps extends TextProps {
  style?: TextStyle
  children: React.ReactNode
  selectable?: boolean
  ['user-select']?: boolean
  userSelect?: boolean
  ['disable-default-style']?: boolean
}

const _Text: React.FC<_TextProps & React.RefAttributes<any>> = React.forwardRef((props: _TextProps, ref: React.ForwardedRef<any>):React.JSX.Element => {
  const {
    style = [],
    children,
    selectable,
    'user-select': userSelect,
    'disable-default-style': disableDefaultStyle = false
    } = props

    const measureTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    // 打平 style 数组
    const styleObj = StyleSheet.flatten(style)
    // text的 默认样式
    const defaultStyle = {
      ...!disableDefaultStyle && {
        fontSize: 16
      }
    }

    const innerProps = useInnerProps(props, {}, [
      'style',
      'children',
      'selectable',
      'user-select',
      'useInherit'
    ], {
      touchable: true
    })

    const { nodeRef } = useNodesRef(props, ref, {
      defaultStyle
    })
    
    React.useEffect(() => {
      setTimeout(() => {
        nodeRef.current = nodeRef.current.measure((x, y, width, height, offsetLeft, offsetTop) => {
          nodeRef.current = { x, y, width, height, offsetLeft, offsetTop }
        })
      })
      return () => {
        measureTimeout.current && clearTimeout(measureTimeout.current);
        measureTimeout.current = null
      }
    }, [nodeRef])
    return (
      <Text
        style={{...defaultStyle, ...styleObj}}
        ref={nodeRef}
        selectable={!!selectable || !!userSelect}
        {...innerProps}
      >
        {children}
      </Text>
    )
})

_Text.displayName = 'mpx-text'

export default _Text
