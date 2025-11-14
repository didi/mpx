
/**
 * ✔ selectable
 * ✘ space
 * ✔ decode
 */
import { Text, TextStyle, TextProps } from 'react-native'
import { useRef, forwardRef, ReactNode, JSX, createElement, Children } from 'react'
import Portal from './mpx-portal'
import useInnerProps from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数
import { useTransformStyle, wrapChildren, extendObject } from './utils'

const decodeMap = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&amp;': '&',
  '&#39;': '\'',
  '&nbsp;': ' '
}

const encodedRe = /&(?:lt|gt|quot|amp|#39|nbsp);/g
function decode (value: string) {
  if (value != null) {
    return value.replace(encodedRe, function (match) {
      return decodeMap[match as keyof typeof decodeMap]
    })
  }
}

function getDecodedChildren (children: ReactNode) {
  return Children.map(children, (child) => {
    if (typeof child === 'string') {
      return decode(child)
    }
    return child
  })
}
interface _TextProps extends TextProps {
  style?: TextStyle
  children?: ReactNode
  selectable?: boolean
  decode?: boolean
  'user-select'?: boolean
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>
  'parent-font-size'?: number
  'parent-width'?: number
  'parent-height'?: number
  'enable-android-align-center'?: boolean
  'enable-add-space'?: boolean
  'space-font-size'?: number
}

const _Text = forwardRef<HandlerRef<Text, _TextProps>, _TextProps>((props, ref): JSX.Element => {
  const {
    style = {},
    allowFontScaling = false,
    selectable,
    decode,
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'enable-android-align-center': enableAndroidAlignCenter,
    'user-select': userSelect,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight,
    'enable-add-space': enableAddSpace,
    'space-font-size': spaceFontSize
  } = props

  const extendStyle = enableAndroidAlignCenter ? { includeFontPadding: false, textAlignVertical: 'center' } : null

  const {
    normalStyle,
    hasVarDec,
    varContextRef,
    hasPositionFixed
  } = useTransformStyle(extendStyle ? extendObject({}, style, extendStyle) : style, {
    enableVar,
    externalVarContext,
    parentFontSize,
    parentWidth,
    parentHeight
  })

  const nodeRef = useRef(null)
  useNodesRef<Text, _TextProps>(props, ref, nodeRef, {
    style: normalStyle
  })

  const innerProps = useInnerProps(
    extendObject(
      {},
      props,
      {
        ref: nodeRef,
        style: normalStyle,
        selectable: !!selectable || !!userSelect,
        allowFontScaling
      }
    ),
    [
      'user-select',
      'decode',
      'enable-android-align-center',
      'enable-add-space',
      'space-font-size'
    ]
  )

  let children = decode ? getDecodedChildren(props.children) : props.children

  // 如果启用了 enable-add-space，在末尾追加一个空格节点，规避小米手机文字被截断问题
  if (enableAddSpace) {
    const spaceNode = createElement(Text, {
      style: spaceFontSize ? { fontSize: spaceFontSize } : undefined
    }, ' ')
    children = Array.isArray(children) ? children.concat(spaceNode) : [children, spaceNode]
  }

  let finalComponent:JSX.Element = createElement(Text, innerProps, wrapChildren(
    extendObject({}, props, {
      children
    }),
    {
      hasVarDec,
      varContext: varContextRef.current
    }
  ))

  if (hasPositionFixed) {
    finalComponent = createElement(Portal, null, finalComponent)
  }

  return finalComponent
})

_Text.displayName = 'MpxText'

export default _Text
