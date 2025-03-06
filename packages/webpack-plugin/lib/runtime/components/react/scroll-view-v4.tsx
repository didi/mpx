/**
 * ✔ scroll-x
 * ✔ scroll-y
 * ✔ upper-threshold
 * ✔ lower-threshold
 * ✔ scroll-top
 * ✔ scroll-left
 * ✔ scroll-into-view
 * ✔ scroll-with-animation
 * ✔ enable-back-to-top
 * ✘ enable-passive
 * ✔ refresher-enabled
 * ✘ refresher-threshold
 * ✔ refresher-default-style(仅 android 支持)
 * ✔ refresher-background(仅 android 支持)
 * ✔ refresher-triggered
 * ✘ enable-flex(scroll-x，rn 默认支持)
 * ✘ scroll-anchoring
 * ✔ paging-enabled
 * ✘ using-sticky
 * ✔ show-scrollbar
 * ✘ fast-deceleration
 * ✔ binddragstart
 * ✔ binddragging
 * ✔ binddragend
 * ✔ bindrefresherrefresh
 * ✘ bindrefresherpulling
 * ✘ bindrefresherrestore
 * ✘ bindrefresherabort
 * ✔ bindscrolltoupper
 * ✔ bindscrolltolower
 * ✔ bindscroll
 */
import { ScrollView, RefreshControl, Gesture, GestureDetector } from 'react-native-gesture-handler'
import { Animated, View, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent, ViewStyle } from 'react-native'
import { isValidElement, Children, JSX, ReactNode, RefObject, useRef, useState, useEffect, forwardRef, useContext, createElement, useMemo } from 'react'
import { useAnimatedRef, useSharedValue } from 'react-native-reanimated'
import { warn } from '@mpxjs/utils'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { splitProps, splitStyle, useTransformStyle, useLayout, wrapChildren, extendObject, flatGesture, GestureHandler } from './utils'
import { IntersectionObserverContext, ScrollViewContext } from './context'
import MpxRefreshControl from './mpx-refresh-control'

interface ScrollViewProps {
  children?: ReactNode;
  enhanced?: boolean;
  bounces?: boolean;
  style?: ViewStyle;
  'scroll-x'?: boolean;
  'scroll-y'?: boolean;
  'enable-back-to-top'?: boolean;
  'show-scrollbar'?: boolean;
  'paging-enabled'?: boolean;
  'upper-threshold'?: number;
  'lower-threshold'?: number;
  'scroll-with-animation'?: boolean;
  'refresher-triggered'?: boolean;
  'refresher-enabled'?: boolean;
  'refresher-default-style'?: 'black' | 'white' | 'none';
  'refresher-background'?: string;
  'scroll-top'?: number;
  'scroll-left'?: number;
  'enable-offset'?: boolean;
  'scroll-into-view'?: string;
  'enable-trigger-intersection-observer'?: boolean;
  'enable-var'?: boolean;
  'external-var-context'?: Record<string, any>;
  'parent-font-size'?: number;
  'parent-width'?: number;
  'parent-height'?: number;
  'wait-for'?: Array<GestureHandler>;
  'simultaneous-handlers'?: Array<GestureHandler>;
  bindscrolltoupper?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  bindscrolltolower?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  bindscroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  bindrefresherrefresh?: (event: NativeSyntheticEvent<unknown>) => void;
  binddragstart?: (event: NativeSyntheticEvent<DragEvent>) => void;
  binddragging?: (event: NativeSyntheticEvent<DragEvent>) => void;
  binddragend?: (event: NativeSyntheticEvent<DragEvent>) => void;
  bindtouchstart?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  bindtouchmove?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  bindtouchend?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  bindscrollend?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  __selectRef?: (selector: string, nodeType: 'node' | 'component', all?: boolean) => HandlerRef<any, any>
}
type ScrollAdditionalProps = {
  pinchGestureEnabled: boolean;
  horizontal: boolean;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onContentSizeChange: (width: number, height: number) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  scrollEventThrottle: number;
  scrollsToTop: boolean;
  showsHorizontalScrollIndicator: boolean;
  showsVerticalScrollIndicator: boolean;
  scrollEnabled: boolean;
  ref: RefObject<ScrollView>;
  bounces?: boolean;
  pagingEnabled?: boolean;
  style?: ViewStyle;
  bindtouchstart?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  bindtouchmove?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  bindtouchend?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  onScrollBeginDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollEndDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onMomentumScrollEnd?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};
