
/**
 * ✔ selectable
 * ✘ space
 * ✘ decode
 */
import { Text, TextStyle, TextProps, StyleSheet } from 'react-native'
import { useRef, useEffect, forwardRef, ReactNode, JSX } from 'react';
import useInnerProps from './getInnerListeners'
// @ts-ignore
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数
import { PERCENT_REGEX } from './utils'
import { recordPerformance } from './performance'


interface _TextProps extends TextProps {
  style?: TextStyle
  children?: ReactNode
  selectable?: boolean
  'enable-offset'?: boolean
  'user-select'?: boolean
  userSelect?: boolean
  ['disable-default-style']?: boolean
}

const DEFAULT_STYLE = {
  fontSize: 16
}

const transformStyle = (styleObj: TextStyle) => {
  let { lineHeight } = styleObj
  if (typeof lineHeight === 'string' && PERCENT_REGEX.test(lineHeight)) {
    lineHeight = (parseFloat(lineHeight)/100) * (styleObj.fontSize || DEFAULT_STYLE.fontSize)
    styleObj.lineHeight = lineHeight
  }
}

const _Text = forwardRef<HandlerRef<Text, _TextProps>, _TextProps>((props, ref): JSX.Element => {
  const startTime = new Date().getTime()
  const {
    style = [],
    children,
    selectable,
    'enable-offset': enableOffset,
    'user-select': userSelect,
    'disable-default-style': disableDefaultStyle = false,
    } = props

    const layoutRef = useRef({})

    const styleObj: TextStyle = StyleSheet.flatten<TextStyle>(style)

    let defaultStyle = {}

    if (!disableDefaultStyle) {
      defaultStyle = DEFAULT_STYLE
      transformStyle(styleObj)
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
            measureTimeout = null
          }
        }
      }
    }, [])

    const content = (
      <Text
        style={{...defaultStyle, ...styleObj}}
        selectable={!!selectable || !!userSelect}
        {...innerProps}
      >
        {children}
      </Text>
    )

    recordPerformance(startTime, 'mpx-text')

    return content
})

_Text.displayName = 'mpx-text'

export default _Text
