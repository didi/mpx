import { useRef, useMemo } from 'react';
import { collectDataset } from '@mpxjs/utils';
import { omit, extendObject, useNavigation } from './utils';
import eventConfigMap from './event.config';
const globalEventState = {
    needPress: true
};
const getTouchEvent = (type, event, config) => {
    const { navigation, propsRef, layoutRef } = config;
    const props = propsRef.current;
    const { top: navigationY = 0 } = navigation?.layout || {};
    const nativeEvent = event.nativeEvent;
    const { timestamp, pageX, pageY, touches, changedTouches } = nativeEvent;
    const { id } = props;
    const currentTarget = extendObject({}, event.currentTarget, {
        id: id || '',
        dataset: collectDataset(props),
        offsetLeft: layoutRef.current?.offsetLeft || 0,
        offsetTop: layoutRef.current?.offsetTop || 0
    });
    const pendingProps = event._targetInst?.pendingProps || {};
    const target = extendObject({}, event.target, {
        id: pendingProps.parentId || pendingProps.nativeID || '',
        dataset: collectDataset(pendingProps)
    });
    return extendObject({}, event, {
        type,
        timeStamp: timestamp,
        currentTarget,
        target,
        detail: {
            x: pageX,
            y: pageY - navigationY
        },
        touches: touches.map((item) => {
            return {
                identifier: item.identifier,
                pageX: item.pageX,
                pageY: item.pageY - navigationY,
                clientX: item.pageX,
                clientY: item.pageY - navigationY
            };
        }),
        changedTouches: changedTouches.map((item) => {
            return {
                identifier: item.identifier,
                pageX: item.pageX,
                pageY: item.pageY - navigationY,
                clientX: item.pageX,
                clientY: item.pageY - navigationY
            };
        }),
        persist: event.persist,
        stopPropagation: event.stopPropagation,
        preventDefault: event.preventDefault
    });
};
export const getCustomEvent = (type = '', oe = {}, { detail = {}, layoutRef }, props = {}) => {
    const targetInfo = extendObject({}, oe.target, {
        id: props.id || '',
        dataset: collectDataset(props),
        offsetLeft: layoutRef?.current?.offsetLeft || 0,
        offsetTop: layoutRef?.current?.offsetTop || 0
    });
    return extendObject({}, oe, {
        type,
        detail,
        target: targetInfo,
        persist: oe.persist,
        stopPropagation: oe.stopPropagation,
        preventDefault: oe.preventDefault
    });
};
function handleEmitEvent(name, e, type, eventConfig) {
    const { propsRef } = eventConfig;
    const eventCfg = eventConfig[name];
    if (eventCfg) {
        if (eventCfg.hasCatch && name !== 'tap' && name !== 'longpress') {
            e.stopPropagation();
        }
        eventCfg[type].forEach((event) => {
            propsRef.current[event]?.(getTouchEvent(name, e, eventConfig));
        });
    }
}
function checkIsNeedPress(e, type, ref) {
    const tapDetailInfo = ref.current.mpxPressInfo.detail || { x: 0, y: 0 };
    const currentPageX = e.nativeEvent.changedTouches[0].pageX;
    const currentPageY = e.nativeEvent.changedTouches[0].pageY;
    if (Math.abs(currentPageX - tapDetailInfo.x) > 3 ||
        Math.abs(currentPageY - tapDetailInfo.y) > 3) {
        globalEventState.needPress = false;
        ref.current.startTimer[type] && clearTimeout(ref.current.startTimer[type]);
        ref.current.startTimer[type] = null;
    }
}
function handleTouchstart(e, type, eventConfig) {
    // 阻止事件被释放放回对象池，导致对象复用 _stoppedEventTypes 状态被保留
    e.persist();
    const { innerRef } = eventConfig;
    globalEventState.needPress = true;
    innerRef.current.mpxPressInfo.detail = {
        x: e.nativeEvent.changedTouches[0].pageX,
        y: e.nativeEvent.changedTouches[0].pageY
    };
    handleEmitEvent('touchstart', e, type, eventConfig);
    if (eventConfig.longpress) {
        if (e._stoppedEventTypes?.has('longpress')) {
            return;
        }
        if (eventConfig.longpress.hasCatch) {
            e._stoppedEventTypes = e._stoppedEventTypes || new Set();
            e._stoppedEventTypes.add('longpress');
        }
        innerRef.current.startTimer[type] && clearTimeout(innerRef.current.startTimer[type]);
        innerRef.current.startTimer[type] = setTimeout(() => {
            // 只要触发过longpress, 全局就不再触发tap
            globalEventState.needPress = false;
            handleEmitEvent('longpress', e, type, eventConfig);
        }, 350);
    }
}
function handleTouchmove(e, type, eventConfig) {
    const { innerRef } = eventConfig;
    handleEmitEvent('touchmove', e, type, eventConfig);
    if (eventConfig.tap) {
        checkIsNeedPress(e, type, innerRef);
    }
}
function handleTouchend(e, type, eventConfig) {
    const { innerRef, disableTap } = eventConfig;
    handleEmitEvent('touchend', e, type, eventConfig);
    innerRef.current.startTimer[type] && clearTimeout(innerRef.current.startTimer[type]);
    if (eventConfig.tap) {
        checkIsNeedPress(e, type, innerRef);
        if (!globalEventState.needPress || (type === 'bubble' && disableTap) || e._stoppedEventTypes?.has('tap')) {
            return;
        }
        if (eventConfig.tap.hasCatch) {
            e._stoppedEventTypes = e._stoppedEventTypes || new Set();
            e._stoppedEventTypes.add('tap');
        }
        handleEmitEvent('tap', e, type, eventConfig);
    }
}
function handleTouchcancel(e, type, eventConfig) {
    const { innerRef } = eventConfig;
    handleEmitEvent('touchcancel', e, type, eventConfig);
    innerRef.current.startTimer[type] && clearTimeout(innerRef.current.startTimer[type]);
}
function createTouchEventHandler(eventName, eventConfig) {
    return (e) => {
        const bubbleHandlerMap = {
            onTouchStart: handleTouchstart,
            onTouchMove: handleTouchmove,
            onTouchEnd: handleTouchend,
            onTouchCancel: handleTouchcancel
        };
        const captureHandlerMap = {
            onTouchStartCapture: handleTouchstart,
            onTouchMoveCapture: handleTouchmove,
            onTouchEndCapture: handleTouchend,
            onTouchCancelCapture: handleTouchcancel
        };
        if (bubbleHandlerMap[eventName]) {
            bubbleHandlerMap[eventName](e, 'bubble', eventConfig);
        }
        if (captureHandlerMap[eventName]) {
            captureHandlerMap[eventName](e, 'capture', eventConfig);
        }
    };
}
const useInnerProps = (props = {}, userRemoveProps = [], rawConfig) => {
    const innerRef = useRef({
        startTimer: {
            bubble: null,
            capture: null
        },
        mpxPressInfo: {
            detail: {
                x: 0,
                y: 0
            }
        }
    });
    const propsRef = useRef({});
    propsRef.current = props;
    const navigation = useNavigation();
    const eventConfig = extendObject({
        layoutRef: {
            current: null
        },
        propsRef,
        innerRef,
        disableTap: false,
        navigation
    }, rawConfig);
    let hashEventKey = '';
    const rawEventKeys = [];
    const transformedEventSet = new Set();
    Object.keys(props).forEach((key) => {
        if (eventConfigMap[key]) {
            hashEventKey += eventConfigMap[key].bitFlag;
            rawEventKeys.push(key);
            eventConfigMap[key].events.forEach((event) => {
                transformedEventSet.add(event);
            });
            const match = /^(bind|catch|capture-bind|capture-catch)(.*)$/.exec(key);
            const prefix = match[1];
            const eventName = match[2];
            eventConfig[eventName] = eventConfig[eventName] || {
                bubble: [],
                capture: [],
                hasCatch: false
            };
            if (prefix === 'bind' || prefix === 'catch') {
                eventConfig[eventName].bubble.push(key);
            }
            else {
                eventConfig[eventName].capture.push(key);
            }
            if (prefix === 'catch' || prefix === 'capture-catch') {
                eventConfig[eventName].hasCatch = true;
            }
        }
    });
    const events = useMemo(() => {
        if (!hashEventKey) {
            return {};
        }
        const events = {};
        for (const eventName of transformedEventSet) {
            events[eventName] = createTouchEventHandler(eventName, eventConfig);
        }
        return events;
    }, [hashEventKey]);
    const removeProps = [
        'children',
        'enable-background',
        'enable-offset',
        'enable-var',
        'external-var-context',
        'parent-font-size',
        'parent-width',
        'parent-height',
        ...userRemoveProps,
        ...rawEventKeys
    ];
    return extendObject({}, events, omit(props, removeProps));
};
export default useInnerProps;
