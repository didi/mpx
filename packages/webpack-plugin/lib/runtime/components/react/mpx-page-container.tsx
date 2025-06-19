import React, { createElement, forwardRef, useEffect, useRef, useState } from 'react'
import {
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  PanResponder,
  StyleProp,
  ViewStyle
} from 'react-native'
import Portal from './mpx-portal/index'
import { PreventRemoveEvent, usePreventRemove } from '@react-navigation/native'
import { extendObject, useLayout, useNavigation } from './utils'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef from './useNodesRef'

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

    bindclose: (event: CustomEvent<{ value: boolean}>) => void;

    bindbeforeenter?: (event: CustomEvent) => void;
    bindenter?: (event: CustomEvent) => void;
    bindafterenter?: (event: CustomEvent) => void;
    bindbeforeleave?: (event: CustomEvent) => void;
    bindleave?: (event: CustomEvent) => void;
    bindafterleave?: (event: CustomEvent) => void;
    bindclickoverlay?: (event: CustomEvent) => void;
    children: React.ReactNode;
}

const screenHeight = Dimensions.get('window').height
const screenWidth = Dimensions.get('window').width

function nextTick (cb: () => void) {
  setTimeout(cb, 0)
}

export default forwardRef<any, PageContainerProps>((props, ref) => {
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

  const close = () => {
    bindclose(getCustomEvent(
      'close',
      {},
      { detail: { value: false, source: 'close' } },
      props
    ))
  }

  const [internalVisible, setInternalVisible] = useState(show) // 控制组件是否挂载

  const overlayOpacity = useRef(new Animated.Value(0)).current
  const contentOpacity = useRef(new Animated.Value(position === 'center' ? 0 : 1)).current
  const contentTranslate = useRef(new Animated.Value(getInitialPosition())).current

  const currentAnimation = useRef<Array<Animated.CompositeAnimation> | null>(null)

  function getInitialPosition () {
    switch (position) {
      case 'top':
        return -screenHeight
      case 'bottom':
        return screenHeight
      case 'right':
        return screenWidth
      case 'center':
        return 0
      default:
        return screenHeight
    }
  }

  const currentTick = useRef(0)
  function createTick () {
    currentTick.current++
    console.log('currentTick.current++', currentTick.current)
    const current = currentTick.current
    return () => {
      console.log('currentTick.current', currentTick.current, 'current', current)
      return currentTick.current === current
    }
  }
  // 播放入场动画
  const animateIn = () => {
    const isCurrentTick = createTick()
    const animateOutFinish = currentAnimation.current === null
    if (!animateOutFinish) {
            currentAnimation.current!.forEach((animation) => animation.stop())
    }
    const animations: Animated.CompositeAnimation[] = [
      Animated.timing(contentTranslate, {
        toValue: 0,
        duration,
        useNativeDriver: true
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration,
        useNativeDriver: true
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration,
        useNativeDriver: true
      })
    ]
    currentAnimation.current = animations
    // 所有生命周期需相隔一个nextTick以保证在生命周期中修改show可在组件内部监听到
    bindbeforeenter && bindbeforeenter(getCustomEvent(
      'beforeenter',
      {},
      { detail: { value: false, source: 'beforeenter' } },
      props
    ))
    nextTick(() => {
      bindenter && bindenter(getCustomEvent(
        'enter',
        {},
        { detail: { value: false, source: 'enter' } },
        props
      ))
      // 与微信对其， bindenter 需要执行，所以 isCurrentTick 放在后面
      if (!isCurrentTick()) return

      console.log('animateIn start')
      // 设置为动画初始状态(特殊情况， 如果退场动画没有结束 或者 退场动画还未开始，则无需初始化，而是从当前位置完成动画)
      if (animateOutFinish) {
        contentTranslate.setValue(getInitialPosition())
        contentOpacity.setValue(position === 'center' ? 0 : 1)
      }
      Animated.parallel(animations).start(() => {
        bindafterenter && bindafterenter(getCustomEvent(
          'afterenter',
          {},
          { detail: { value: false, source: 'afterenter' } },
          props
        ))
      })
    })
  }

  // 播放离场动画
  const animateOut = () => {
    const isCurrentTick = createTick()
    // 停止入场动画
    currentAnimation.current?.forEach((animation) => animation.stop())
    const animations: Animated.CompositeAnimation[] = [Animated.timing(overlayOpacity, {
      toValue: 0,
      duration,
      useNativeDriver: true
    })
    ]
    if (position === 'center') {
      animations.push(Animated.timing(contentOpacity, {
        toValue: 0,
        duration,
        useNativeDriver: true
      }))
    } else {
      animations.push(Animated.timing(contentTranslate, {
        toValue: getInitialPosition(),
        duration,
        useNativeDriver: true
      }))
    }
    currentAnimation.current = animations
    bindbeforeleave && bindbeforeleave(getCustomEvent(
      'beforeleave',
      {},
      { detail: { value: false, source: 'beforeleave' } },
      props
    ))
    nextTick(() => {
      bindleave && bindleave(getCustomEvent(
        'leave',
        {},
        { detail: { value: false, source: 'leave' } },
        props
      ))
      if (!isCurrentTick()) return
      console.log('animateOut start')
      Animated.parallel(animations).start(() => {
        currentAnimation.current = null
        bindafterleave && bindafterleave(getCustomEvent(
          'afterleave',
          {},
          { detail: { value: false, source: 'afterleave' } },
          props
        ))
        setInternalVisible(false) // 动画播放完后，才卸载
      })
    })
  }

  useEffect(() => {
    console.log('====comp show', show, 'internalVisible', internalVisible)
    // 如果展示状态和挂载状态一致，则不需要做任何操作
    if (show) {
      setInternalVisible(true) // 确保挂载
      animateIn()
    } else {
      if (!isFirstRender) animateOut()
    }
  }, [show])

  const navigation = useNavigation()
  usePreventRemove(show, (event: PreventRemoveEvent) => {
    const { data } = event
    if (show) {
      close()
    } else {
      navigation?.dispatch(data.action)
    }
  })

  // IOS 下需要关闭手势返回（原因： IOS手势返回时页面会跟随手指滑动，但是实际返回动作是在松手时触发，需禁掉页面跟随手指滑动的效果）
  useEffect(() => {
    navigation?.setOptions({
      gestureEnabled: !show
    })
  }, [show])

  const SCREEN_EDGE_THRESHOLD = 60 // 从屏幕左侧 30px 内触发

  // 内容区 手势下滑关闭
  const contentPanResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      const { dx, dy } = gestureState
      return dy > 200 && Math.abs(dx) < 60
    },
    onPanResponderRelease: () => {
      close()
    }
  })

  // 全屏幕 IOS 右滑手势返回
  const screenPanResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      const { moveX, dx, dy } = gestureState

      const isFromEdge = moveX < SCREEN_EDGE_THRESHOLD
      const isHorizontalSwipe = dx > 10 && Math.abs(dy) < 20
      return isFromEdge && isHorizontalSwipe
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > 100) {
        close()
      }
    }
  })

  const getTransformStyle: () => ViewStyle = () => {
    switch (position) {
      case 'top':
      case 'bottom':
        return { transform: [{ translateY: contentTranslate }] }
      case 'right':
        return { transform: [{ translateX: contentTranslate }] }
      case 'center':
        return {}
    }
  }

  const renderMask = () => {
    const onPress = () => {
      close()
      bindclickoverlay && bindclickoverlay(getCustomEvent(
        'clickoverlay',
        {},
        { detail: { value: false, source: 'clickoverlay' } },
        props
      ))
    }
    return createElement(TouchableWithoutFeedback, { onPress },
      createElement(Animated.View, { style: [styles.overlay, overlayStyle, { opacity: overlayOpacity }] }))
  }

  const renderContent = (children: React.ReactNode) => {
    const contentProps = extendObject(
      {
        style: [
          styles.container,
          round ? styles.rounded : null,
          positionStyle[position],
          customStyle,
          getTransformStyle(),
          { opacity: contentOpacity }
        ]
      },
      closeOnSlideDown ? contentPanResponder.panHandlers : null
    )
    return createElement(Animated.View, contentProps, children)
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
    },
    __mpx_mode__ === 'ios' ? screenPanResponder.panHandlers : {}
  )

  // TODO 是否有必要支持refs? dataset?
  return createElement(Portal, null,
    internalVisible
      ? createElement(Animated.View, wrapperProps,
        overlay ? renderMask() : null,
        renderContent(children)
      )
      : null
  )
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
    backgroundColor: 'white'
  },
  rounded: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  }
})

const positionStyle: Record<Position, ViewStyle> = {
  bottom: { bottom: 0, width: '100%', height: 'auto' },
  top: { top: 0, width: '100%', height: 'auto' },
  right: extendObject({}, StyleSheet.absoluteFillObject, { right: 0 }),
  center: extendObject({}, StyleSheet.absoluteFillObject)
}
