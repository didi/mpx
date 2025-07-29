import React, { createElement, forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { StyleSheet, Dimensions, TouchableWithoutFeedback, StyleProp, ViewStyle } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, cancelAnimation, runOnJS, WithTimingConfig, Easing, AnimationCallback } from 'react-native-reanimated'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Portal from './mpx-portal/index'
import { PreventRemoveEvent, usePreventRemove } from '@react-navigation/native'
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

const screenWidth = Dimensions.get('screen').width

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
    console.log('createTick ', current)
    return () => {
      console.log('isCurrentTick ', current, ', global tick is ' + currentTick.current)
      return currentTick.current === current
    }
  }

  const invokeRunOnJSRef = useRef({
    animateInEnd: noop,
    animateOutEnd: noop,
    close
  })
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
          // durationTime * (1 - |contentTranslate| / 100)
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

  // 禁用页面返回
  function useDisablePageBack () {
    /**
     * 如果当前页面是首页，则需要拦截返回关闭容器的逻辑
     * 如果不是首页，则由RN逻辑完成拦截（usePreventRemove + gestureEnabled:false）
     */
    const navigation = useNavigation()!
    // TODO resetRouterStack 可能会导致 isFirstPage 发生变化，需要监听路由变化
    const isFirstPage = navigation.getState().routes.length === 1

    useEffect(() => {
      if (isFirstPage) {
        if (typeof global.__mpx.config?.rnConfig?.disableSwipeBack === 'function') {
          // DRN 问题，当 resetRouterStack 页面数为1时会关闭 disableSwipeBack，此时需要再次 disableSwipeBack
          global.__mpx.config.rnConfig.disableSwipeBack({ disable: show })
        }
      } else {
        navigation.setOptions({
          gestureEnabled: !show
        })
      }
    }, [show])

    // 路由返回拦截
    usePreventRemove(show, (event: PreventRemoveEvent) => {
      const { data } = event
      if (show) {
        close()
      } else {
        navigation?.dispatch(data.action)
      }
    })
  }
  useDisablePageBack()
  /**
   * IOS 下需要关闭手势返回（原因： IOS手势返回时页面会跟随手指滑动，但是实际返回动作是在松手时触发，需禁掉页面跟随手指滑动的效果）
   * 禁用与启用逻辑抽离为rnConfig由外部实现，并补充纯RN下默认实现
   */
  // TODO 如果是首页，需要拦截调用NA的disableSwipeBack拦截关闭容器的逻辑
  // 如果不是首页，由RN逻辑完成拦截
  // useEffect(() => {
  //   if (typeof global.__mpx.config?.rnConfig?.disableSwipeBack === 'function') {
  //     global.__mpx.config.rnConfig.disableSwipeBack({ disable: show })
  //   } else {
  //     navigation?.setOptions({
  //       gestureEnabled: !show
  //     })
  //   }
  // }, [show])

  const THRESHOLD = screenWidth * 0.3 // 距离阈值
  const VELOCITY_THRESHOLD = 1000 // px/s
  const contentGesture = Gesture.Pan()
    .activeOffsetY(150) // 下滑至少滑动 150px 才处理
    .onEnd((e) => {
      const { velocityY, translationY } = e
      const shouldGoBack = translationY > THRESHOLD || velocityY > VELOCITY_THRESHOLD
      if (shouldGoBack) {
        runOnJS(invokeRunOnJS)('close')
      }
    })
  /**
   * 全屏幕 IOS 左滑手势返回（ios默认页面返回存在页面跟手逻辑，page-container暂不支持，对齐微信小程序）
   * 1: 仅在屏幕左边缘滑动 才触发返回手势。
   * 2: 用户滑动距离足够 或 滑动速度足够快，才触发返回。
   * 3: 用户中途回退（滑回来）或滑太慢/太短，则应取消返回。
   */
  const screenGesture = Gesture.Pan()
    .activeOffsetX(THRESHOLD) // 左滑至少滑动 30% 屏幕宽度才处理
    .hitSlop({ left: 0, width: 30 }) // 从屏幕左侧 30px 内触发才处理
    .onEnd((e) => {
      const { velocityX, translationX } = e
      // const shouldGoBack = translationX > THRESHOLD || velocityX > VELOCITY_THRESHOLD
      const shouldGoBack = velocityX > VELOCITY_THRESHOLD
      if (shouldGoBack) {
        runOnJS(invokeRunOnJS)('close')
      }
    })

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
        getRoundStyle(position),
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

PageContainer.displayName = 'PageContainer'

export default PageContainer
