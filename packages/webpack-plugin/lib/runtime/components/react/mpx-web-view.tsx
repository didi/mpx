import { forwardRef, JSX, useEffect, useRef } from 'react'
import { noop, warn } from '@mpxjs/utils'
import { View } from 'react-native'
import { Portal } from '@ant-design/react-native'
import { getCustomEvent } from './getInnerListeners'
import { promisify, redirectTo, navigateTo, navigateBack, reLaunch, switchTab } from '@mpxjs/api-proxy'
import { WebView } from 'react-native-webview'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { WebViewNavigationEvent, WebViewErrorEvent, WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes'

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

const _WebView = forwardRef<HandlerRef<WebView, WebViewProps>, WebViewProps>((props, ref): JSX.Element => {
  const { src, bindmessage = noop, bindload = noop, binderror = noop } = props
  if (!src) {
    return (<View></View>)
  }
  if (props.style) {
    warn('The web-view component does not support the style prop.')
  }
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

  const _messageList: any[] = []
  const handleUnload = () => {
    // 这里是 WebView 销毁前执行的逻辑
    bindmessage(getCustomEvent('messsage', {}, {
      detail: {
        data: _messageList
      },
      layoutRef: webViewRef
    }))
  }

  useEffect(() => {
    // 组件卸载时执行
    return () => {
      handleUnload()
    }
  }, [])
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
        _messageList.push(postData.data)
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
    Object.assign(events, {
      onLoad: _load
    })
  }
  if (binderror) {
    Object.assign(events, {
      onError: _error
    })
  }
  if (bindmessage) {
    Object.assign(events, {
      onMessage: _message
    })
  }
  return (<Portal>
    <WebView
      style={defaultWebViewStyle}
      source={{ uri: src }}
      ref={webViewRef}
      {...events}
      javaScriptEnabled={true}
    ></WebView>
  </Portal>)
})

_WebView.displayName = 'mpx-web-view'

export default _WebView
