import { View, NativeSyntheticEvent, Dimensions, LayoutChangeEvent } from 'react-native'
import { GestureDetector, Gesture, GestureUpdateEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withDelay, Easing, runOnJS, runOnUI, useAnimatedReaction } from 'react-native-reanimated';

import { JSX, forwardRef, useRef, useEffect, useState, ReactNode } from 'react'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数
import { useTransformStyle, splitStyle, splitProps, useLayout, wrapChildren } from './utils'
/**
 * ✔ indicator-dots
 * ✔ indicator-color
 * ✔ indicator-active-color
 * ✔ autoplay
 * ✔ current
 * ✔ interval
 * ✔ duration
 * ✔ circular
 * ✔ vertical
 * ✘ display-multiple-items
 * ✘ previous-margin
 * ✘ next-margin
 * ✔ easing-function  ="easeOutCubic"
 * ✘ snap-to-edge
 */
type EaseType = 'default' | 'linear' | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic'
type StrTransType = 'translationX' | 'translationY'
type dirType = 'x' | 'y'
interface SwiperProps {
  children?: ReactNode;
  circular?: boolean;
  current?: number;
  interval?: number;
  autoplay?: boolean;
  // scrollView 只有安卓可以设
  duration?: number;
  'indicator-dots'?: boolean;
  'indicator-color'?: string;
  'indicator-active-color'?: string;
  vertical?: boolean;
  style: {
    [key: string]: any
  };
  'easing-function'?: EaseType;
  'previous-margin'?: string;
  'next-margin'?: string;
  'enable-offset'?: boolean;
  'enable-var': boolean;
  'parent-font-size'?: number;
  'parent-width'?: number;
  'parent-height'?: number;
  'external-var-context'?: Record<string, any>;
  bindchange?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void;
}

interface CarouseState {
  width: number;
  height: number;
}

/**
 * 默认的Style类型
 */
const styles: { [key: string]: Object } = {
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
  }
}

const dotCommonStyle = {
  width: 8,
  height: 8,
  borderRadius: 4,
  marginLeft: 3,
  marginRight: 3,
  marginTop: 3,
  marginBottom: 3
}

const easeMap = {
  'default': Easing.ease,
  'linear': Easing.linear,
  'easeInCubic': Easing.in(Easing.cubic),
  'easeOutCubic': Easing.out(Easing.cubic),
  'easeInOutCubic': Easing.inOut(Easing.cubic)
}

