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
 * ✔ refresher-threshold(仅自定义下拉节点样式支持)
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
import { View, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent, ViewStyle, Animated as RNAnimated } from 'react-native'
import { isValidElement, Children, JSX, ReactNode, RefObject, useRef, useState, useEffect, forwardRef, useContext, useMemo, createElement } from 'react'
import Animated, { useAnimatedRef, useSharedValue, withTiming, useAnimatedStyle, runOnJS } from 'react-native-reanimated'
import { warn, hasOwn } from '@mpxjs/utils'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { splitProps, splitStyle, useTransformStyle, useLayout, wrapChildren, extendObject, flatGesture, GestureHandler, HIDDEN_STYLE } from './utils'
import { IntersectionObserverContext, ScrollViewContext } from './context'
import Portal from './mpx-portal'

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
  'refresher-threshold'?: number;
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
  'enable-sticky'?: boolean;
  'wait-for'?: Array<GestureHandler>;
  'simultaneous-handlers'?: Array<GestureHandler>;
  'scroll-event-throttle'?:number;
  'scroll-into-view-offset'?: number;
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
  pinchGestureEnabled: boolean
  horizontal: boolean
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onContentSizeChange: (width: number, height: number) => void
  onLayout?: (event: LayoutChangeEvent) => void
  scrollsToTop: boolean
  showsHorizontalScrollIndicator: boolean
  showsVerticalScrollIndicator: boolean
  scrollEnabled: boolean
  ref: RefObject<ScrollView>
  bounces?: boolean
  pagingEnabled?: boolean
  style?: ViewStyle
  bindtouchstart?: (event: NativeSyntheticEvent<TouchEvent>) => void
  bindtouchmove?: (event: NativeSyntheticEvent<TouchEvent>) => void
  bindtouchend?: (event: NativeSyntheticEvent<TouchEvent>) => void
  onScrollBeginDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollEndDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onMomentumScrollEnd?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
}

