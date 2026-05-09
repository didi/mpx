/**
 * ✔ show
 * ✔ duration
 * ✔ z-index
 * ✔ overlay
 * ✔ position
 * ✔ round
 * ✔ close-on-slide-down
 * ✔ overlay-style
 * ✔ custom-style
 * ✔ bindbeforeenter
 * ✔ bindenter
 * ✔ bindafterenter
 * ✔ bindbeforeleave
 * ✔ bindleave
 * ✔ bindafterleave
 * ✔ bindclickoverlay
 * ✔ bindclose RN下特有属性，用于同步show状态到父组件
 */
import React, { createElement, forwardRef, useEffect, useRef, useState } from 'react'
import { StyleSheet, BackHandler, TouchableWithoutFeedback, StyleProp, ViewStyle } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, cancelAnimation, runOnJS, WithTimingConfig, Easing, AnimationCallback } from 'react-native-reanimated'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Portal from './mpx-portal/index'
import { usePreventRemove } from '@react-navigation/native'
import { extendObject, useLayout, useNavigation, useRunOnJSCallback } from './utils'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef from './useNodesRef'
import { noop } from '@mpxjs/utils'

type Position = 'top' | 'bottom' | 'right' | 'center';

interface PageContainerProps {
    show: boolean;
    duration?: number;
    'z-index'?: number;
    overlay?: boolean;
    position?: Position;
    round?: boolean;
    'close-on-slide-down'?: boolean;
    'overlay-style'?: StyleProp<ViewStyle>;
    'custom-style'?: StyleProp<ViewStyle>;
    bindbeforeenter?: (event: CustomEvent) => void;
    bindenter?: (event: CustomEvent) => void;
    bindafterenter?: (event: CustomEvent) => void;
    bindbeforeleave?: (event: CustomEvent) => void;
    bindleave?: (event: CustomEvent) => void;
    bindafterleave?: (event: CustomEvent) => void;
    bindclickoverlay?: (event: CustomEvent) => void;

    bindclose: (event: CustomEvent<{ value: boolean}>) => void;
    children: React.ReactNode;
}

function nextTick (cb: () => void) {
  setTimeout(cb, 0)
}

function getInitialTranslate (position: Position) {
  switch (position) {
    case 'top':
      return -100
    case 'bottom':
      return 100
    case 'right':
      return 100
    case 'center':
      return 0
  }
}
function getRoundStyle (position: Position) {
  switch (position) {
    case 'top':
      return {
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20
      }
    case 'bottom':
      return {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20
      }
    default: return {}
  }
}

// 禁用页面返回
function useDisablePageBack (show: boolean, close: () => void) {
  /**
   * 如果当前页面是首页，则需要拦截返回关闭容器的逻辑
   * 如果不是首页，则由RN逻辑完成拦截（usePreventRemove）
   */
  const navigation = useNavigation()!
  // TODO resetRouterStack 可能会导致 isFirstPage 发生变化，需要监听路由变化
  const isFirstPage = navigation.getState().routes.length === 1
  const onBackPressRef = useRef(() => false as boolean)
  onBackPressRef.current = () => {
    if (show) {
      close()
      return true
    }
    return false
  }

  const backHandlerSubscriptionRef = useRef<ReturnType<typeof BackHandler.addEventListener> | null>(null)
  const addBackPressListener = () => {
    backHandlerSubscriptionRef.current = BackHandler.addEventListener('hardwareBackPress', () => onBackPressRef.current())
  }
  const removeBackPressListener = () => {
    backHandlerSubscriptionRef.current?.remove()
    backHandlerSubscriptionRef.current = null
  }

  // 记录组件挂载时的初始 gestureEnabled 值，用于组件销毁时还原
  const originalGestureEnabledRef = useRef<boolean>(
    navigation.getState().routes.at(-1)?.options?.gestureEnabled ?? true
  )

  useEffect(() => {
    if (isFirstPage) {
      if (typeof global.__mpx.config?.rnConfig?.disableSwipeBack === 'function') {
        // DRN 问题，当 resetRouterStack 页面数为1时会关闭 disableSwipeBack，此时需要再次 disableSwipeBack
        global.__mpx.config.rnConfig.disableSwipeBack({ disable: show })
      }

      // 首页的返回事件无法通过usePreventRemove拦截，所以通过监听物理返回事件的方式来拦截
      if (__mpx_mode__ !== 'ios') {
        removeBackPressListener()
        if (show) {
          addBackPressListener()
        }
      }
      return () => {
        removeBackPressListener()
        if (typeof global.__mpx.config?.rnConfig?.disableSwipeBack === 'function') {
          global.__mpx.config.rnConfig.disableSwipeBack({ disable: false })
        }
      }
    } else if (__mpx_mode__ === 'ios' && show) {
      // 原生导航栏部分手势容器无法覆盖到，通过设置 gestureEnabled 来禁止系统手势返回
      navigation.setOptions({ gestureEnabled: false })
      return () => {
        navigation.setOptions({ gestureEnabled: originalGestureEnabledRef.current })
      }
    }
  }, [show])

  // 路由返回拦截
  usePreventRemove(show, () => {
    close()
  })
}

