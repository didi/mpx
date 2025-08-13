/**
 * ✘ type
 * ✘ canvas-id
 * ✘ disable-scroll
 * ✔ bindtouchstart
 * ✔ bindtouchmove
 * ✔ bindtouchend
 * ✔ bindtouchcancel
 * ✔ bindlongtap
 * ✔ binderror
 */
import { createElement, useRef, useState, useCallback, useEffect, forwardRef } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import useNodesRef from '../useNodesRef';
import { useLayout, useTransformStyle, extendObject } from '../utils';
import useInnerProps, { getCustomEvent } from '../getInnerListeners';
import Bus from './Bus';
import { useWebviewBinding, constructors, WEBVIEW_TARGET, ID, registerWebviewConstructor } from './utils';
import CanvasRenderingContext2D from './CanvasRenderingContext2D';
import html from './html';
import './CanvasGradient';
import { createImage as canvasCreateImage } from './Image';
import { createImageData as canvasCreateImageData } from './ImageData';
import { useConstructorsRegistry } from './constructorsRegistry';
import Portal from '../mpx-portal';
const stylesheet = StyleSheet.create({
    container: { overflow: 'hidden', flex: 0 },
    webview: {
        overflow: 'hidden',
        backgroundColor: 'transparent',
        flex: 0
    },
    webviewAndroid9: {
        overflow: 'hidden',
        backgroundColor: 'transparent',
        flex: 0,
        opacity: 0.99
    }
});
const _Canvas = forwardRef((props = {}, ref) => {
    const { style = {}, originWhitelist = ['*'], 'enable-var': enableVar, 'external-var-context': externalVarContext, 'parent-font-size': parentFontSize, 'parent-width': parentWidth, 'parent-height': parentHeight } = props;
    const [isLoaded, setIsLoaded] = useState(false);
    const nodeRef = useRef(null);
    const { normalStyle, hasSelfPercent, hasPositionFixed, setWidth, setHeight } = useTransformStyle(extendObject({}, style, stylesheet.container), {
        enableVar,
        externalVarContext,
        parentFontSize,
        parentWidth,
        parentHeight
    });
    const { width, height } = normalStyle;
    const canvasRef = useWebviewBinding({
        targetName: 'canvas',
        properties: { width, height },
        methods: ['toDataURL']
    });
    const { register } = useConstructorsRegistry();
    const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef });
    const innerProps = useInnerProps(extendObject({}, props, layoutProps, {
        ref: nodeRef,
        style: extendObject({}, normalStyle, layoutStyle, { opacity: isLoaded ? 1 : 0 })
    }), [], {
        layoutRef
    });
    const context2D = new CanvasRenderingContext2D(canvasRef.current);
    register(registerWebviewConstructor);
    // 初始化bus和context2D
    useEffect(() => {
        const webviewPostMessage = (message) => {
            if (canvasRef.current.webview) {
                const jsCode = `
        window.mpxWebviewMessageCallback(${JSON.stringify(message)});
        true;
      `;
                canvasRef.current.webview.injectJavaScript(jsCode);
            }
        };
        // 设置bus
        canvasRef.current.bus = new Bus(webviewPostMessage);
        canvasRef.current.bus.pause();
        // 设置 context 2D
        canvasRef.current.context2D = context2D;
        // 设置 getContext 方法
        canvasRef.current.getContext = getContext;
        // 设置 createImage 方法
        canvasRef.current.createImage = createImage;
        // 设置 postMessage 方法
        canvasRef.current.postMessage = postMessage;
        // 设置 listeners
        canvasRef.current.listeners = [];
        canvasRef.current.addMessageListener = addMessageListener;
        canvasRef.current.removeMessageListener = removeMessageListener;
        canvasRef.current.createImageData = createImageData;
        return () => {
            canvasRef.current.bus?.clearBatchingTimeout();
        };
    }, []);
    const createImageData = (dataArray, width, height) => {
        return canvasCreateImageData(canvasRef.current, dataArray, width, height);
    };
    const createImage = (width, height) => {
        return canvasCreateImage(canvasRef.current, width, height);
    };
    const getContext = useCallback((contextType) => {
        if (contextType === '2d') {
            return context2D;
        }
        return null;
    }, []);
    const postMessage = useCallback(async (message) => {
        if (!canvasRef.current?.bus)
            return;
        const { type, payload } = await canvasRef.current.bus.post(extendObject({ id: ID() }, message));
        switch (type) {
            case 'error': {
                const { binderror } = props;
                binderror &&
                    binderror(getCustomEvent('error', {}, {
                        detail: {
                            errMsg: payload.message
                        },
                        layoutRef
                    }, props));
                break;
            }
            case 'json': {
                return payload;
            }
            case 'blob': {
                return atob(payload);
            }
        }
    }, []);
    const addMessageListener = (listener) => {
        canvasRef.current.listeners.push(listener);
        return () => canvasRef.current.removeMessageListener(listener);
    };
    const removeMessageListener = (listener) => {
        canvasRef.current.listeners.splice(canvasRef.current.listeners.indexOf(listener), 1);
    };
    const onMessage = useCallback((e) => {
        const data = JSON.parse(e.nativeEvent.data);
        switch (data.type) {
            case 'error': {
                const { binderror } = props;
                binderror &&
                    binderror(getCustomEvent('error', e, {
                        detail: {
                            errMsg: data.payload.message
                        },
                        layoutRef
                    }, props));
                break;
            }
            default: {
                const newData = {};
                // createLinearGradient 方法调用需要在 constructors 中需要注册 CanvasGradient
                const constructor = constructors[data.meta.constructor];
                if (data.payload) {
                    if (constructor) {
                        const { args, payload } = data;
                        // RN 端同步生成一个 CanvasGradient 的实例
                        const object = constructor.constructLocally(canvasRef.current, ...args);
                        extendObject(object, payload, {
                            [WEBVIEW_TARGET]: data.meta.target
                        });
                        extendObject(newData, data, {
                            payload: object
                        });
                    }
                    for (const listener of canvasRef.current.listeners) {
                        listener(constructor ? newData.payload : data.payload);
                    }
                }
                if (canvasRef.current.bus) {
                    canvasRef.current.bus.handle(constructor && data.payload ? newData : data);
                }
            }
        }
    }, []);
    const onLoad = useCallback(() => {
        setIsLoaded(true);
        if (canvasRef.current?.bus) {
            canvasRef.current.bus.resume();
        }
    }, []);
    useNodesRef(props, ref, nodeRef, {
        style: normalStyle,
        node: canvasRef.current,
        context: context2D
    });
    let canvasComponent;
    if (__mpx_mode__ === 'android') {
        const isAndroid9 = Platform.Version >= 28;
        canvasComponent = createElement(View, innerProps, createElement(WebView, {
            ref: (element) => {
                if (canvasRef.current) {
                    canvasRef.current.webview = element;
                }
            },
            style: [
                isAndroid9 ? stylesheet.webviewAndroid9 : stylesheet.webview,
                { height, width }
            ],
            source: { html },
            originWhitelist: originWhitelist,
            onMessage: onMessage,
            onLoad: onLoad,
            overScrollMode: 'never',
            mixedContentMode: 'always',
            scalesPageToFit: false,
            javaScriptEnabled: true,
            domStorageEnabled: true,
            thirdPartyCookiesEnabled: true,
            allowUniversalAccessFromFileURLs: true
        }));
    }
    canvasComponent = createElement(View, innerProps, createElement(WebView, {
        ref: (element) => {
            if (canvasRef.current) {
                canvasRef.current.webview = element;
            }
        },
        style: [stylesheet.webview, { height, width }],
        source: { html },
        originWhitelist: originWhitelist,
        onMessage: onMessage,
        onLoad: onLoad,
        scrollEnabled: false
    }));
    if (hasPositionFixed) {
        canvasComponent = createElement(Portal, null, canvasComponent);
    }
    return canvasComponent;
});
_Canvas.displayName = 'mpxCanvas';
export default _Canvas;
