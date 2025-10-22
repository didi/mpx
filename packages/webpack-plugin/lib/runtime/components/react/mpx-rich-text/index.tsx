
/**
 * ✔ nodes
 */
import { View, ViewProps, ViewStyle } from 'react-native'
import { useRef, forwardRef, JSX, useState, createElement } from 'react'
import useInnerProps from '../getInnerListeners'
import useNodesRef, { HandlerRef } from '../useNodesRef' // 引入辅助函数
import { useTransformStyle, useLayout, extendObject } from '../utils'
import { WebView, WebViewMessageEvent } from 'react-native-webview'
import { generateHTML } from './html'
import Portal from '../mpx-portal'

type Node = {
  type: 'node' | 'text'
  name?: string
  attrs?: any
  children?: Array<Node>
  text: string
}

interface _RichTextProps extends ViewProps {
  style?: ViewStyle
  nodes: string | Array<Node>
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>
  'parent-font-size'?: number
  'parent-width'?: number
  'parent-height'?: number
}

function jsonToHtmlStr (elements: Array<Node>) {
  let htmlStr = ''

  for (const element of elements) {
    if (element.type === 'text') {
      htmlStr += element.text
      return htmlStr
    }

    const { name, attrs = {}, children = [] } = element

    let attrStr = ''
    for (const [key, value] of Object.entries(attrs)) attrStr += ` ${key}="${value}"`

    let childrenStr = ''
    for (const child of children) childrenStr += jsonToHtmlStr([child])

    htmlStr += `<${name}${attrStr}>${childrenStr}</${name}>`
  }

  return htmlStr
}

const _RichText = forwardRef<HandlerRef<View, _RichTextProps>, _RichTextProps>((props, ref): JSX.Element => {
  const {
    style = {},
    nodes,
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight
  } = props

  const nodeRef = useRef(null)
  const [webViewHeight, setWebViewHeight] = useState(0)

  const {
    normalStyle,
    hasSelfPercent,
    setWidth,
    setHeight,
    hasPositionFixed
  } = useTransformStyle(Object.assign({
    width: '100%',
    height: webViewHeight
  }, style), {
    enableVar,
    externalVarContext,
    parentFontSize,
    parentWidth,
    parentHeight
  })

  const {
    layoutRef,
    layoutStyle,
    layoutProps
  } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef })

  useNodesRef<View, _RichTextProps>(props, ref, nodeRef, {
    layoutRef
  })

  const innerProps = useInnerProps(
    extendObject(
      {},
      props,
      layoutProps,
      {
        ref: nodeRef,
        style: extendObject(normalStyle, layoutStyle)
      }
    ),
    [],
    {
      layoutRef
    }
  )

  const html: string = typeof nodes === 'string' ? nodes : jsonToHtmlStr(nodes)

  let finalComponent: JSX.Element = createElement(View, innerProps,
    createElement(WebView, {
      source: { html: generateHTML(html) },
      onMessage: (event: WebViewMessageEvent) => {
        setWebViewHeight(+event.nativeEvent.data)
      },
      style: {
        backgroundColor: 'transparent'
      }
    })
  )

  if (hasPositionFixed) {
    finalComponent = createElement(Portal, null, finalComponent)
  }

  return finalComponent
})

_RichText.displayName = 'mpx-rich-text'

export default _RichText