const PageContainer = forwardRef<any, PageContainerProps>((props, ref) => {
  const {
    show,
    duration = 300,
    'z-index': zIndex = 100,
    overlay = true,
    position = 'bottom',
    round = false,
    'close-on-slide-down': closeOnSlideDown = false,
    'overlay-style': overlayStyle,
    'custom-style': customStyle,
    bindclose, // RN下特有属性，用于同步show状态到父组件
    bindbeforeenter,
    bindenter,
    bindafterenter,
    bindbeforeleave,
    bindleave,
    bindafterleave,
    bindclickoverlay,
    children
  } = props

  const isFirstRenderFlag = useRef(true)
  const isFirstRender = isFirstRenderFlag.current
  if (isFirstRenderFlag.current) {
    isFirstRenderFlag.current = false
  }

  const triggerBeforeEnterEvent = () => bindbeforeenter?.(getCustomEvent('beforeenter', {}, {}, props))
  const triggerEnterEvent = () => bindenter?.(getCustomEvent('enter', {}, {}, props))
  const triggerAfterEnterEvent = () => bindafterenter?.(getCustomEvent('afterenter', {}, {}, props))
  const triggerBeforeLeaveEvent = () => bindbeforeleave?.(getCustomEvent('beforeleave', {}, {}, props))
  const triggerLeaveEvent = () => bindleave?.(getCustomEvent('leave', {}, {}, props))
  const triggerAfterLeaveEvent = () => bindafterleave?.(getCustomEvent('afterleave', {}, {}, props))

  const close = () => bindclose(getCustomEvent('close', {}, { detail: { value: false, source: 'close' } }, props))

  // 控制组件是否挂载
  const [internalVisible, setInternalVisible] = useState(show)

  const overlayOpacity = useSharedValue(0)
  const contentOpacity = useSharedValue(position === 'center' ? 0 : 1)
  const contentTranslate = useSharedValue(getInitialTranslate(position))

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value
  }))

  const sharedPosition = useSharedValue(position)
  useEffect(() => {
    sharedPosition.set(position)
  }, [position])
  const contentAnimatedStyle = useAnimatedStyle(() => {
    let transform: ViewStyle['transform'] = []
    if (sharedPosition.value === 'top' || sharedPosition.value === 'bottom') {
      transform = [{ translateY: `${contentTranslate.value}%` }]
    } else if (sharedPosition.value === 'right') {
      transform = [{ translateX: `${contentTranslate.value}%` }]
    }

    return {
      opacity: contentOpacity.value,
      transform
    }
  })

  const currentTick = useRef(0)
  function createTick () {
    currentTick.current++
    const current = currentTick.current
    return () => {
      return currentTick.current === current
    }
  }

  const invokeRunOnJSRef = useRef({
    animateInEnd: noop,
    animateOutEnd: noop,
    close
  })
  invokeRunOnJSRef.current.close = close
  const invokeRunOnJS = useRunOnJSCallback(invokeRunOnJSRef)

  function clearAnimation () {
    cancelAnimation(overlayOpacity)
    cancelAnimation(contentOpacity)
    cancelAnimation(contentTranslate)
  }

  // 播放入场动画
  const animateIn = () => {
    const isCurrentTick = createTick()
    triggerBeforeEnterEvent()
    nextTick(() => {
      const animateOutFinish = internalVisible === false
      setInternalVisible(true)
      triggerEnterEvent()
      if (!isCurrentTick()) return

      invokeRunOnJSRef.current.animateInEnd = () => {
        if (!isCurrentTick()) return
        triggerAfterEnterEvent()
      }
      /**
       * 对齐 微信小程序
       * 如果退场动画已经结束，则需将内容先移动到对应动画的初始位置
       * 否则，结束退场动画，从当前位置作为初始位置完成进场动画，且退场动画时长将缩短
       */
      let durationTime = duration
      if (animateOutFinish) {
        contentTranslate.set(getInitialTranslate(position))
        contentOpacity.set(position === 'center' ? 0 : 1)
      } else {
        clearAnimation()
        if (position === 'center') {
          durationTime = durationTime * (1 - contentOpacity.value)
        } else {
          durationTime = durationTime * (Math.abs(contentTranslate.value) / 100)
        }
      }

      const timingConfig: WithTimingConfig = {
        duration: durationTime,
        easing: Easing.out(Easing.quad)
      }
      const animationCallback: AnimationCallback = () => {
        'worklet'
        runOnJS(invokeRunOnJS)('animateInEnd')
      }

      overlayOpacity.value = withTiming(1, timingConfig)
      if (position === 'center') {
        contentOpacity.value = withTiming(1, timingConfig, animationCallback)
        contentTranslate.value = withTiming(0, timingConfig)
      } else {
        contentOpacity.value = withTiming(1, timingConfig)
        contentTranslate.value = withTiming(0, timingConfig, animationCallback)
      }
    })
  }

  // 播放离场动画
  const animateOut = () => {
    const isCurrentTick = createTick()
    triggerBeforeLeaveEvent()
    nextTick(() => {
      triggerLeaveEvent()
      if (!isCurrentTick()) return

      invokeRunOnJSRef.current.animateOutEnd = () => {
        if (!isCurrentTick()) return // 如果动画被cancelAnimation依然会触发回调，所以在此也需要判断Tick
        triggerAfterLeaveEvent()
        setInternalVisible(false)
      }

      let durationTime = duration
      if (position === 'center') {
        durationTime = durationTime * (contentOpacity.value)
      } else {
        // durationTime * (1 - |contentTranslate| / 100)
        durationTime = durationTime * (1 - Math.abs(contentTranslate.value) / 100)
      }
      const timingConfig: WithTimingConfig = {
        duration: durationTime,
        easing: Easing.out(Easing.quad)
      }
      const animationCallback: AnimationCallback = () => {
        'worklet'
        runOnJS(invokeRunOnJS)('animateOutEnd')
      }
      if (position === 'center') {
        contentOpacity.value = withTiming(0, timingConfig, animationCallback)
        contentTranslate.value = withTiming(getInitialTranslate(position), timingConfig)
      } else {
        contentOpacity.value = withTiming(1, timingConfig)
        contentTranslate.value = withTiming(getInitialTranslate(position), timingConfig, animationCallback)
      }
      overlayOpacity.value = withTiming(0, timingConfig)
    })
  }

  useEffect(() => {
    // 如果展示状态和挂载状态一致，则不需要做任何操作
    if (show) {
      animateIn()
    } else {
      if (!isFirstRender) animateOut()
    }
  }, [show])

  useDisablePageBack(show, close)

  const contentGesture = Gesture.Pan()
    .activeOffsetY([0, 0]) // 只要开始下滑就激活
    .failOffsetX([-10, 10]) // 横向位移超过 10px 则 fail，确保只处理纵向滑动
    .onUpdate((e) => {
      if (e.translationY > 200) {
        runOnJS(invokeRunOnJS)('close')
      }
    })
  /**
   * 全屏幕 IOS 左滑手势返回（ios默认页面返回存在页面跟手逻辑，page-container暂不支持，对齐微信小程序）
   * 1: 仅在屏幕左边缘滑动 才触发返回手势。
   */
  const screenGestureBase = Gesture.Pan()
    .activeOffsetX([0, 0]) // 只要开始右滑就激活
    .failOffsetY([-10, 10]) // 纵向位移超过 10px 则 fail，确保只处理横向滑动
    .hitSlop({ left: 0, width: 30 }) // 从屏幕左侧 30px 内触发才处理
    .onUpdate((e) => {
      if (e.translationX > 10) {
        runOnJS(invokeRunOnJS)('close')
      }
    })
  // closeOnSlideDown 时与 contentGesture 并行识别，避免两者竞争
  const screenGesture = closeOnSlideDown
    ? screenGestureBase.simultaneousWithExternalGesture(contentGesture)
    : screenGestureBase

  const renderMask = () => {
    const onPress = () => {
      close()
      bindclickoverlay?.(getCustomEvent(
        'clickoverlay',
        {},
        { detail: { value: false, source: 'clickoverlay' } },
        props
      ))
    }
    return createElement(TouchableWithoutFeedback, { onPress },
      createElement(Animated.View, { style: [styles.overlay, overlayStyle, overlayAnimatedStyle] }))
  }

  const renderContent = () => {
    const contentView = (
      <Animated.View style={[
        styles.container,
        round ? getRoundStyle(position) : undefined,
        positionStyle[position],
        customStyle,
        contentAnimatedStyle
      ]}>
        {children}
      </Animated.View>
    )

    return closeOnSlideDown
      ? <GestureDetector gesture={contentGesture}>{contentView}</GestureDetector>
      : contentView
  }

  const nodeRef = useRef(null)
  useNodesRef(props, ref, nodeRef, {})
  const { layoutRef, layoutProps } = useLayout({ props, hasSelfPercent: false, nodeRef })
  const innerProps = useInnerProps(
    extendObject(
      {},
      props,
      {
        ref: nodeRef
      },
      layoutProps
    ),
    [],
    { layoutRef }
  )
  const wrapperProps = extendObject(
    innerProps,
    {
      style: [styles.wrapper, { zIndex }]
    }
  )

  const renderWrapped = () => {
    const wrappedView = (
      // TODO 若开启pointerEvents="box-none" screenGesture 应包裹在page/app中才能保证手势全屏生效，如不开启pointerEvents="box-none" 则后方元素不可操作
      <Animated.View {...wrapperProps}>
        {overlay ? renderMask() : null}
        {renderContent()}
      </Animated.View>
    )
    return __mpx_mode__ === 'ios'
      ? <GestureDetector gesture={screenGesture}>{wrappedView}</GestureDetector>
      : wrappedView
  }

  // TODO 是否有必要支持refs? dataset?
  return createElement(Portal, null, internalVisible ? renderWrapped() : null)
})

const styles = StyleSheet.create({
  wrapper: extendObject(
    {
      justifyContent: 'flex-end',
      alignItems: 'center'
    } as const,
    StyleSheet.absoluteFillObject
  ),
  overlay: extendObject(
    {
      backgroundColor: 'rgba(0,0,0,0.5)'
    },
    StyleSheet.absoluteFillObject
  ),
  container: {
    position: 'absolute',
    backgroundColor: 'white',
    overflow: 'hidden'
  }
})

const positionStyle: Record<Position, ViewStyle> = {
  bottom: { bottom: 0, width: '100%', height: 'auto' },
  top: { top: 0, width: '100%', height: 'auto' },
  right: extendObject({}, StyleSheet.absoluteFillObject, { right: 0 }),
  center: extendObject({}, StyleSheet.absoluteFillObject)
}

PageContainer.displayName = 'MpxPageContainer'

export default PageContainer
