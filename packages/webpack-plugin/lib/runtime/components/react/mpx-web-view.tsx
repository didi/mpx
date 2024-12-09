import { forwardRef, JSX, useEffect, useRef, useContext, useMemo } from 'react'
import { warn, getFocusedNavigation } from '@mpxjs/utils'
import { Portal } from '@ant-design/react-native'
import { getCustomEvent } from './getInnerListeners'
import { promisify, redirectTo, navigateTo, navigateBack, reLaunch, switchTab } from '@mpxjs/api-proxy'
import { WebView } from 'react-native-webview'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { getCurrentPage, extendObject } from './utils'
import { WebViewNavigationEvent, WebViewErrorEvent, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview/lib/WebViewTypes'
import { RouteContext } from './context'

type OnMessageCallbackEvent = {
  detail: {
    data: any[]
  }
}

type CommonCallbackEvent = {
  detail: {
    src?: string
  }
}

interface WebViewProps {
  src?: string
  bindmessage?: (event: OnMessageCallbackEvent) => void
  bindload?: (event: CommonCallbackEvent) => void
  binderror?: (event: CommonCallbackEvent) => void
  [x: string]: any
}

interface PayloadData {
  data?: Record<string, any>
}

type MessageData = {
  payload?: PayloadData,
  type?: string,
  callbackId?: number
}

const _WebView = forwardRef<HandlerRef<WebView, WebViewProps>, WebViewProps>((props, ref): JSX.Element|null => {
  const { src, bindmessage, bindload, binderror } = props
  if (!src) {
    return (null)
  }
  if (props.style) {
    warn('The web-view component does not support the style prop.')
  }
  const pageId = useContext(RouteContext)
  const currentPage = useMemo(() => getCurrentPage(pageId), [pageId])

  const defaultWebViewStyle = {
    position: 'absolute' as 'absolute' | 'relative' | 'static',
    left: 0 as number,
    right: 0 as number,
    top: 0 as number,
    bottom: 0 as number
  }

  const webViewRef = useRef<WebView>(null)
  useNodesRef<WebView, WebViewProps>(props, ref, webViewRef, {
    style: defaultWebViewStyle
  })

  const _load = function (res: WebViewNavigationEvent) {
    const result = {
      type: 'load',
      timeStamp: res.timeStamp,
      detail: {
        src: res.nativeEvent?.url
      }
    }
    bindload(result)
  }
  const _error = function (res: WebViewErrorEvent) {
    const result = {
      type: 'error',
      timeStamp: res.timeStamp,
      detail: {
        src: ''
      }
    }
    binderror(result)
  }

  const webViewTitle = useRef<string>('')
  const webViewUrl = useRef<string>('')
  const _changeUrl = function (navState: WebViewNavigation) {
    if (navState.navigationType) { // navigationType这个事件在页面开始加载时和页面加载完成时都会被触发所以判断这个避免其他无效触发执行该逻辑
      if (webViewTitle.current !== navState.title) {
        const navigation = getFocusedNavigation()
        navigation && navigation.setOptions({ headerTitle: navState.title })
      }
      if (currentPage && webViewUrl.current !== navState.url) {
        webViewUrl.current = navState.url
        currentPage.__webViewUrl = navState.url
      }
    }
  }
  const _message = function (res: WebViewMessageEvent) {
    let data: MessageData = {}
    let asyncCallback
    const navObj = promisify({ redirectTo, navigateTo, navigateBack, reLaunch, switchTab })
    try {
      const nativeEventData = res.nativeEvent?.data
      if (typeof nativeEventData === 'string') {
        data = JSON.parse(nativeEventData)
      }
    } catch (e) {
      data = {}
    }
    const postData: PayloadData = data.payload || {}
    switch (data.type) {
      case 'postMessage':
        bindmessage(getCustomEvent('messsage', {}, { // RN组件销毁顺序与小程序不一致，所以改成和支付宝消息一致
          detail: {
            data: postData.data
          },
          layoutRef: webViewRef
        }))
        asyncCallback = Promise.resolve({
          errMsg: 'invokeWebappApi:ok'
        })
        break
      case 'navigateTo':
        asyncCallback = navObj.navigateTo(postData)
        break
      case 'navigateBack':
        asyncCallback = navObj.navigateBack(postData)
        break
      case 'redirectTo':
        asyncCallback = navObj.redirectTo(postData)
        break
      case 'switchTab':
        asyncCallback = navObj.switchTab(postData)
        break
      case 'reLaunch':
        asyncCallback = navObj.reLaunch(postData)
        break
    }

    asyncCallback && asyncCallback.then((res: any) => {
      if (webViewRef.current?.postMessage) {
        const test = JSON.stringify({
          type: data.type,
          callbackId: data.callbackId,
          result: res
        })
        webViewRef.current.postMessage(test)
      }
    })
  }
  const events = {}

  if (bindload) {
    extendObject(events, {
      onLoad: _load
    })
  }
  if (binderror) {
    extendObject(events, {
      onError: _error
    })
  }
  if (bindmessage) {
    extendObject(events, {
      onMessage: _message
    })
  }
  return (<Portal>
    <WebView
      style={defaultWebViewStyle}
      source={{ uri: src }}
      ref={webViewRef}
      {...events}
      onNavigationStateChange={_changeUrl}
      javaScriptEnabled={true}
    ></WebView>
  </Portal>)
})

_WebView.displayName = 'MpxWebview'

export default _WebView