const _SwiperWrapper = forwardRef<HandlerRef<View, SwiperProps>, SwiperProps>((props: SwiperProps, ref): JSX.Element => {
  const {
    'indicator-dots': showsPagination,
    'indicator-color': dotColor = 'rgba(0, 0, 0, .3)',
    'indicator-active-color': activeDotColor = '#000000',
    'enable-var': enableVar = false,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight,
    'external-var-context': externalVarContext,
    style = {}
  } = props
  const previousMargin = props['previous-margin'] ? parseInt(props['previous-margin']) : 0
  const nextMargin = props['next-margin'] ? parseInt(props['next-margin']) : 0
  const easeingFunc = props['easing-function'] || 'default'
  const easeDuration = props['duration'] || 500
  const horizontal = props.vertical !== undefined ? !props.vertical : true

  const nodeRef = useRef<View>(null)
  useNodesRef<View, SwiperProps>(props, ref, nodeRef, {})

  // 默认取水平方向的width
  const { width } = Dimensions.get('window')
  // 计算transfrom之类的
  const {
    normalStyle,
    hasVarDec,
    varContextRef,
    hasSelfPercent,
    setWidth,
    setHeight
  } = useTransformStyle(style, {
    enableVar,
    externalVarContext,
    parentFontSize,
    parentWidth,
    parentHeight
  })
  const { textStyle, innerStyle } = splitStyle(normalStyle)
  const { textProps } = splitProps(props)
  const children = Array.isArray(props.children) ? props.children.filter(child => child) : (props.children ? [props.children] : [])
  const defaultHeight = (normalStyle?.height || 150)
  const defaultWidth = (normalStyle?.width || width || 375)
  const initWidth = typeof defaultWidth === 'number' ? defaultWidth - previousMargin - nextMargin : defaultWidth
  const initHeight = typeof defaultHeight === 'number' ? defaultHeight - previousMargin - nextMargin : defaultHeight

  const [widthState, setWidthState] = useState(initWidth)
  const [heightState, setHeightState] = useState(initHeight)
  const dir = useSharedValue(horizontal === false ? 'y' : 'x')
  const pstep =  dir.value === 'x' ? widthState : heightState
  const initStep = Number.isNaN(pstep) ? 0 : pstep
  const step = useSharedValue(initStep)

  function getInitOffset () {
    const stepValue = dir.value === 'x' ? widthState : heightState
    if (Number.isNaN(+stepValue)) return { x: 0, y: 0 }
    const targetOffset = { x: 0, y: 0 }
    if(props.circular && totalElements.value > 1) {
      const targetIndex = (props.current || 0) + 2
      targetOffset[dir.value as dirType] = -stepValue * targetIndex
    } else if (props.current && props.current > 0){
      targetOffset[dir.value as dirType] = -props.current * stepValue
    }
    
    return targetOffset
  }

  const totalElements = useSharedValue(children.length)
  const targetIndex = useSharedValue(0)
  const initOffset = getInitOffset()
  const offset = useSharedValue(initOffset)
  const start = useSharedValue(initOffset);
  const strTrans = 'translation' + dir.value.toUpperCase()
  const isAutoFirst = useRef(true)
  const arrPages: Array<ReactNode> | ReactNode = renderItems()
  // 定时器替代setInterval
  const timestamp = useSharedValue(0);
  // 是否可以开始轮播
  const canLoop = useSharedValue(true)

  const {
    // 存储layout布局信息
    layoutRef,
    layoutProps,
    layoutStyle
  } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef, onLayout: onWrapperLayout })


  const innerProps = useInnerProps(props, {
    ref: nodeRef,
  }, [
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
  ], { layoutRef: layoutRef })

  function onWrapperLayout (e: LayoutChangeEvent) {
    nodeRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
      const isWDiff = initWidth !== width
      const isHDiff = initHeight !== height
      if (isWDiff || isHDiff) {
        const changeState = {
          width: isWDiff ? width : widthState,
          height: isHDiff ? height : heightState
        }
        const attr = dir.value === 'x' ? 'width' : 'height'
        changeState[attr] = changeState[attr] - previousMargin - nextMargin
        if (dir.value === 'x') {
          setWidthState(changeState[attr])
        } else {
          setHeightState(changeState[attr])
        }
      }
    })
  }

  const animatedPagerStyles = useAnimatedStyle(() => {
    return {
     
    }
  })

  function renderPagination () {
    if (totalElements.value <= 1) return null
    const dots: Array<ReactNode> = []
    const activeDotStyle = Object.assign({ backgroundColor: activeDotColor || '#007aff' }, dotCommonStyle)
    const dotStyle = Object.assign({ backgroundColor: dotColor || 'rgba(0,0,0,.2)' }, dotCommonStyle)
    for (let i = 0; i < totalElements.value; i++) {
      if (i === targetIndex.value) {
        dots.push(<Animated.View style={[activeDotStyle, animatedPagerStyles]} key={i}></Animated.View>)
      } else {
        dots.push(<Animated.View style={[dotStyle, animatedPagerStyles]} key={i}></Animated.View>)
      }
    }
    // 这里也可以用动画实现
    return (
      <View pointerEvents="none" style = {[styles['pagination_' + [dir.value as dirType]]]}>
        {dots}
      </View>
    )
    /*
    return (
      <View pointerEvents="none" style={[styles['pagination_' + [dir.value as dirType]]]}>
        {dots}
      </View>
    )
    */
  }

  function renderItems () {
    // const { width, height } = state
    const pageStyle = { width: widthState, height: heightState }
    // pages = ["0", "1", "2", "0", "1"]
    const renderChild = children.slice()
    if (props.circular && totalElements.value > 1) {
      if (totalElements.value === 2) {
        renderChild.concat(children).concat(children)
      } else {
        // 最前加两个
        renderChild.unshift(children[totalElements.value - 1])
        renderChild.unshift(children[totalElements.value - 2])
        // 最后加两个
        renderChild.push(children[0])
        renderChild.push(children[1])
      }
    }
    // 1. 不支持循环 + margin 模式
    return renderChild.map((child, i) => {
      const extraStyle = {} as {
        [key: string]: any
      }
      if (i === 0 && dir.value === 'x' && typeof width === 'number') {
        previousMargin && (extraStyle.marginLeft = previousMargin)
      } else if (i === totalElements.value - 1 && typeof width === 'number') {
        nextMargin && (extraStyle.marginRight = nextMargin)
      }
      return (<View style={[pageStyle, extraStyle]} key={ 'page' + i}>{child}</View>)
    })
  }

  function handleEvent () {
    'worklet';
    console.log('-----------handleEvent', targetIndex.value);
    runOnJS((current: number) => {
      console.log('-------------22222', 1)
      const eventData = getCustomEvent('change', {}, { detail: { current, source: 'touch' }, layoutRef: layoutRef })
      props.bindchange && props.bindchange(eventData)
      props.autoplay && createAutoPlay()
    })(targetIndex.value)
  }

  function createAutoPlay () {
    'worklet';
    const targetOffset = { x: 0, y: 0 }
    let nextIndex = targetIndex.value
    if (!props.circular) {
      // 获取下一个位置的坐标, 循环到最后一个元素,直接停止
      if (targetIndex.value === totalElements.value - 1) {
        return
      }
      nextIndex += 1
      targetOffset[dir.value as dirType] = -nextIndex * step.value
      offset.value = withTiming(targetOffset, {
        duration: easeDuration,
        easing: easeMap[easeingFunc]
      }, () => {
        start.value = targetOffset
        targetIndex.value = nextIndex
        handleEvent()
      })
    } else {
      if (nextIndex === totalElements.value - 1) {
        nextIndex = 0
        targetOffset[dir.value as dirType] = -(totalElements.value + 2) * step.value
        // 执行动画到下一帧
        offset.value = withTiming(targetOffset, {
          duration: easeDuration
        }, () => {
          const initOffset = { x: 0, y: 0 }
          initOffset[dir.value as dirType] = -step.value * 2
          // 将开始位置设置为真正的位置
          offset.value = initOffset
          start.value = initOffset
          targetIndex.value = nextIndex
          handleEvent()
        })
      } else {
        nextIndex = targetIndex.value + 1
        targetOffset[dir.value as dirType] = -(nextIndex + 2) * step.value
        // 执行动画到下一帧
        offset.value = withTiming(targetOffset, {
          duration: easeDuration,
          easing: easeMap[easeingFunc]
        }, () => {
          start.value = targetOffset
          targetIndex.value = nextIndex
          handleEvent()
        })
      }
    }
  }

  useAnimatedReaction(() => timestamp.value, (newTime, preTime) => {
    const canPlay = props.autoplay && newTime > 0 && newTime !== preTime && canLoop.value && totalElements.value > 1
    if (canPlay) {
      createAutoPlay()
    }
  })

  useEffect(() => {
    // 这里stepValue 有时候拿不到
    const stepValue = dir.value === 'x' ? widthState : heightState
    if (!Number.isNaN(+stepValue)) {
      step.value = stepValue
    }
    if (props.autoplay && !Number.isNaN(+stepValue)) {
      if (isAutoFirst.current) {
        isAutoFirst.current = false
        const targetOffset = getInitOffset()
        offset.value = targetOffset
        start.value = targetOffset
      }
    } else {
      const targetOffset = getInitOffset()
      offset.value = targetOffset
      start.value = targetOffset
    }
  }, [props.autoplay, props.current, widthState, heightState])

  useEffect(() => {
    if (props.autoplay && totalElements.value > 1) {
      const intervalTimer = props.interval || 500
      const intervalId = setInterval(() => {
        timestamp.value = Date.now();
      }, intervalTimer);
      return () => clearInterval(intervalId);
    }
  }, []);

  function getTargetPosition (e: GestureUpdateEvent<PanGestureHandlerEventPayload>) {
    'worklet';
    let targetPos = 0
    let resetPos = 0
    const posView = e[dir.value as dirType]
    // 移动的距离
    const transDistance = e[strTrans as StrTransType]
    // 移动的目标步长
    const moveDistance  = Math.ceil(Math.abs(transDistance) / step.value) * step.value
    // 移动的目标步长之后的坐标, e[strTrans] < 0) 代表正向滚动 否则反向
    const moveTargetPos = transDistance < 0 ? posView + moveDistance : posView - moveDistance
    // 目标索引值
    let index = Math.floor(moveTargetPos / step.value)
    let realTarget = targetIndex.value
    // 是否临界点
    let isCriticalItem = false
    if (!props.circular) {
      // targetIndex.value = index
      // targetPos = -targetIndex.value * step.value
      realTarget = index
      targetPos = -realTarget * step.value
    } else {
      // 正向滚动
      if (transDistance< 0) {
        const a1 = index - (totalElements.value + 2)
        const a2 = index - 2
        // targetIndex.value = a1 >= 0 ? a1 : a2
        realTarget = a1 >= 0 ? a1 : a2
        targetPos = -index * step.value
        isCriticalItem = a1 >= 0
        if (isCriticalItem) {
          resetPos = -(a1 + 2) * step.value
        }
      } else {
        // 反向滚动
        isCriticalItem = [0, 1].includes(index)
        if (isCriticalItem) {
          realTarget = index === 0 ? totalElements.value - 2 : totalElements.value - 1
        } else {
          realTarget = index - 2
        }
        targetPos = -index * step.value
        if (isCriticalItem) {
          resetPos = -(index + totalElements.value) * step.value
        }
      }
    }
    return {
      realTarget,
      isCriticalItem,
      resetOffset: {
        x: dir.value === 'x' ? resetPos : 0,
        y: dir.value === 'y' ? resetPos : 0
      },
      targetOffset: {
        x: dir.value === 'x' ? targetPos : offset.value.x,
        y: dir.value === 'y' ? targetPos : offset.value.y
      }
    }
  }

  function canMove (e: GestureUpdateEvent<PanGestureHandlerEventPayload>) {
    'worklet';
    // 移动的距离
    const transDistance = e[strTrans as StrTransType]
    if (totalElements.value <= 1) {
      return false
    } else if (props.circular) {
      return true;
    } else if (transDistance < 0) {
      // 正向滚动e[strTrans] < 0
      var moveTarget = e[dir.value as dirType] + Math.abs(transDistance);
      var posEnd = (totalElements.value - 1) * step.value;
      return moveTarget <= posEnd;
    } else if (transDistance > 0) {
      // 反向滚动 e[dir.value] < step.value 代表第一个元素不能再滚动, e[dir.value] > step.value
      return e[dir.value as dirType] > step.value && e[dir.value as dirType] - transDistance > 0 && targetIndex.value >= 1
    } else {
      return true;
    }
  }

  function resetAutoTime () {
    'worklet';
    if (props.autoplay && canLoop.value === false) {
      // 再经过interval后执行动画
      timestamp.value = 0
      canLoop.value = true
    }
  }

  const animatedStyles = useAnimatedStyle(() => {
    if (dir.value === 'x') {
      return { transform: [{ translateX: offset.value.x }]}
    } else {
      return { transform: [{ translateY: offset.value.y }]}
    }
  })


  const gesture = Gesture.Pan()
    .onBegin(() => {
      canLoop.value = false
    })
    .onUpdate((e) => {
      if (!canMove(e)) {
        return
      }
      offset.value = {
        x: e.translationX + start.value.x,
        y: e.translationY + start.value.y,
      };
    })
    .onEnd((e) => {
      if (!canMove(e)) {
        return
      }
      const { isCriticalItem, targetOffset, resetOffset, realTarget } = getTargetPosition(e)
      if (isCriticalItem) {
        // 执行动画到下一帧
        offset.value = withTiming(targetOffset, {
          duration: easeDuration
        }, () => {
          // 动画执行完成后归位真正的offset
          offset.value = resetOffset
          start.value = resetOffset
          targetIndex.value = realTarget
          resetAutoTime()
          handleEvent()
        })
      } else {
        offset.value = withTiming(targetOffset, {
          duration: easeDuration,
          easing: easeMap[easeingFunc]
        }, () => {
          targetIndex.value = realTarget
          start.value = targetOffset
          targetIndex.value = realTarget
          resetAutoTime()
          handleEvent()
        })
      }
    })
    .onFinalize(() => {
    });
  return (<View style={[normalStyle, layoutStyle, { overflow: "scroll", justifyContent: "flex-start" }]} {...layoutProps} {...innerProps}>
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ flexDirection: dir.value === 'x' ? 'row' : 'column' }, animatedStyles]}>
        {wrapChildren({
          children: arrPages
        }, {
          hasVarDec,
          varContext: varContextRef.current,
          textStyle,
          textProps
        })}
      </Animated.View>
    </GestureDetector>
      {showsPagination && renderPagination()}
  </View>)
})
_SwiperWrapper.displayName = 'mpx-swiper'

export default _SwiperWrapper
