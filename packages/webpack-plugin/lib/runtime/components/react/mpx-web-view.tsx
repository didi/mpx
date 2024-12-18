import { forwardRef, JSX, useRef, useContext, useMemo } from 'react'
import { warn, getFocusedNavigation, isFunction } from '@mpxjs/utils'
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
  [x: string]: any
}

type MessageData = {
  payload?: PayloadData,
  args?: Array<any>,
  type?: string,
  callbackId?: number
}

const _WebView = forwardRef<HandlerRef<WebView, WebViewProps>, WebViewProps>((props, ref): JSX.Element | null => {
  const { src, bindmessage, bindload, binderror } = props
  const mpx = global.__mpx
  if (props.style) {
    warn('The web-view component does not support the style prop.')
  }
  const pageId = useContext(RouteContext)
  const currentPage = useMemo(() => getCurrentPage(pageId), [pageId])
  const webViewRef = useRef<WebView>(null)
  const defaultWebViewStyle = {
    position: 'absolute' as 'absolute' | 'relative' | 'static',
    left: 0 as number,
    right: 0 as number,
    top: 0 as number,
    bottom: 0 as number
  }

  useNodesRef<WebView, WebViewProps>(props, ref, webViewRef, {
    style: defaultWebViewStyle
  })

  if (!src) {
    return null
  }

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
  const injectedJavaScript = `
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      var _documentTitle = document.title;
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'setTitle',
        payload: {
          _documentTitle: _documentTitle
        }
      }))
      Object.defineProperty(document, 'title', {
        set (val) {
          _documentTitle = val
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'setTitle',
            payload: {
              _documentTitle: _documentTitle
            }
          }))
        },
        get () {
          return _documentTitle
        }
      });
    }
  `
  const _changeUrl = function (navState: WebViewNavigation) {
    if (navState.navigationType) { // navigationType这个事件在页面开始加载时和页面加载完成时都会被触发所以判断这个避免其他无效触发执行该逻辑
      currentPage.__webViewUrl = navState.url
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
    const args = data.args
    const postData: PayloadData = data.payload || {}
    const params = args !== undefined ? args : [postData]
    const type = data.type
    switch (type) {
      case 'setTitle':
        { // case下不允许直接声明，包个块解决该问题
          const title = postData._documentTitle
          if (title) {
            const navigation = getFocusedNavigation()
            navigation && navigation.setOptions({ title })
          }
        }
        break
      case 'postMessage':
        bindmessage && bindmessage(getCustomEvent('messsage', {}, { // RN组件销毁顺序与小程序不一致，所以改成和支付宝消息一致
          detail: {
            data: params[0]?.data
          }
        }))
        asyncCallback = Promise.resolve({
          errMsg: 'invokeWebappApi:ok'
        })
        break
      case 'navigateTo':
        asyncCallback = navObj.navigateTo(...params)
        break
      case 'navigateBack':
        asyncCallback = navObj.navigateBack(...params)
        break
      case 'redirectTo':
        asyncCallback = navObj.redirectTo(...params)
        break
      case 'switchTab':
        asyncCallback = navObj.switchTab(...params)
        break
      case 'reLaunch':
        asyncCallback = navObj.reLaunch(...params)
        break
      default:
        if (type) {
          const implement = mpx.config.webviewConfig.apiImplementations && mpx.config.webviewConfig.apiImplementations[type]
          if (isFunction(implement)) {
            asyncCallback = Promise.resolve(implement(...params))
          } else {
            /* eslint-disable prefer-promise-reject-errors */
            asyncCallback = Promise.reject({
              errMsg: `未在apiImplementations中配置${type}方法`
            })
          }
        }
        break
    }

    asyncCallback && asyncCallback.then((res: any) => {
      if (webViewRef.current?.postMessage) {
        const test = JSON.stringify({
          type,
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
  extendObject(events, {
    onMessage: _message
  })
  return (<Portal>
    <WebView
      style={defaultWebViewStyle}
      source={{ uri: src }}
      ref={webViewRef}
      {...events}
      onNavigationStateChange={_changeUrl}
      injectedJavaScript={injectedJavaScript}
      javaScriptEnabled={true}
    ></WebView>
  </Portal>)
})

_WebView.displayName = 'MpxWebview'

export default _WebView
