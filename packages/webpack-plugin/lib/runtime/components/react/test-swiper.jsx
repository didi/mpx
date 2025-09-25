import { View } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withDecay, Easing, runOnJS, useAnimatedReaction, cancelAnimation } from 'react-native-reanimated';
import React, { forwardRef, useRef, useEffect, useMemo, createElement } from 'react';
import useInnerProps, { getCustomEvent } from './getInnerListeners';
import useNodesRef from './useNodesRef'; // 引入辅助函数
import { useTransformStyle, splitStyle, splitProps, useLayout, wrapChildren, extendObject, flatGesture, useRunOnJSCallback } from './utils';
import { SwiperContext } from './context';
import Portal from './mpx-portal';
/**
 * 默认的Style类型
 */
const styles = {
    pagination_x: {
        position: 'absolute',
        bottom: 25,
        left: 0,
        right: 0,
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    pagination_y: {
        position: 'absolute',
        right: 15,
        top: 0,
        bottom: 0,
        flexDirection: 'column',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    pagerWrapperx: {
        position: 'absolute',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    pagerWrappery: {
        position: 'absolute',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    },
    swiper: {
        overflow: 'scroll',
        display: 'flex',
        justifyContent: 'flex-start'
    }
};
const dotCommonStyle = {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 3,
    marginRight: 3,
    marginTop: 3,
    marginBottom: 3,
    zIndex: 98
};
const activeDotStyle = {
    zIndex: 99
};
const longPressRatio = 100;
const easeMap = {
    default: Easing.inOut(Easing.cubic),
    linear: Easing.linear,
    easeInCubic: Easing.in(Easing.cubic),
    easeOutCubic: Easing.out(Easing.cubic),
    easeInOutCubic: Easing.inOut(Easing.cubic)
};
const SwiperWrapper = forwardRef((props, ref) => {
    const { 'indicator-dots': showPagination, 'indicator-color': dotColor = 'rgba(0, 0, 0, .3)', 'indicator-active-color': activeDotColor = '#000000', 'enable-var': enableVar = false, 'parent-font-size': parentFontSize, 'parent-width': parentWidth, 'parent-height': parentHeight, 'external-var-context': externalVarContext, 'simultaneous-handlers': originSimultaneousHandlers = [], 'wait-for': waitFor = [], style = {}, autoplay = false, circular = false, disableGesture = false, current: propCurrent = 0, bindchange } = props;
    const easeingFunc = props['easing-function'] || 'default';
    const easeDuration = props.duration || 500;
    const horizontal = props.vertical !== undefined ? !props.vertical : true;
    const nodeRef = useRef(null);
    // 手势协同gesture 1.0
    const swiperGestureRef = useRef();
    useNodesRef(props, ref, nodeRef, {
        // scrollView内部会过滤是否绑定了gestureRef，withRef(swiperGestureRef)给gesture对象设置一个ref(2.0版本)
        gestureRef: swiperGestureRef
    });
    // 计算transfrom之类的
    const { normalStyle, hasVarDec, varContextRef, hasSelfPercent, hasPositionFixed, setWidth, setHeight } = useTransformStyle(style, {
        enableVar,
        externalVarContext,
        parentFontSize,
        parentWidth,
        parentHeight
    });
    const { textStyle } = splitStyle(normalStyle);
    const { textProps } = splitProps(props);
    const preMargin = props['previous-margin'] ? global.__formatValue(props['previous-margin']) : 0;
    const nextMargin = props['next-margin'] ? global.__formatValue(props['next-margin']) : 0;
    const preMarginShared = useSharedValue(preMargin);
    const nextMarginShared = useSharedValue(nextMargin);
    const autoplayShared = useSharedValue(autoplay);
    // 默认前后补位的元素个数
    const patchElmNum = circular ? (preMargin ? 2 : 1) : 0;
    const patchElmNumShared = useSharedValue(patchElmNum);
    const circularShared = useSharedValue(circular);
    const children = Array.isArray(props.children) ? props.children.filter(child => child) : (props.children ? [props.children] : []);
    // 对有变化的变量，在worklet中只能使用sharedValue变量，useRef不能更新
    const childrenLength = useSharedValue(children.length);
    const initWidth = typeof normalStyle?.width === 'number' ? normalStyle.width - preMargin - nextMargin : normalStyle.width;
    const initHeight = typeof normalStyle?.height === 'number' ? normalStyle.height - preMargin - nextMargin : normalStyle.height;
    const dir = horizontal === false ? 'y' : 'x';
    const pstep = dir === 'x' ? initWidth : initHeight;
    const initStep = isNaN(pstep) ? 0 : pstep;
    // 每个元素的宽度 or 高度，有固定值直接初始化无则0
    const step = useSharedValue(initStep);
    // 记录选中元素的索引值
    const currentIndex = useSharedValue(propCurrent);
    // const initOffset = getOffset(props.current || 0, initStep)
    // 记录元素的偏移量
    const offset = useSharedValue(getOffset(propCurrent, initStep));
    const strAbso = 'absolute' + dir.toUpperCase();
    const strVelocity = 'velocity' + dir.toUpperCase();
    // 标识手指触摸和抬起, 起点在onBegin
    const touchfinish = useSharedValue(true);
    // 记录onUpdate时的方向，用于进行onFinalize中的值修正
    const preUpdateTransDir = useSharedValue(0);
    // 记录上一帧的绝对定位坐标
    const preAbsolutePos = useSharedValue(0);
    // 记录从onBegin 到 onTouchesUp 时移动的距离
    const moveTranstion = useSharedValue(0);
    const timerId = useRef(0);
    const intervalTimer = props.interval || 500;
    const simultaneousHandlers = flatGesture(originSimultaneousHandlers);
    const waitForHandlers = flatGesture(waitFor);
    // 判断gesture手势是否需要协同处理、等待手势失败响应
    const gestureSwitch = useRef(false);
    // 初始化上一次的手势
    const prevSimultaneousHandlersRef = useRef(originSimultaneousHandlers || []);
    const prevWaitForHandlersRef = useRef(waitFor || []);
    const hasSimultaneousHandlersChanged = prevSimultaneousHandlersRef.current.length !== (originSimultaneousHandlers?.length || 0) ||
        (originSimultaneousHandlers || []).some((handler, index) => handler !== prevSimultaneousHandlersRef.current[index]);
    const hasWaitForHandlersChanged = prevWaitForHandlersRef.current.length !== (waitFor?.length || 0) ||
        (waitFor || []).some((handler, index) => handler !== prevWaitForHandlersRef.current[index]);
    if (hasSimultaneousHandlersChanged || hasWaitForHandlersChanged) {
        gestureSwitch.current = !gestureSwitch.current;
    }
    // 存储上一次的手势
    prevSimultaneousHandlersRef.current = originSimultaneousHandlers || [];
    prevWaitForHandlersRef.current = waitFor || [];
    const { 
    // 存储layout布局信息
    layoutRef, layoutProps, layoutStyle } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef, onLayout: onWrapperLayout });
    const innerProps = useInnerProps(extendObject({}, props, {
        ref: nodeRef
    }), [
        'style',
        'indicator-dots',
        'indicator-color',
        'indicator-active-color',
        'previous-margin',
        'vertical',
        'previous-margin',
        'next-margin',
        'easing-function',
        'autoplay',
        'circular',
        'interval',
        'easing-function'
    ], { layoutRef: layoutRef });
    function onWrapperLayout(e) {
        const { width, height } = e.nativeEvent.layout;
        const realWidth = dir === 'x' ? width - preMargin - nextMargin : width;
        const realHeight = dir === 'y' ? height - preMargin - nextMargin : height;
        const iStep = dir === 'x' ? realWidth : realHeight;
        if (iStep !== step.value) {
            step.value = iStep;
            updateCurrent(propCurrent, iStep);
            updateAutoplay();
        }
    }
    const dotAnimatedStyle = useAnimatedStyle(() => {
        if (!step.value)
            return {};
        const dotStep = dotCommonStyle.width + dotCommonStyle.marginRight + dotCommonStyle.marginLeft;
        if (dir === 'x') {
            return { transform: [{ translateX: currentIndex.value * dotStep }] };
        }
        else {
            return { transform: [{ translateY: currentIndex.value * dotStep }] };
        }
    });
    function renderPagination() {
        const activeColor = activeDotColor || '#007aff';
        const unActionColor = dotColor || 'rgba(0,0,0,.2)';
        // 正常渲染所有dots
        const dots = [];
        for (let i = 0; i < children.length; i++) {
            dots.push(<View style={[dotCommonStyle, { backgroundColor: unActionColor }]} key={i}></View>);
        }
        return (<View pointerEvents="none" style={styles['pagination_' + dir]}>
        <View style={[styles['pagerWrapper' + dir]]}>
          <Animated.View style={[
                dotCommonStyle,
                activeDotStyle,
                {
                    backgroundColor: activeColor,
                    position: 'absolute',
                    left: 0,
                    top: 0
                },
                dotAnimatedStyle
            ]}/>
          {dots}
        </View>
      </View>);
    }
    function renderItems() {
        const intLen = children.length;
        let renderChild = children.slice();
        if (circular && intLen > 1) {
            // 最前面加最后一个元素
            const lastChild = React.cloneElement(children[intLen - 1], { key: 'clone0' });
            // 最后面加第一个元素
            const firstChild = React.cloneElement(children[0], { key: 'clone1' });
            if (preMargin) {
                const lastChild1 = React.cloneElement(children[intLen - 2], { key: 'clone2' });
                const firstChild1 = React.cloneElement(children[1], { key: 'clone3' });
                renderChild = [lastChild1, lastChild].concat(renderChild).concat([firstChild, firstChild1]);
            }
            else {
                renderChild = [lastChild].concat(renderChild).concat([firstChild]);
            }
        }
        const arrChildren = renderChild.map((child, index) => {
            const extraStyle = {};
            if (index === 0 && !circular) {
                preMargin && dir === 'x' && (extraStyle.marginLeft = preMargin);
                preMargin && dir === 'y' && (extraStyle.marginTop = preMargin);
            }
            if (index === intLen - 1 && !circular) {
                nextMargin && dir === 'x' && (extraStyle.marginRight = nextMargin);
                nextMargin && dir === 'y' && (extraStyle.marginBottom = nextMargin);
            }
            // 业务swiper-item自己生成key，内部添加的元素自定义key
            const newChild = React.cloneElement(child, {
                itemIndex: index,
                customStyle: extraStyle
            });
            return newChild;
        });
        const contextValue = {
            offset,
            step,
            scale: props.scale,
            dir
        };
        return (<SwiperContext.Provider value={contextValue}>{arrChildren}</SwiperContext.Provider>);
    }
    const { loop, pauseLoop, resumeLoop } = useMemo(() => {
        function createAutoPlay() {
            if (!step.value)
                return;
            let targetOffset = 0;
            let nextIndex = currentIndex.value;
            if (!circularShared.value) {
                // 获取下一个位置的坐标, 循环到最后一个元素,直接停止, 取消定时器
                if (currentIndex.value === childrenLength.value - 1) {
                    pauseLoop();
                    return;
                }
                nextIndex += 1;
                // targetOffset = -nextIndex * step.value - preMarginShared.value
                targetOffset = -nextIndex * step.value;
                offset.value = withTiming(targetOffset, {
                    duration: easeDuration,
                    easing: easeMap[easeingFunc]
                }, () => {
                    currentIndex.value = nextIndex;
                    runOnJS(runOnJSCallback)('loop');
                });
            }
            else {
                // 默认向右, 向下
                if (nextIndex === childrenLength.value - 1) {
                    nextIndex = 0;
                    targetOffset = -(childrenLength.value + patchElmNumShared.value) * step.value + preMarginShared.value;
                    // 执行动画到下一帧
                    offset.value = withTiming(targetOffset, {
                        duration: easeDuration
                    }, () => {
                        const initOffset = -step.value * patchElmNumShared.value + preMarginShared.value;
                        // 将开始位置设置为真正的位置
                        offset.value = initOffset;
                        currentIndex.value = nextIndex;
                        runOnJS(runOnJSCallback)('loop');
                    });
                }
                else {
                    nextIndex = currentIndex.value + 1;
                    targetOffset = -(nextIndex + patchElmNumShared.value) * step.value + preMarginShared.value;
                    // 执行动画到下一帧
                    offset.value = withTiming(targetOffset, {
                        duration: easeDuration,
                        easing: easeMap[easeingFunc]
                    }, () => {
                        currentIndex.value = nextIndex;
                        runOnJS(runOnJSCallback)('loop');
                    });
                }
            }
        }
        // loop在JS线程中调用，createAutoPlay + useEffect中
        function loop() {
            timerId.current && clearTimeout(timerId.current);
            timerId.current = setTimeout(createAutoPlay, intervalTimer);
        }
        function pauseLoop() {
            timerId.current && clearTimeout(timerId.current);
        }
        // resumeLoop在worklet中调用
        function resumeLoop() {
            if (autoplayShared.value && childrenLength.value > 1) {
                loop();
            }
        }
        return {
            loop,
            pauseLoop,
            resumeLoop
        };
    }, []);
    function handleSwiperChange(current) {
        const eventData = getCustomEvent('change', {}, { detail: { current, source: 'touch' }, layoutRef: layoutRef });
        bindchange && bindchange(eventData);
    }
    const runOnJSCallbackRef = useRef({
        loop,
        pauseLoop,
        resumeLoop,
        handleSwiperChange
    });
    const runOnJSCallback = useRunOnJSCallback(runOnJSCallbackRef);
    function getOffset(index, stepValue) {
        if (!stepValue)
            return 0;
        let targetOffset = 0;
        if (circular && children.length > 1) {
            const targetIndex = index + patchElmNum;
            targetOffset = -(stepValue * targetIndex - preMargin);
        }
        else {
            targetOffset = -index * stepValue;
        }
        return targetOffset;
    }
    function updateCurrent(index, stepValue) {
        const targetOffset = getOffset(index || 0, stepValue);
        if (targetOffset !== offset.value) {
            // 内部基于props.current!==currentIndex.value决定是否使用动画及更新currentIndex.value
            if (propCurrent !== undefined && propCurrent !== currentIndex.value) {
                offset.value = withTiming(targetOffset, {
                    duration: easeDuration,
                    easing: easeMap[easeingFunc]
                }, () => {
                    currentIndex.value = propCurrent;
                });
            }
            else {
                offset.value = targetOffset;
            }
        }
    }
    function updateAutoplay() {
        if (autoplay && children.length > 1) {
            loop();
        }
        else {
            pauseLoop();
        }
    }
    // 1. 用户在当前页切换选中项，动画；用户携带选中index打开到swiper页直接选中不走动画
    useAnimatedReaction(() => currentIndex.value, (newIndex, preIndex) => {
        // 这里必须传递函数名, 直接写()=> {}形式会报 访问了未sharedValue信息
        if (newIndex !== preIndex && preIndex !== null && preIndex !== undefined && bindchange) {
            runOnJS(runOnJSCallback)('handleSwiperChange', newIndex, propCurrent);
        }
    });
    useEffect(() => {
        let patchStep = 0;
        if (preMargin !== preMarginShared.value) {
            patchStep += preMargin - preMarginShared.value;
        }
        if (nextMargin !== nextMarginShared.value) {
            patchStep += nextMargin - nextMarginShared.value;
        }
        preMarginShared.value = preMargin;
        nextMarginShared.value = nextMargin;
        const newStep = step.value - patchStep;
        if (step.value !== newStep) {
            step.value = newStep;
            offset.value = getOffset(currentIndex.value, newStep);
        }
    }, [preMargin, nextMargin]);
    useEffect(() => {
        childrenLength.value = children.length;
        if (children.length - 1 < currentIndex.value) {
            pauseLoop();
            currentIndex.value = 0;
            offset.value = getOffset(0, step.value);
            if (autoplay && children.length > 1) {
                loop();
            }
        }
    }, [children.length]);
    useEffect(() => {
        // 1. 如果用户在touch的过程中, 外部更新了current以内部为准（小程序表现）
        // 2. 手指滑动过程中更新索引，外部会把current再传入进来，导致offset直接更新，增加判断不同才更新
        if (propCurrent !== currentIndex.value && touchfinish.value) {
            updateCurrent(propCurrent, step.value);
        }
    }, [propCurrent]);
    useEffect(() => {
        autoplayShared.value = autoplay;
        updateAutoplay();
        return () => {
            if (autoplay) {
                pauseLoop();
            }
        };
    }, [autoplay]);
    useEffect(() => {
        if (circular !== circularShared.value) {
            circularShared.value = circular;
            patchElmNumShared.value = circular ? (preMargin ? 2 : 1) : 0;
            offset.value = getOffset(currentIndex.value, step.value);
        }
    }, [circular, preMargin]);
    const { gestureHandler } = useMemo(() => {
        function getTargetPosition(eventData) {
            'worklet';
            // 移动的距离
            const { transdir } = eventData;
            let resetOffsetPos = 0;
            let selectedIndex = currentIndex.value;
            // 是否临界点
            let isCriticalItem = false;
            // 真实滚动到的偏移量坐标
            let moveToTargetPos = 0;
            const tmp = !circularShared.value ? 0 : preMarginShared.value;
            const currentOffset = transdir < 0 ? offset.value - tmp : offset.value + tmp;
            const computedIndex = Math.abs(currentOffset) / step.value;
            const moveToIndex = transdir < 0 ? Math.ceil(computedIndex) : Math.floor(computedIndex);
            // 实际应该定位的索引值
            if (!circularShared.value) {
                selectedIndex = moveToIndex;
                moveToTargetPos = selectedIndex * step.value;
            }
            else {
                if (moveToIndex >= childrenLength.value + patchElmNumShared.value) {
                    selectedIndex = moveToIndex - (childrenLength.value + patchElmNumShared.value);
                    resetOffsetPos = (selectedIndex + patchElmNumShared.value) * step.value - preMarginShared.value;
                    moveToTargetPos = moveToIndex * step.value - preMarginShared.value;
                    isCriticalItem = true;
                }
                else if (moveToIndex <= patchElmNumShared.value - 1) {
                    selectedIndex = moveToIndex === 0 ? childrenLength.value - patchElmNumShared.value : childrenLength.value - 1;
                    resetOffsetPos = (selectedIndex + patchElmNumShared.value) * step.value - preMarginShared.value;
                    moveToTargetPos = moveToIndex * step.value - preMarginShared.value;
                    isCriticalItem = true;
                }
                else {
                    selectedIndex = moveToIndex - patchElmNumShared.value;
                    moveToTargetPos = moveToIndex * step.value - preMarginShared.value;
                }
            }
            return {
                selectedIndex,
                isCriticalItem,
                resetOffset: -resetOffsetPos,
                targetOffset: -moveToTargetPos
            };
        }
        function canMove(eventData) {
            'worklet';
            // 旧版：如果在快速多次滑动时，只根据当前的offset判断，会出现offset没超出，加上translation后越界的场景(如在倒数第二个元素快速滑动)
            // 新版：会加上translation
            const { translation, transdir } = eventData;
            const gestureMovePos = offset.value + translation;
            if (!circularShared.value) {
                // 如果只判断区间，中间非滑动状态(handleResistanceMove)向左滑动，突然改为向右滑动，但是还在非滑动态，本应该可滑动判断为了不可滑动
                const posEnd = -step.value * (childrenLength.value - 1);
                if (transdir < 0) {
                    return gestureMovePos > posEnd;
                }
                else {
                    return gestureMovePos < 0;
                }
            }
            else {
                return true;
            }
        }
        function handleEnd(eventData) {
            'worklet';
            const { isCriticalItem, targetOffset, resetOffset, selectedIndex } = getTargetPosition(eventData);
            if (isCriticalItem) {
                offset.value = withTiming(targetOffset, {
                    duration: easeDuration,
                    easing: easeMap[easeingFunc]
                }, () => {
                    if (touchfinish.value !== false) {
                        currentIndex.value = selectedIndex;
                        offset.value = resetOffset;
                        runOnJS(runOnJSCallback)('resumeLoop');
                    }
                });
            }
            else {
                offset.value = withTiming(targetOffset, {
                    duration: easeDuration,
                    easing: easeMap[easeingFunc]
                }, () => {
                    if (touchfinish.value !== false) {
                        currentIndex.value = selectedIndex;
                        runOnJS(runOnJSCallback)('resumeLoop');
                    }
                });
            }
        }
        function handleBack(eventData) {
            'worklet';
            const { transdir } = eventData;
            // 向右滑动的back:trans < 0， 向左滑动的back: trans < 0
            let currentOffset = Math.abs(offset.value);
            if (circularShared.value) {
                currentOffset += transdir < 0 ? preMarginShared.value : -preMarginShared.value;
            }
            const curIndex = currentOffset / step.value;
            const moveToIndex = (transdir < 0 ? Math.floor(curIndex) : Math.ceil(curIndex)) - patchElmNumShared.value;
            const targetOffset = -(moveToIndex + patchElmNumShared.value) * step.value + (circularShared.value ? preMarginShared.value : 0);
            offset.value = withTiming(targetOffset, {
                duration: easeDuration,
                easing: easeMap[easeingFunc]
            }, () => {
                if (touchfinish.value !== false) {
                    currentIndex.value = moveToIndex;
                    runOnJS(runOnJSCallback)('resumeLoop');
                }
            });
        }
        // 当前的offset和index多对应的offset进行对比，判断是否超过一半
        function computeHalf(eventData) {
            'worklet';
            const { transdir } = eventData;
            const currentOffset = Math.abs(offset.value);
            let preOffset = (currentIndex.value + patchElmNumShared.value) * step.value;
            if (circularShared.value) {
                preOffset -= preMarginShared.value;
            }
            // 正常事件中拿到的translation值(正向滑动<0，倒着滑>0)
            const diffOffset = preOffset - currentOffset;
            const half = Math.abs(diffOffset) > step.value / 2;
            const isTriggerUpdateHalf = (transdir < 0 && currentOffset < preOffset) || (transdir > 0 && currentOffset > preOffset);
            return {
                diffOffset,
                half,
                isTriggerUpdateHalf
            };
        }
        function handleLongPress(eventData) {
            'worklet';
            const { diffOffset, half, isTriggerUpdateHalf } = computeHalf(eventData);
            if (+diffOffset === 0) {
                runOnJS(runOnJSCallback)('resumeLoop');
            }
            else if (isTriggerUpdateHalf) {
                // 如果触发了onUpdate时的索引变更
                handleEnd(eventData);
            }
            else if (half) {
                handleEnd(eventData);
            }
            else {
                handleBack(eventData);
            }
        }
        function reachBoundary(eventData) {
            'worklet';
            // 1. 基于当前的offset和translation判断是否超过当前边界值
            const { translation } = eventData;
            const boundaryStart = -patchElmNumShared.value * step.value;
            const boundaryEnd = -(childrenLength.value + patchElmNumShared.value) * step.value;
            const moveToOffset = offset.value + translation;
            let isBoundary = false;
            let resetOffset = 0;
            if (moveToOffset < boundaryEnd) {
                isBoundary = true;
                // 超过边界的距离
                const exceedLength = Math.abs(moveToOffset) - Math.abs(boundaryEnd);
                // 计算对标正常元素所在的offset
                resetOffset = patchElmNumShared.value * step.value + exceedLength;
            }
            if (moveToOffset > boundaryStart) {
                isBoundary = true;
                // 超过边界的距离
                const exceedLength = Math.abs(boundaryStart) - Math.abs(moveToOffset);
                // 计算对标正常元素所在的offset
                resetOffset = (patchElmNumShared.value + childrenLength.value - 1) * step.value + (step.value - exceedLength);
            }
            return {
                isBoundary,
                resetOffset: -resetOffset
            };
        }
        // 非循环超出边界，应用阻力; 开始滑动少阻力小，滑动越长阻力越大
        function handleResistanceMove(eventData) {
            'worklet';
            const { translation, transdir } = eventData;
            const moveToOffset = offset.value + translation;
            const maxOverDrag = Math.floor(step.value / 2);
            const maxOffset = translation < 0 ? -(childrenLength.value - 1) * step.value : 0;
            let resistance = 0.1;
            let overDrag = 0;
            let finalOffset = 0;
            // 向右向下小于0, 向左向上大于0；
            if (transdir < 0) {
                overDrag = Math.abs(moveToOffset - maxOffset);
            }
            else {
                overDrag = Math.abs(moveToOffset);
            }
            // 滑动越多resistance越小
            resistance = 1 - overDrag / maxOverDrag;
            // 确保阻力在合理范围内
            resistance = Math.min(0.5, resistance);
            // 限制在最大拖拽范围内
            if (transdir < 0) {
                const adjustOffset = offset.value + translation * resistance;
                finalOffset = Math.max(adjustOffset, maxOffset - maxOverDrag);
            }
            else {
                const adjustOffset = offset.value + translation * resistance;
                finalOffset = Math.min(adjustOffset, maxOverDrag);
            }
            return finalOffset;
        }

        function handleInertialSlide(eventData, velocity) {
            'worklet';
            // 限制最大速度，避免滑动过快
            const clampedVelocity = Math.sign(velocity) * Math.min(Math.abs(velocity), 900);
            console.log('clampedVelocity____', clampedVelocity);
            // 计算滑动边界r
            let minOffset = 0;
            let maxOffset = 0;

            minOffset = -(childrenLength.value - 1) * step.value;
            maxOffset = 0;

            // 计算最终应该停留的位置（考虑patchElmNumShared的偏移）
            const snapPoints = [];
            for (let i = 0; i < childrenLength.value; i++) {
                snapPoints.push(-(i + patchElmNumShared.value) * step.value);
            }
            
            // 获取当前实际索引（考虑patchElmNumShared的偏移）
            const currentRealIndex = Math.round(Math.abs(offset.value) / step.value) - patchElmNumShared.value;
            const direction = Math.sign(clampedVelocity);
            let predictedIndex;
            
            // 无论滑动速度多快，每次只滑动一张卡片
            if (direction > 0) { // 向右滑动，索引减小
                predictedIndex = currentRealIndex - 1;
            } else { // 向左滑动，索引增加
                predictedIndex = currentRealIndex + 1;
            }
            
            // 确保索引在有效范围内
            predictedIndex = Math.max(0, Math.min(predictedIndex, childrenLength.value - 1));
            
            console.log('当前索引:', currentRealIndex, '预测索引:', predictedIndex);
            
            // 计算目标偏移量 - 确保精确定位到卡片位置
            const targetOffset = -(predictedIndex + patchElmNumShared.value) * step.value;
            
            console.log('目标索引:', predictedIndex, '目标偏移量:', targetOffset);
            
            // 使用withTiming直接滑动到目标位置，根据速度动态计算动画时长
            const distance = Math.abs(targetOffset - offset.value);
            
            // 限制速度因子在合理范围内，确保动画不会太快
            // 速度越快，动画时长越短，但有最小限制
            const velocityFactor = Math.min(Math.abs(clampedVelocity) / 1000, 1.2); // 速度因子，最大1.2
            const baseDuration = 300; // 基础动画时长
            const minDuration = 250; // 最小动画时长
            const duration = Math.max(baseDuration / velocityFactor, minDuration); // 确保动画时长不会太短
            
            offset.value = withTiming(targetOffset, {
                duration: duration,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1) // 使用标准的缓动曲线
            }, (finished) => {
                'worklet';
                if (finished) {
                    // 动画结束后，直接更新索引为预测的索引
                    // 由于我们已经精确滑动到了目标位置，不需要再调整位置
                    
                    // 更新当前索引
                    currentIndex.value = predictedIndex;
                    
                    // 恢复循环
                    runOnJS(runOnJSCallback)('resumeLoop');
                }
            })
        }

        const gesturePan = Gesture.Pan()
            .onBegin((e) => {
            'worklet';
            if (!step.value)
                return;
            touchfinish.value = false;
            cancelAnimation(offset);
            runOnJS(runOnJSCallback)('pauseLoop');
            preAbsolutePos.value = e[strAbso];
            moveTranstion.value = e[strAbso];
        })
            .onUpdate((e) => {
            'worklet';
            const moveDistance = e[strAbso] - preAbsolutePos.value;
            if (touchfinish.value || moveDistance === 0)
                return;
            const eventData = {
                translation: moveDistance,
                transdir: moveDistance
            };
            preUpdateTransDir.value = moveDistance;
            // 1. 支持滑动中超出一半更新索引的能力：只更新索引并不会影响onFinalize依据当前offset计算的索引
            const { half } = computeHalf(eventData);
            if (childrenLength.value > 1 && half) {
                const { selectedIndex } = getTargetPosition(eventData);
                currentIndex.value = selectedIndex;
            }
            // 2. 非循环: 处理用户一直拖拽到临界点的场景,如果放到onFinalize无法阻止offset.value更新为越界的值
            if (!circularShared.value) {
                if (canMove(eventData)) {
                    offset.value = moveDistance + offset.value;
                }
                else {
                    const finalOffset = handleResistanceMove(eventData);
                    offset.value = finalOffset;
                }
                preAbsolutePos.value = e[strAbso];
                return;
            }
            // 3. 循环更新: 只有一个元素时可滑动，加入阻力
            if (circularShared.value && childrenLength.value === 1) {
                const finalOffset = handleResistanceMove(eventData);
                offset.value = finalOffset;
                preAbsolutePos.value = e[strAbso];
                return;
            }
            // 4. 循环更新：正常
            const { isBoundary, resetOffset } = reachBoundary(eventData);
            if (childrenLength.value > 1 && isBoundary && circularShared.value) {
                offset.value = resetOffset;
            }
            else {
                offset.value = moveDistance + offset.value;
            }
            preAbsolutePos.value = e[strAbso];
        })
            .onFinalize((e) => {
            'worklet';
            if (touchfinish.value)
                return;
            touchfinish.value = true;
            /**
             * 安卓修正
             * 问题：部分安卓机型onFinalize中拿到的absoluteX 有问题
             * 案例：比如手指从右向左滑的时候，onUpdate拿到的是241.64346313476562， 而onFinalize中拿到的是241.81817626953125，理论上onFinalize中应该比onUpdate小才对吧
             * 解决方式：修正
            */
            // 触发过onUpdate正常情况下e[strAbso] - preAbsolutePos.value=0; 未触发过onUpdate的情况下e[strAbso] - preAbsolutePos.value 不为0
            const moveDistance = e[strAbso] - preAbsolutePos.value;
            const eventData = {
                translation: moveDistance,
                transdir: Math.abs(moveDistance) > 1 ? moveDistance : preUpdateTransDir.value
            };
            // 1. 只有一个元素：循环 和 非循环状态，都走回弹效果
            if (childrenLength.value === 1) {
                offset.value = withTiming(0, {
                    duration: easeDuration,
                    easing: easeMap[easeingFunc]
                });
                return;
            }
            // 2.非循环状态不可移动态：最后一个元素 和 第一个元素
            // 非循环支持最后元素可滑动能力后，向左快速移动未超过最大可移动范围一半，因为offset为正值，向左滑动handleBack，默认向上取整
            // 但是在offset大于0时，取0。[-100, 0](back取0), [0, 100](back取1)， 所以handleLongPress里的处理逻辑需要兼容支持，因此这里直接单独处理，不耦合下方公共的判断逻辑。
            if (!circularShared.value && !canMove(eventData)) {
                if (eventData.transdir < 0) {
                    handleBack(eventData);
                }
                else {
                    handleEnd(eventData);
                }
                return;
            }
            // 3. 非循环状态可移动态、循环状态, 正常逻辑处理
            const velocity = e[strVelocity];
            if (Math.abs(velocity) < longPressRatio) {
                handleLongPress(eventData);
            } 
            else if (Math.abs(velocity) > 200) {
                // 速度较大，使用惯性滑动
                console.log('速度较大，使用惯性滑动 trigger ____')
                handleInertialSlide(eventData, velocity);
            }
            else {
                handleEnd(eventData);
            }
        })
            .withRef(swiperGestureRef);
        // swiper横向,当y轴滑动5像素手势失效；swiper纵向只响应swiper的滑动事件
        if (dir === 'x') {
            gesturePan.activeOffsetX([-2, 2]).failOffsetY([-5, 5]);
        }
        else {
            gesturePan.activeOffsetY([-2, 2]).failOffsetX([-5, 5]);
        }
        // 手势协同2.0
        if (simultaneousHandlers && simultaneousHandlers.length) {
            gesturePan.simultaneousWithExternalGesture(...simultaneousHandlers);
        }
        if (waitForHandlers && waitForHandlers.length) {
            gesturePan.requireExternalGestureToFail(...waitForHandlers);
        }
        return {
            gestureHandler: gesturePan
        };
    }, [gestureSwitch.current]);
    const animatedStyles = useAnimatedStyle(() => {
        if (dir === 'x') {
            return { transform: [{ translateX: offset.value }], opacity: step.value > 0 ? 1 : 0 };
        }
        else {
            return { transform: [{ translateY: offset.value }], opacity: step.value > 0 ? 1 : 0 };
        }
    });
    let finalComponent;
    const arrPages = renderItems();
    const mergeProps = Object.assign({
        style: [normalStyle, layoutStyle, styles.swiper]
    }, layoutProps, innerProps);
    const animateComponent = createElement(Animated.View, {
        style: [{ flexDirection: dir === 'x' ? 'row' : 'column', width: '100%', height: '100%' }, animatedStyles]
    }, wrapChildren({
        children: arrPages
    }, {
        hasVarDec,
        varContext: varContextRef.current,
        textStyle,
        textProps
    }));
    const renderChildrens = showPagination ? [animateComponent, renderPagination()] : animateComponent;
    finalComponent = createElement(View, mergeProps, renderChildrens);
    if (!disableGesture) {
        finalComponent = createElement(GestureDetector, {
            gesture: gestureHandler
        }, finalComponent);
    }
    if (hasPositionFixed) {
        finalComponent = createElement(Portal, null, finalComponent);
    }
    return finalComponent;
});
SwiperWrapper.displayName = 'MpxSwiperWrapper';
export default SwiperWrapper;
