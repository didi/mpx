
/**
 * ✔ nodes
 */
import { View, ViewProps, ViewStyle } from 'react-native'
import { useRef, forwardRef, JSX, useState } from 'react'
import useInnerProps from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数
import { useTransformStyle, useLayout } from './utils'
import { WebView, WebViewMessageEvent } from 'react-native-webview'

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

  const webview = useRef<WebView>(null)
  const nodeRef = useRef(null)
  const [webViewHeight, setWebViewHeight] = useState(0)

  const {
    normalStyle,
    hasSelfPercent,
    setWidth,
    setHeight
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

  const innerProps = useInnerProps(props, {
    ref: nodeRef,
    style: { ...normalStyle, ...layoutStyle },
    ...layoutProps
  }, [], {
    layoutRef
  })

  const html: string = typeof nodes === 'string' ? nodes : jsonToHtmlStr(nodes)

  return (
    <View
      {...innerProps}
      style={normalStyle}
    >
      <WebView
        ref={webview}
        source={{ html: '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>' + html }}
        onMessage={(event: WebViewMessageEvent) =>
          setWebViewHeight(+event.nativeEvent.data)
        }
        // https://github.com/react-native-webview/react-native-webview/issues/341
        injectedJavaScript={`
          document.documentElement.style.padding = 0;
          document.documentElement.style.margin = 0;
          document.body.style.padding = 0;
          document.body.style.margin = 0;
          window.ReactNativeWebView.postMessage(document.body.scrollHeight);
          true;
        `}
        onLoadEnd={() => webview.current?.injectJavaScript('window.ReactNativeWebView.postMessage(document.body.scrollHeight);') // android
      }
      >
      </WebView>
    </View>
  )
})

_RichText.displayName = 'mpx-rich-text'

export default _RichText
