import { forwardRef, useRef, useContext, useMemo, useState } from 'react';
import { warn, isFunction } from '@mpxjs/utils';
import Portal from './mpx-portal/index';
import { usePreventRemove } from '@react-navigation/native';
import { getCustomEvent } from './getInnerListeners';
import { promisify, redirectTo, navigateTo, navigateBack, reLaunch, switchTab } from '@mpxjs/api-proxy';
import { WebView } from 'react-native-webview';
import useNodesRef from './useNodesRef';
import { getCurrentPage, useNavigation } from './utils';
import { RouteContext } from './context';
import { StyleSheet, View, Text } from 'react-native';
const styles = StyleSheet.create({
    loadErrorContext: {
        display: 'flex',
        alignItems: 'center'
    },
    loadErrorText: {
        fontSize: 12,
        color: '#666666',
        paddingTop: '40%',
        paddingBottom: 20,
        paddingLeft: '10%',
        paddingRight: '10%',
        textAlign: 'center'
    },
    loadErrorButton: {
        color: '#666666',
        textAlign: 'center',
        padding: 10,
        borderColor: '#666666',
        borderStyle: 'solid',
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 10
    }
});
const _WebView = forwardRef((props, ref) => {
    const { src, bindmessage, bindload, binderror } = props;
    const mpx = global.__mpx;
    const errorText = {
        'zh-CN': {
            text: '网络不可用，请检查网络设置',
            button: '重新加载'
        },
        'en-US': {
            text: 'The network is not available. Please check the network settings',
            button: 'Reload'
        }
    };
    const currentErrorText = errorText[mpx.i18n?.locale || 'zh-CN'];
    if (props.style) {
        warn('The web-view component does not support the style prop.');
    }
    const { pageId } = useContext(RouteContext) || {};
    const [pageLoadErr, setPageLoadErr] = useState(false);
    const currentPage = useMemo(() => getCurrentPage(pageId), [pageId]);
    const webViewRef = useRef(null);
    const fristLoaded = useRef(false);
    const isLoadError = useRef(false);
    const isNavigateBack = useRef(false);
    const statusCode = useRef('');
    const defaultWebViewStyle = {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
    };
    const navigation = useNavigation();
    const [isIntercept, setIsIntercept] = useState(false);
    usePreventRemove(isIntercept, (event) => {
        const { data } = event;
        if (isNavigateBack.current) {
            navigation?.dispatch(data.action);
        }
        else {
            webViewRef.current?.goBack();
        }
        isNavigateBack.current = false;
    });
    useNodesRef(props, ref, webViewRef, {
        style: defaultWebViewStyle
    });
    if (!src) {
        return null;
    }
    const _reload = function () {
        if (__mpx_mode__ !== 'ios') {
            fristLoaded.current = false; // 安卓需要重新设置
        }
        setPageLoadErr(false);
    };
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
    true;
  `;
    const sendMessage = function (params) {
        return `
      window.mpxWebviewMessageCallback && window.mpxWebviewMessageCallback(${params})
      true;
    `;
    };
    const _changeUrl = function (navState) {
        if (navState.navigationType) { // navigationType这个事件在页面开始加载时和页面加载完成时都会被触发所以判断这个避免其他无效触发执行该逻辑
            currentPage.__webViewUrl = navState.url;
            setIsIntercept(navState.canGoBack);
        }
    };
    const _onLoadProgress = function (event) {
        if (__mpx_mode__ !== 'ios') {
            setIsIntercept(event.nativeEvent.canGoBack);
        }
    };
    const _message = function (res) {
        let data = {};
        let asyncCallback;
        const navObj = promisify({ redirectTo, navigateTo, navigateBack, reLaunch, switchTab });
        try {
            const nativeEventData = res.nativeEvent?.data;
            if (typeof nativeEventData === 'string') {
                data = JSON.parse(nativeEventData);
            }
        }
        catch (e) { }
        const args = data.args;
        const postData = data.payload || {};
        const params = Array.isArray(args) ? args : [postData];
        const type = data.type;
        switch (type) {
            case 'setTitle':
                { // case下不允许直接声明，包个块解决该问题
                    const title = postData._documentTitle?.trim();
                    if (title !== undefined) {
                        navigation && navigation.setPageConfig({ navigationBarTitleText: title });
                    }
                }
                break;
            case 'postMessage':
                bindmessage && bindmessage(getCustomEvent('messsage', {}, {
                    detail: {
                        data: params[0]?.data
                    }
                }));
                asyncCallback = Promise.resolve({
                    errMsg: 'invokeWebappApi:ok'
                });
                break;
            case 'navigateTo':
                asyncCallback = navObj.navigateTo(...params);
                break;
            case 'navigateBack':
                isNavigateBack.current = true;
                asyncCallback = navObj.navigateBack(...params);
                break;
            case 'redirectTo':
                asyncCallback = navObj.redirectTo(...params);
                break;
            case 'switchTab':
                asyncCallback = navObj.switchTab(...params);
                break;
            case 'reLaunch':
                asyncCallback = navObj.reLaunch(...params);
                break;
            default:
                if (type) {
                    const implement = mpx.config.webviewConfig.apiImplementations && mpx.config.webviewConfig.apiImplementations[type];
                    if (isFunction(implement)) {
                        asyncCallback = Promise.resolve(implement(...params));
                    }
                    else {
                        /* eslint-disable prefer-promise-reject-errors */
                        asyncCallback = Promise.reject({
                            errMsg: `未在apiImplementations中配置${type}方法`
                        });
                    }
                }
                break;
        }
        asyncCallback && asyncCallback.then((res) => {
            if (webViewRef.current?.postMessage) {
                const result = JSON.stringify({
                    type,
                    callbackId: data.callbackId,
                    result: res
                });
                webViewRef.current.injectJavaScript(sendMessage(result));
            }
        }).catch((error) => {
            if (webViewRef.current?.postMessage) {
                const result = JSON.stringify({
                    type,
                    callbackId: data.callbackId,
                    error
                });
                webViewRef.current.injectJavaScript(sendMessage(result));
            }
        });
    };
    const onLoadEndHandle = function (res) {
        fristLoaded.current = true;
        const src = res.nativeEvent?.url;
        if (isLoadError.current) {
            isLoadError.current = false;
            isNavigateBack.current = false;
            const result = {
                type: 'error',
                timeStamp: res.timeStamp,
                detail: {
                    src,
                    statusCode: statusCode.current
                }
            };
            binderror && binderror(result);
        }
        else {
            const result = {
                type: 'load',
                timeStamp: res.timeStamp,
                detail: {
                    src
                }
            };
            bindload?.(result);
        }
    };
    const onLoadEnd = function (res) {
        if (__mpx_mode__ !== 'ios') {
            res.persist();
            setTimeout(() => {
                onLoadEndHandle(res);
            }, 0);
        }
        else {
            onLoadEndHandle(res);
        }
    };
    const onHttpError = function (res) {
        isLoadError.current = true;
        statusCode.current = res.nativeEvent?.statusCode;
    };
    const onError = function () {
        statusCode.current = '';
        isLoadError.current = true;
        if (!fristLoaded.current) {
            setPageLoadErr(true);
        }
    };
    return (<Portal>
        {pageLoadErr
            ? (<View style={[styles.loadErrorContext, defaultWebViewStyle]}>
              <View style={styles.loadErrorText}><Text style={{ fontSize: 14, color: '#999999' }}>{currentErrorText.text}</Text></View>
              <View style={styles.loadErrorButton} onTouchEnd={_reload}><Text style={{ fontSize: 12, color: '#666666' }}>{currentErrorText.button}</Text></View>
            </View>)
            : (<WebView style={defaultWebViewStyle} source={{ uri: src }} ref={webViewRef} javaScriptEnabled={true} onNavigationStateChange={_changeUrl} onMessage={_message} injectedJavaScript={injectedJavaScript} onLoadProgress={_onLoadProgress} onLoadEnd={onLoadEnd} onHttpError={onHttpError} onError={onError} allowsBackForwardNavigationGestures={true}></WebView>)}
      </Portal>);
});
_WebView.displayName = 'MpxWebview';
export default _WebView;