const _ScrollView = forwardRef<HandlerRef<ScrollView & View, ScrollViewProps>, ScrollViewProps>((scrollViewProps: ScrollViewProps = {}, ref): JSX.Element => {
  const { textProps, innerProps: props = {} } = splitProps(scrollViewProps)
  const {
    enhanced = false,
    bounces = true,
    style = {},
    binddragstart,
    binddragging,
    binddragend,
    bindtouchstart,
    bindtouchmove,
    bindtouchend,
    'scroll-x': scrollX = false,
    'scroll-y': scrollY = false,
    'enable-back-to-top': enableBackToTop = false,
    'enable-trigger-intersection-observer': enableTriggerIntersectionObserver = false,
    'paging-enabled': pagingEnabled = false,
    'upper-threshold': upperThreshold = 50,
    'lower-threshold': lowerThreshold = 50,
    'scroll-with-animation': scrollWithAnimation,
    'refresher-enabled': refresherEnabled,
    'refresher-default-style': refresherDefaultStyle,
    'refresher-background': refresherBackground,
    'show-scrollbar': showScrollbar = true,
    'scroll-into-view': scrollIntoView = '',
    'scroll-top': scrollTop = 0,
    'scroll-left': scrollLeft = 0,
    'refresher-triggered': refresherTriggered,
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight,
    'simultaneous-handlers': originSimultaneousHandlers,
    'wait-for': waitFor,
    __selectRef
  } = props

  const simultaneousHandlers = flatGesture(originSimultaneousHandlers)
  const waitForHandlers = flatGesture(waitFor)

  const contentTranslateY = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(0)).current

  const snapScrollTop = useRef(0)
  const snapScrollLeft = useRef(0)

  const scrollOptions = useRef({
    contentLength: 0,
    offset: 0,
    scrollLeft: 0,
    scrollTop: 0,
    visibleLength: 0
  })

  const scrollEventThrottle = 50
  const hasCallScrollToUpper = useRef(true)
  const hasCallScrollToLower = useRef(false)
  const initialTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intersectionObservers = useContext(IntersectionObserverContext)

  const firstScrollIntoViewChange = useRef<boolean>(false)

  const {
    normalStyle,
    hasVarDec,
    varContextRef,
    hasSelfPercent,
    setWidth,
    setHeight
  } = useTransformStyle(style, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight })

  const { textStyle, innerStyle = {} } = splitStyle(normalStyle)

  const scrollViewRef = useAnimatedRef<ScrollView>()
  useNodesRef(props, ref, scrollViewRef, {
    style: normalStyle,
    scrollOffset: scrollOptions,
    node: {
      scrollEnabled: scrollX || scrollY,
      bounces,
      showScrollbar,
      pagingEnabled,
      fastDeceleration: false,
      decelerationDisabled: false,
      scrollTo: scrollToOffset
    },
    gestureRef: scrollViewRef
  })

  const contextValue = useMemo(() => {
    return {
      gestureRef: scrollViewRef
    }
  }, [])

  const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: scrollViewRef, onLayout })

  if (scrollX && scrollY) {
    warn('scroll-x and scroll-y cannot be set to true at the same time, Mpx will use the value of scroll-y as the criterion')
  }
  useEffect(() => {
    if (
      snapScrollTop.current !== scrollTop || snapScrollLeft.current !== scrollLeft
    ) {
      initialTimeout.current = setTimeout(() => {
        scrollToOffset(scrollLeft, scrollTop)
      }, 0)

      return () => {
        initialTimeout.current && clearTimeout(initialTimeout.current)
      }
    }
  }, [scrollTop, scrollLeft])

  useEffect(() => {
    if (scrollIntoView && __selectRef) {
      if (!firstScrollIntoViewChange.current) {
        setTimeout(handleScrollIntoView)
      } else {
        handleScrollIntoView()
      }
    }
    firstScrollIntoViewChange.current = true
  }, [scrollIntoView])

  function handleScrollIntoView () {
    const refs = __selectRef!(`#${scrollIntoView}`, 'node')
    if (!refs) return
    const { nodeRef } = refs.getNodeInstance()
    nodeRef.current?.measureLayout(
      scrollViewRef.current,
      (left: number, top:number) => {
        scrollToOffset(left, top)
      }
    )
  }

  function selectLength (size: { height: number; width: number }) {
    return !scrollX ? size.height : size.width
  }

  function selectOffset (position: { x: number; y: number }) {
    return !scrollX ? position.y : position.x
  }

  function onStartReached (e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { bindscrolltoupper } = props
    const { offset } = scrollOptions.current
    if (bindscrolltoupper && (offset <= upperThreshold)) {
      if (!hasCallScrollToUpper.current) {
        bindscrolltoupper(
          getCustomEvent('scrolltoupper', e, {
            detail: {
              direction: scrollX ? 'left' : 'top'
            },
            layoutRef
          }, props)
        )
        hasCallScrollToUpper.current = true
      }
    } else {
      hasCallScrollToUpper.current = false
    }
  }

  function onEndReached (e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { bindscrolltolower } = props
    const { contentLength, visibleLength, offset } = scrollOptions.current
    const distanceFromEnd = contentLength - visibleLength - offset
    if (bindscrolltolower && (distanceFromEnd < lowerThreshold)) {
      if (!hasCallScrollToLower.current) {
        hasCallScrollToLower.current = true
        bindscrolltolower(
          getCustomEvent('scrolltolower', e, {
            detail: {
              direction: scrollX ? 'right' : 'botttom'
            },
            layoutRef
          }, props)
        )
      }
    } else {
      hasCallScrollToLower.current = false
    }
  }

  function onContentSizeChange (width: number, height: number) {
    scrollOptions.current.contentLength = selectLength({ height, width })
  }

  function onLayout (e: LayoutChangeEvent) {
    const layout = e.nativeEvent.layout || {}
    scrollOptions.current.visibleLength = selectLength(layout)
  }

  function updateScrollOptions (e: NativeSyntheticEvent<NativeScrollEvent>, position: Record<string, any>) {
    const visibleLength = selectLength(e.nativeEvent.layoutMeasurement)
    const contentLength = selectLength(e.nativeEvent.contentSize)
    const offset = selectOffset(e.nativeEvent.contentOffset)
    extendObject(scrollOptions.current, {
      contentLength,
      offset,
      scrollLeft: position.scrollLeft,
      scrollTop: position.scrollTop,
      visibleLength
    })
  }

  function onScroll (e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { bindscroll } = props
    const { x: scrollLeft, y: scrollTop } = e.nativeEvent.contentOffset
    const { width: scrollWidth, height: scrollHeight } = e.nativeEvent.contentSize
    bindscroll &&
      bindscroll(
        getCustomEvent('scroll', e, {
          detail: {
            scrollLeft,
            scrollTop,
            scrollHeight,
            scrollWidth,
            deltaX: scrollLeft - scrollOptions.current.scrollLeft,
            deltaY: scrollTop - scrollOptions.current.scrollTop
          },
          layoutRef
        }, props)
      )
    updateScrollOptions(e, { scrollLeft, scrollTop })
    onStartReached(e)
    onEndReached(e)
    updateIntersection()
  }

  function onScrollEnd (e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { bindscrollend } = props
    const { x: scrollLeft, y: scrollTop } = e.nativeEvent.contentOffset
    const { width: scrollWidth, height: scrollHeight } = e.nativeEvent.contentSize
    bindscrollend &&
      bindscrollend(
        getCustomEvent('scrollend', e, {
          detail: {
            scrollLeft,
            scrollTop,
            scrollHeight,
            scrollWidth
          },
          layoutRef
        }, props)
      )
    updateScrollOptions(e, { scrollLeft, scrollTop })
    onStartReached(e)
    onEndReached(e)
    updateIntersection()
  }
  function updateIntersection () {
    if (enableTriggerIntersectionObserver && intersectionObservers) {
      for (const key in intersectionObservers) {
        intersectionObservers[key].throttleMeasure()
      }
    }
  }
  function scrollToOffset (x = 0, y = 0) {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x, y, animated: !!scrollWithAnimation })
      scrollOptions.current.scrollLeft = x
      scrollOptions.current.scrollTop = y
      snapScrollLeft.current = x
      snapScrollTop.current = y
    }
  }

  function onScrollTouchStart (e: NativeSyntheticEvent<TouchEvent>) {
    const { bindtouchstart } = props
    bindtouchstart && bindtouchstart(e)
    if (enhanced) {
      binddragstart &&
        binddragstart(
          getCustomEvent('dragstart', e, {
            detail: {
              scrollLeft: scrollOptions.current.scrollLeft,
              scrollTop: scrollOptions.current.scrollTop
            },
            layoutRef
          }, props)
        )
    }
  }
  function onScrollTouchMove (e: NativeSyntheticEvent<TouchEvent>) {
    bindtouchmove && bindtouchmove(e)
    if (enhanced) {
      binddragging &&
        binddragging(
          getCustomEvent('dragging', e, {
            detail: {
              scrollLeft: scrollOptions.current.scrollLeft || 0,
              scrollTop: scrollOptions.current.scrollTop || 0
            },
            layoutRef
          }, props)
        )
    }
  }

  function onScrollTouchEnd (e: NativeSyntheticEvent<TouchEvent>) {
    bindtouchend && bindtouchend(e)
    if (enhanced) {
      binddragend &&
        binddragend(
          getCustomEvent('dragend', e, {
            detail: {
              scrollLeft: scrollOptions.current.scrollLeft || 0,
              scrollTop: scrollOptions.current.scrollTop || 0
            },
            layoutRef
          }, props)
        )
    }
  }

  function onScrollDrag (e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { x: scrollLeft, y: scrollTop } = e.nativeEvent.contentOffset
    updateScrollOptions(e, { scrollLeft, scrollTop })
    updateIntersection()
  }

  function onScrollDragStart (e: NativeSyntheticEvent<NativeScrollEvent>) {
    hasCallScrollToLower.current = false
    hasCallScrollToUpper.current = false
    onScrollDrag(e)
  }

  const isAtTop = useRef(true)
  const [refreshing, setRefreshing] = useState(false)
  const scrollOffset = useRef(new Animated.Value(0)).current

  // 监听滚动位置
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollOffset } } }],
    {
      useNativeDriver: true,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        isAtTop.current = event.nativeEvent.contentOffset.y <= 0
        onScroll(event)
      }
    }
  )

  // 处理刷新
  const onRefresh = () => {
    setRefreshing(true)
    const { bindrefresherrefresh } = props
    bindrefresherrefresh &&
      bindrefresherrefresh(
        getCustomEvent('refresherrefresh', {}, { layoutRef }, props)
      )
  }

  // 处理下拉刷新的手势
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // 只有在顶部才能下拉
      if (isAtTop.current && event.translationY > 0 && !refreshing) {
        // 阻尼效果
        const dampedTranslation = Math.min(event.translationY * 0.6, 120)
        // 直接设置 Animated.Value
        translateY.setValue(dampedTranslation)
      }
    })
    .onEnd(() => {
      const currentValue = translateY.__getValue() // 获取当前值

      if (currentValue > 80 && !refreshing) {
        // 触发刷新 - 使用原生Animated API
        Animated.timing(translateY, {
          toValue: 60,
          duration: 300,
          useNativeDriver: true
        }).start()
        onRefresh()
      } else if (!refreshing) {
        // 回弹 - 使用原生Animated API
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }).start()
      }
    })
    .runOnJS(true)
    .simultaneousWithExternalGesture(scrollViewRef)

  const scrollAdditionalProps: ScrollAdditionalProps = extendObject(
    {
      style: extendObject({}, innerStyle, layoutStyle),
      pinchGestureEnabled: false,
      alwaysBounceVertical: false,
      alwaysBounceHorizontal: false,
      horizontal: scrollX && !scrollY,
      scrollEventThrottle: scrollEventThrottle,
      scrollsToTop: enableBackToTop,
      showsHorizontalScrollIndicator: scrollX && showScrollbar,
      showsVerticalScrollIndicator: scrollY && showScrollbar,
      scrollEnabled: scrollX || scrollY,
      ref: scrollViewRef,
      onScroll: onScroll,
      onContentSizeChange: onContentSizeChange,
      bindtouchstart: ((enhanced && binddragstart) || bindtouchstart) && onScrollTouchStart,
      bindtouchmove: ((enhanced && binddragging) || bindtouchmove) && onScrollTouchMove,
      bindtouchend: ((enhanced && binddragend) || bindtouchend) && onScrollTouchEnd,
      onScrollBeginDrag: onScrollDragStart,
      onScrollEndDrag: onScrollDrag,
      onMomentumScrollEnd: onScrollEnd
    },
    (simultaneousHandlers ? { simultaneousHandlers } : {}),
    (waitForHandlers ? { waitFor: waitForHandlers } : {}),
    layoutProps
  )

  if (enhanced) {
    Object.assign(scrollAdditionalProps, {
      bounces,
      pagingEnabled
    })
  }

  const getRefresherContent = (children: ReactNode) => {
    let refresherContent = null
    const otherContent: ReactNode[] = []

    Children.forEach(children, (child) => {
      if (isValidElement(child) && child.props.slot === 'refresher') {
        refresherContent = child
      } else {
        otherContent.push(child)
      }
    })

    return {
      refresherContent,
      otherContent
    }
  }

  const { refresherContent, otherContent } = getRefresherContent(props.children)

  const innerProps = useInnerProps(props, scrollAdditionalProps, [
    'id',
    'scroll-x',
    'scroll-y',
    'enable-back-to-top',
    'enable-trigger-intersection-observer',
    'paging-enabled',
    'show-scrollbar',
    'upper-threshold',
    'lower-threshold',
    'scroll-top',
    'scroll-left',
    'scroll-with-animation',
    'refresher-triggered',
    'refresher-enabled',
    'refresher-default-style',
    'refresher-background',
    'children',
    'enhanced',
    'binddragstart',
    'binddragging',
    'binddragend',
    'bindscroll',
    'bindscrolltoupper',
    'bindscrolltolower',
    'bindrefresherrefresh'
  ], { layoutRef })

  // 内容区域的动画样式 - 只有内容区域需要下移
  const limitedTranslateY = translateY.interpolate({
    inputRange: [0, 60, 120],
    outputRange: [0, 60, 60], // 超过60后保持60的值
    extrapolate: 'clamp'
  })

  // 刷新控件的动画样式
  const refresherAnimatedStyle = {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -60, // 初始隐藏在顶部
    transform: [{ translateY: limitedTranslateY }], // 使用派生的动画值
    backgroundColor: props.refresherBackground || '#ffffff'
  }

  // 创建常规样式对象
  const contentAnimatedStyle = {
    transform: [{ translateY: limitedTranslateY }]
  }

  useEffect(() => {
    if (refresherTriggered !== undefined) {
      setRefreshing(!!refresherTriggered)

      if (refresherTriggered) {
        Animated.timing(translateY, {
          toValue: 60,
          duration: 300,
          useNativeDriver: true // 启用原生驱动
        }).start()
      } else {
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true // 启用原生驱动
        }).start()
      }
    }
  }, [refresherTriggered])
  // 刷新控件样式
  const refresherStyle = {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -60, // 初始隐藏在上方
    overflow: 'hidden'
  }
  const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView)

  return (
   <GestureDetector gesture={panGesture}>
      <View style={{ flex: 1, overflow: 'hidden' }}>
        {/* 整个内容一起移动 */}
          <AnimatedScrollView
            {...innerProps}
            scrollEnabled={!refreshing}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            simultaneousHandlers={panGesture}
          >
            {/* 刷新控件 - 有独立的动画 */}
          <Animated.View style={refresherAnimatedStyle}>
            {refresherContent }
          </Animated.View>

          {/* 内容区域 - 有独立的动画 */}
          <Animated.View style={contentAnimatedStyle}>
            {createElement(ScrollViewContext.Provider,
              { value: contextValue },
              wrapChildren(
                { ...props, children: otherContent },
                {
                  hasVarDec,
                  varContext: varContextRef.current,
                  textStyle,
                  textProps
                }
              )
            )}
          </Animated.View>
          </AnimatedScrollView>
      </View>
    </GestureDetector>
  )
})

_ScrollView.displayName = 'MpxScrollView'

export default _ScrollView