const AnimatedScrollView = RNAnimated.createAnimatedComponent(ScrollView) as React.ComponentType<any>

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
    'scroll-with-animation': scrollWithAnimation = false,
    'refresher-enabled': refresherEnabled,
    'refresher-default-style': refresherDefaultStyle,
    'refresher-background': refresherBackground,
    'refresher-threshold': refresherThreshold = 45,
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
    'enable-sticky': enableSticky,
    'scroll-event-throttle': scrollEventThrottle = 0,
    'scroll-into-view-offset': scrollIntoViewOffset = 0,
    __selectRef
  } = props

  const scrollOffset = useRef(new RNAnimated.Value(0)).current

  const simultaneousHandlers = flatGesture(originSimultaneousHandlers)
  const waitForHandlers = flatGesture(waitFor)

  const snapScrollTop = useRef(0)
  const snapScrollLeft = useRef(0)

  const [refreshing, setRefreshing] = useState(false)

  const [enableScroll, setEnableScroll] = useState(true)
  const enableScrollValue = useSharedValue(true)

  const [scrollBounces, setScrollBounces] = useState(false)
  const bouncesValue = useSharedValue(!!false)

  const translateY = useSharedValue(0)
  const isAtTop = useSharedValue(true)
  const refresherHeight = useSharedValue(0)

  const scrollOptions = useRef({
    contentLength: 0,
    offset: 0,
    scrollLeft: 0,
    scrollTop: 0,
    visibleLength: 0
  })

  const hasCallScrollToUpper = useRef(true)
  const hasCallScrollToLower = useRef(false)
  const initialTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intersectionObservers = useContext(IntersectionObserverContext)

  const firstScrollIntoViewChange = useRef<boolean>(true)

  const refreshColor = {
    black: ['#000'],
    white: ['#fff']
  }

  const isContentSizeChange = useRef(false)

  const { refresherContent, otherContent } = getRefresherContent(props.children)
  const hasRefresher = refresherContent && refresherEnabled

  const {
    normalStyle,
    hasVarDec,
    varContextRef,
    hasSelfPercent,
    hasPositionFixed,
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
      scrollTo,
      scrollIntoView: handleScrollIntoView
    },
    gestureRef: scrollViewRef
  })

  const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: scrollViewRef, onLayout })

  const contextValue = useMemo(() => {
    return {
      gestureRef: scrollViewRef,
      scrollOffset
    }
  }, [])

  const hasRefresherLayoutRef = useRef(false)

  // layout 完成前先隐藏，避免安卓闪烁问题
  const refresherLayoutStyle = useMemo(() => { return !hasRefresherLayoutRef.current ? HIDDEN_STYLE : {} }, [hasRefresherLayoutRef.current])
  const lastOffset = useRef(0)

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
      if (firstScrollIntoViewChange.current) {
        setTimeout(() => {
          handleScrollIntoView(scrollIntoView, { offset: scrollIntoViewOffset, animated: scrollWithAnimation })
        })
      } else {
        handleScrollIntoView(scrollIntoView, { offset: scrollIntoViewOffset, animated: scrollWithAnimation })
      }
    }
    firstScrollIntoViewChange.current = false
  }, [scrollIntoView])

  useEffect(() => {
    if (refresherEnabled) {
      setRefreshing(!!refresherTriggered)

      if (!refresherContent) return

      if (refresherTriggered) {
        translateY.value = withTiming(refresherHeight.value)
        resetScrollState(false)
      } else {
        translateY.value = withTiming(0)
        resetScrollState(true)
      }
    }
  }, [refresherTriggered])

  function scrollTo ({ top = 0, left = 0, animated = false }: { top?: number; left?: number; animated?: boolean }) {
    scrollToOffset(left, top, animated)
  }

  function handleScrollIntoView (selector = '', { offset = 0, animated = true } = {}) {
    const refs = __selectRef!(`#${selector}`, 'node')
    if (!refs) return
    const { nodeRef } = refs.getNodeInstance()
    nodeRef.current?.measureLayout(
      scrollViewRef.current,
      (left: number, top: number) => {
        const adjustedLeft = scrollX ? left + offset : left
        const adjustedTop = scrollY ? top + offset : top
        scrollToOffset(adjustedLeft, adjustedTop, animated)
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
    const isScrollingBackward = offset < lastOffset.current
    if (bindscrolltoupper && (offset <= upperThreshold) && isScrollingBackward) {
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
    const isScrollingForward = offset > lastOffset.current

    if (bindscrolltolower && (distanceFromEnd < lowerThreshold) && isScrollingForward) {
      if (!hasCallScrollToLower.current) {
        hasCallScrollToLower.current = true
        bindscrolltolower(
          getCustomEvent('scrolltolower', e, {
            detail: {
              direction: scrollX ? 'right' : 'bottom'
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
    isContentSizeChange.current = true
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
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent
    const { x: scrollLeft, y: scrollTop } = contentOffset
    const { width: scrollWidth, height: scrollHeight } = contentSize
    isAtTop.value = scrollTop <= 0
    bindscroll &&
      bindscroll(
        getCustomEvent('scroll', e, {
          detail: {
            scrollLeft,
            scrollTop,
            scrollHeight,
            scrollWidth,
            deltaX: scrollLeft - scrollOptions.current.scrollLeft,
            deltaY: scrollTop - scrollOptions.current.scrollTop,
            layoutMeasurement
          },
          layoutRef
        }, props)
      )
    updateScrollOptions(e, { scrollLeft, scrollTop })
    onStartReached(e)
    onEndReached(e)
    updateIntersection()
    // 在 onStartReached、onEndReached 执行完后更新 lastOffset
    lastOffset.current = scrollOptions.current.offset
  }

  function onScrollEnd (e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { bindscrollend } = props
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent
    const { x: scrollLeft, y: scrollTop } = contentOffset
    const { width: scrollWidth, height: scrollHeight } = contentSize
    isAtTop.value = scrollTop <= 0
    bindscrollend &&
      bindscrollend(
        getCustomEvent('scrollend', e, {
          detail: {
            scrollLeft,
            scrollTop,
            scrollHeight,
            scrollWidth,
            layoutMeasurement
          },
          layoutRef
        }, props)
      )
    updateScrollOptions(e, { scrollLeft, scrollTop })
    onStartReached(e)
    onEndReached(e)
    updateIntersection()
    lastOffset.current = scrollOptions.current.offset
  }
  function updateIntersection () {
    if (enableTriggerIntersectionObserver && intersectionObservers) {
      for (const key in intersectionObservers) {
        intersectionObservers[key].throttleMeasure()
      }
    }
  }
  function scrollToOffset (x = 0, y = 0, animated = scrollWithAnimation) {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x, y, animated })
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

  const scrollHandler = RNAnimated.event(
    [{ nativeEvent: { contentOffset: { y: scrollOffset } } }],
    {
      useNativeDriver: true,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const y = event.nativeEvent.contentOffset.y || 0
        // 内容高度变化时，Animated.event 的映射可能会有不生效的场景，只有在 listener 中获取到正确的 y 值再去修正
        if (isContentSizeChange.current) {
          // 鸿蒙中通过scrollOffset.__getValue获取值一直等于event.nativeEvent.contentOffset.y
          if (__mpx_mode__ === 'harmony') {
            scrollOffset.setValue(y)
            setTimeout(() => {
              isContentSizeChange.current = false
            })
          } else {
            if (y !== (scrollOffset as any).__getValue()) {
              scrollOffset.setValue(y)
              setTimeout(() => {
                isContentSizeChange.current = false
              })
            }
          }
        }
        onScroll(event)
      }
    }
  )

  function onScrollDragStart (e: NativeSyntheticEvent<NativeScrollEvent>) {
    hasCallScrollToLower.current = false
    hasCallScrollToUpper.current = false
    onScrollDrag(e)
  }

  // 处理刷新
  function onRefresh () {
    if (hasRefresher && refresherTriggered === undefined) {
      // 处理使用了自定义刷新组件，又没设置 refresherTriggered 的情况
      setRefreshing(true)
      setTimeout(() => {
        setRefreshing(false)
        translateY.value = withTiming(0)
        if (!enableScrollValue.value) {
          resetScrollState(true)
        }
      }, 500)
    }
    const { bindrefresherrefresh } = props
    bindrefresherrefresh &&
      bindrefresherrefresh(
        getCustomEvent('refresherrefresh', {}, { layoutRef }, props)
      )
  }

  function getRefresherContent (children: ReactNode) {
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

  // 刷新控件的动画样式
  const refresherAnimatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: 0,
      right: 0,
      top: -refresherHeight.value, // 初始隐藏在顶部
      transform: [{ translateY: Math.min(translateY.value, refresherHeight.value) }],
      backgroundColor: refresherBackground || 'transparent'
    }
  })

  // 内容区域的动画样式 - 只有内容区域需要下移
  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{
        translateY: translateY.value > refresherHeight.value
          ? refresherHeight.value
          : translateY.value
      }]
    }
  })

  function onRefresherLayout (e: LayoutChangeEvent) {
    const { height } = e.nativeEvent.layout
    refresherHeight.value = height
    hasRefresherLayoutRef.current = true
  }

  function updateScrollState (newValue: boolean) {
    'worklet'
    if (enableScrollValue.value !== newValue) {
      enableScrollValue.value = newValue
      runOnJS(setEnableScroll)(newValue)
    }
  }

  const resetScrollState = (value: boolean) => {
    enableScrollValue.value = value
    setEnableScroll(value)
  }

  function updateBouncesState (newValue: boolean) {
    'worklet'
    if (bouncesValue.value !== newValue) {
      bouncesValue.value = newValue
      runOnJS(setScrollBounces)(newValue)
    }
  }

  // 处理下拉刷新的手势
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      'worklet'
      if (enhanced && !!bounces) {
        if (event.translationY > 0 && bouncesValue.value) {
          updateBouncesState(false)
        } else if ((event.translationY < 0) && !bouncesValue.value) {
          updateBouncesState(true)
        }
      }

      if (translateY.value <= 0 && event.translationY < 0) {
        // 滑动到顶再向上开启滚动
        updateScrollState(true)
      } else if (event.translationY > 0 && isAtTop.value) {
        // 滚动到顶再向下禁止滚动
        updateScrollState(false)
      }
      // 禁止滚动后切换为滑动
      if (!enableScrollValue.value && isAtTop.value) {
        if (refreshing) {
          // 从完全展开状态(refresherHeight.value)开始计算偏移
          translateY.value = Math.max(
            0,
            Math.min(
              refresherHeight.value,
              refresherHeight.value + event.translationY
            )
          )
        } else if (event.translationY > 0) {
          // 非刷新状态下的下拉逻辑保持不变
          translateY.value = Math.min(event.translationY * 0.6, refresherHeight.value)
        }
      }
    })
    .onEnd((event) => {
      'worklet'
      if (enableScrollValue.value) return
      if (refreshing) {
        // 刷新状态下，根据滑动距离决定是否隐藏
        // 如果向下滑动没超过 refresherThreshold，就完全隐藏，如果向上滑动完全隐藏
        if ((event.translationY > 0 && translateY.value < refresherThreshold) || event.translationY < 0) {
          translateY.value = withTiming(0)
          updateScrollState(true)
          runOnJS(setRefreshing)(false)
        } else {
          translateY.value = withTiming(refresherHeight.value)
        }
      } else if (event.translationY >= refresherHeight.value) {
        // 触发刷新
        translateY.value = withTiming(refresherHeight.value)
        runOnJS(onRefresh)()
      } else {
        // 回弹
        translateY.value = withTiming(0)
        updateScrollState(true)
        runOnJS(setRefreshing)(false)
      }
    })
    .simultaneousWithExternalGesture(scrollViewRef)

  const scrollAdditionalProps: ScrollAdditionalProps = extendObject(
    {
      style: extendObject(hasOwn(innerStyle, 'flex') || hasOwn(innerStyle, 'flexGrow')
        ? {}
        : {
            flexGrow: 0
          }, innerStyle, layoutStyle),
      pinchGestureEnabled: false,
      alwaysBounceVertical: false,
      alwaysBounceHorizontal: false,
      horizontal: scrollX && !scrollY,
      scrollEventThrottle: scrollEventThrottle,
      scrollsToTop: enableBackToTop,
      showsHorizontalScrollIndicator: scrollX && showScrollbar,
      showsVerticalScrollIndicator: scrollY && showScrollbar,
      scrollEnabled: !enableScroll ? false : !!(scrollX || scrollY),
      bounces: false,
      ref: scrollViewRef,
      onScroll: enableSticky ? scrollHandler : onScroll,
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
      bounces: hasRefresher ? scrollBounces : !!bounces,
      pagingEnabled
    })
  }

  const innerProps = useInnerProps(
    extendObject(
      {},
      props,
      scrollAdditionalProps
    ),
    [
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

  const ScrollViewComponent = enableSticky ? AnimatedScrollView : ScrollView

  const withRefresherScrollView = createElement(
    GestureDetector,
    { gesture: panGesture },
    createElement(
      ScrollViewComponent,
      innerProps,
      createElement(
        Animated.View,
        { style: [refresherAnimatedStyle, refresherLayoutStyle], onLayout: onRefresherLayout },
        refresherContent
      ),
      createElement(
        Animated.View,
        { style: contentAnimatedStyle },
        createElement(
          ScrollViewContext.Provider,
          { value: contextValue },
          wrapChildren(
            extendObject({}, props, { children: otherContent }),
            {
              hasVarDec,
              varContext: varContextRef.current,
              textStyle,
              textProps
            }
          )
        )
      )
    )
  )

  const commonScrollView = createElement(
    ScrollViewComponent,
    extendObject({}, innerProps, {
      refreshControl: refresherEnabled
        ? createElement(RefreshControl, extendObject({
          progressBackgroundColor: refresherBackground,
          refreshing: refreshing,
          onRefresh: onRefresh
        }, refresherDefaultStyle && refresherDefaultStyle !== 'none'
          ? { colors: refreshColor[refresherDefaultStyle] }
          : {}))
        : undefined
    }),
    createElement(ScrollViewContext.Provider, { value: contextValue },
      wrapChildren(props, {
        hasVarDec,
        varContext: varContextRef.current,
        textStyle,
        textProps
      })
    )
  )

  let scrollViewComponent = hasRefresher ? withRefresherScrollView : commonScrollView

  if (hasPositionFixed) {
    scrollViewComponent = createElement(Portal, null, scrollViewComponent)
  }
  return scrollViewComponent
})

_ScrollView.displayName = 'MpxScrollView'

export default _ScrollView
