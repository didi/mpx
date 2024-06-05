
/**
 * ✔ selectable
 * ✘ space
 * ✘ decode
 */
import { Text, TextStyle, TextProps, StyleSheet } from 'react-native'
import { useRef, useEffect, forwardRef, ReactNode, ForwardedRef, JSX } from 'react';
import useInnerProps from './getInnerListeners'
// @ts-ignore
import useNodesRef from '../../useNodesRef' // 引入辅助函数
import { PERCENT_REGX } from './utils'

type ExtendedTextStyle = Omit<TextStyle, 'lineHeight'>  & {
  lineHeight?: string | number
};
interface _TextProps extends Omit<TextProps, 'style'> {
  style?: ExtendedTextStyle
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


const transformStyle = (styleObj: ExtendedTextStyle) => {
  let { lineHeight } = styleObj
  if (typeof lineHeight === 'string' && PERCENT_REGX.test(lineHeight)) {
    lineHeight = (parseFloat(lineHeight)/100) * (styleObj.fontSize || DEFAULT_STYLE.fontSize)
    styleObj.lineHeight = lineHeight
  }
}

const _Text = forwardRef((props: _TextProps, ref: ForwardedRef<Text>): JSX.Element => {
  const {
    style = [],
    children,
    selectable,
    'enable-offset': enableOffset,
    'user-select': userSelect,
    'disable-default-style': disableDefaultStyle = false,
    } = props

    const layoutRef = useRef({})

    const styleObj = StyleSheet.flatten<ExtendedTextStyle>(style)

    let defaultStyle = {}

    if (!disableDefaultStyle) {
      defaultStyle = DEFAULT_STYLE
      transformStyle(styleObj)
    }

    const { nodeRef } = useNodesRef(props, ref, {
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
          nodeRef.current?.measure((x, y, width, height, offsetLeft, offsetTop) => {
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


    return (
      <Text
        style={{...defaultStyle, ...styleObj}}
        selectable={!!selectable || !!userSelect}
        {...innerProps}
      >
        {children}
      </Text>
    )
})

_Text.displayName = 'mpx-text'

export default _Text
