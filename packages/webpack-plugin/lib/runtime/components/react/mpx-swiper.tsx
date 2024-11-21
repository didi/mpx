import { View, NativeSyntheticEvent, Dimensions, LayoutChangeEvent } from 'react-native'
import { GestureDetector, Gesture, GestureUpdateEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing, runOnJS, useAnimatedReaction, cancelAnimation, interpolate } from 'react-native-reanimated';

import { JSX, forwardRef, useRef, useEffect, useState, ReactNode, useCallback, useMemo } from 'react'
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
 * ✔ previous-margin
 * ✔ next-margin
 * ✔ easing-function  ="easeOutCubic"
 * ✘ display-multiple-items
 * ✘ snap-to-edge
 */
type EaseType = 'default' | 'linear' | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic'
type StrTransType = 'translationX' | 'translationY'
type StrAbsoType = 'absoluteX' | 'absoluteY'
type StrVelocity = 'velocityX' | 'velocityY'

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
// 默认前后补位的元素个数
const patchElementNum = 2
const longPressRatio = 100
const quickMoveTime = 200
const quickMoveDuration = 200

const easeMap = {
  'default': Easing.linear,
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
  const { textStyle } = splitStyle(normalStyle)
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
    const stepValue = getStepValue()
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
  const strTrans = 'translation' + dir.value.toUpperCase() as StrTransType
  const strAbso = 'absolute' + dir.value.toUpperCase() as StrAbsoType
  const strVelocity = 'velocity' + dir.value.toUpperCase() as StrVelocity
  const isAutoFirst = useRef(true)
  const arrPages: Array<ReactNode> | ReactNode = renderItems()
  // canLoop 标识是否能滚动
  const canLoop = useSharedValue(!!props.autoplay)
  // 标识手指触摸和抬起
  const touchfinish = useSharedValue(false)
  // 记录用户点击时绝对定位坐标
  const preRelativePos = useSharedValue(0)
  const intervalId = useRef(0 as number | ReturnType<typeof setTimeout>)
  const timerId = useRef(0 as number | ReturnType<typeof setTimeout>);
  const gestureTime = useSharedValue(0)
  const customTrans = useSharedValue(0)
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

  function renderPagination () {
    if (totalElements.value <= 1) return null
    const dots: Array<ReactNode> = []
    for (let i = 0; i < totalElements.value; i++) {
      const dotStyle = useAnimatedStyle(() => {
        const activeColor = activeDotColor || '#007aff'
        const unActionColor = dotColor || 'rgba(0,0,0,.2)'
        return {
          backgroundColor: i === targetIndex.value ? activeColor : unActionColor
        }
      })
      dots.push(<Animated.View
        style={[
          dotCommonStyle,
          dotStyle
        ]}
        key={i}>
      </Animated.View>) 
    }
    return (
      <View pointerEvents="none" style = {[styles['pagination_' + [dir.value as dirType]]]}>
        {dots}
      </View>
    )
  }

  function renderItems () {
    const pageStyle = { width: widthState, height: heightState }
    let renderChild = children.slice()
    if (props.circular && totalElements.value > 1) {
      if (totalElements.value === 2) {
        renderChild = renderChild.concat(children).concat(children)
      } else {
        // 最前加两个
        renderChild.unshift(children[totalElements.value - 1])
        renderChild.unshift(children[totalElements.value - 2])
        // 最后加两个
        renderChild.push(children[0])
        renderChild.push(children[1])
      }
    }
    return renderChild.map((child, index) => {
      const extraStyle = {} as { [key: string]: any }
      if (index === 0 && dir.value === 'x' && typeof width === 'number') {
        previousMargin && (extraStyle.marginLeft = previousMargin)
      } else if (index === totalElements.value - 1 && typeof width === 'number') {
        nextMargin && (extraStyle.marginRight = nextMargin)
      }
      
      return (<Animated.View
        style={[
          pageStyle,
          extraStyle  
        ]}
        key={ 'page' + index}>
        {child}
      </Animated.View>)
    })
  }

  function createAutoPlay () {
    'worklet';
    const targetOffset = { x: 0, y: 0 }
    let nextIndex = targetIndex.value
    if (!props.circular) {
      // 获取下一个位置的坐标, 循环到最后一个元素,直接停止, 取消定时器
      if (targetIndex.value === totalElements.value - 1) {
        canLoop.value = false
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
      })
    } else {
      // 默认向右, 向下
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
        })
      }
    }
  }

  function handleSwiperChange (current: number) {
    const eventData = getCustomEvent('change', {}, { detail: { current, source: 'touch' }, layoutRef: layoutRef })
    props.bindchange && props.bindchange(eventData)
  }

  function getStepValue () {
    return dir.value === 'x' ? widthState : heightState 
  }

  function handlerInterval (loopv: boolean, oldLoop: boolean | null) {
    clearInterval(intervalId.current)
    if (canLoop.value && oldLoop !== true) {
      const intervalTimer = props.interval || 500
      clearTimeout(timerId.current)
      timerId.current = setTimeout(() => {
        if (props.autoplay && totalElements.value > 1 && canLoop.value) {
          intervalId.current = setInterval(() => {
            // canLoop变化比较快的情况下
            if (canLoop.value) {
              createAutoPlay()
            } else {
              clearInterval(intervalId.current)
            }
          }, intervalTimer)
        }
      }, 500)
    }
  }

  useAnimatedReaction(() => targetIndex.value, (newIndex, preIndex) => {
    // 这里必须传递函数名, 直接写()=> {}形式会报 访问了未sharedValue信息
    const isInit = !preIndex && newIndex === 0
    if (!isInit && props.bindchange) {
      runOnJS(handleSwiperChange)(newIndex)
    }
  }, [targetIndex.value])

  useAnimatedReaction(() => canLoop.value, (loopv, oldLoop) => {
    // 这里必须传递函数名, 直接写()=> {}形式会报 访问了未sharedValue信息
    if (props.autoplay) {
      runOnJS(handlerInterval)(loopv, oldLoop)
    }
  }, [canLoop.value])

  useEffect(() => {
    // 这里stepValue 有时候拿不到
    const stepValue = getStepValue()
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
      if (props.current !== undefined && (props.current !== targetIndex.value || props.current === 0 && targetIndex.value > 0)) {
        targetIndex.value = props.current
        offset.value = withTiming(targetOffset, {
          duration: easeDuration,
          easing: easeMap[easeingFunc]
        }, () => {
          offset.value = targetOffset
          start.value = targetOffset
        })
      } else {
        offset.value = targetOffset
        start.value = targetOffset
        props.current && (targetIndex.value = props.current)
      }
    }
  }, [props.autoplay, props.current, widthState, heightState])


  function getTargetPosition (e: GestureUpdateEvent<PanGestureHandlerEventPayload>) {
    'worklet';
    let resetOffsetPos = 0
    let selectedIndex = targetIndex.value
    // 是否临界点
    let isCriticalItem = false
    // 真实滚动到的偏移量坐标
    let moveToTargetPos = 0
    // 移动的距离
    const transDistance = e[strTrans]
    // 当前的位置
    const currentOffset = offset.value[dir.value as dirType]
    const currentIndex = Math.abs(currentOffset) / step.value
    let moveToIndex = transDistance < 0 ? Math.ceil(currentIndex) : Math.floor(currentIndex)
    // 实际应该定位的索引值
    if (!props.circular) {
      selectedIndex = moveToIndex
      moveToTargetPos = selectedIndex * step.value
    } else {
      if (moveToIndex >= totalElements.value + patchElementNum) {
        selectedIndex = moveToIndex - (totalElements.value + patchElementNum)
        resetOffsetPos = (selectedIndex + patchElementNum) * step.value
        moveToTargetPos = moveToIndex * step.value
        isCriticalItem = true
      } else if (moveToIndex <= patchElementNum - 1) {
        selectedIndex = moveToIndex === 0 ? totalElements.value - 2 : totalElements.value - 1
        resetOffsetPos = (selectedIndex + patchElementNum) * step.value
        moveToTargetPos = moveToIndex * step.value
        isCriticalItem = true
      } else {
        selectedIndex = moveToIndex - 2
        moveToTargetPos = moveToIndex * step.value
      }

    }
    return {
      selectedIndex,
      isCriticalItem,
      resetOffset: {
        x: dir.value === 'x' ? -resetOffsetPos : 0,
        y: dir.value === 'y' ? -resetOffsetPos : 0
      },
      targetOffset: {
        x: dir.value === 'x' ? -moveToTargetPos : offset.value.x,
        y: dir.value === 'y' ? -moveToTargetPos : offset.value.y
      }
    }
  }

  function canMove (e: GestureUpdateEvent<PanGestureHandlerEventPayload>) {
    'worklet';
    if (!props.circular) {
      const transDistance = e[strTrans]
      if (transDistance < 0) {
        return targetIndex.value < totalElements.value - 1
      } else {
        return targetIndex.value > 0
      }
    } else {
      return true
    }
  }

  const animatedStyles = useAnimatedStyle(() => {
    if (dir.value === 'x') {
      return { transform: [{ translateX: offset.value.x }]}
    } else {
      return { transform: [{ translateY: offset.value.y }]}
    }
  })

  function handleEnd (e: GestureUpdateEvent<PanGestureHandlerEventPayload>) {
    'worklet';
    const subtractTime = Date.now() - gestureTime.value
    const { isCriticalItem, targetOffset, resetOffset, selectedIndex } = getTargetPosition(e)
    // 用户快速连续操作小于100ms, 快速切换有些生硬,调整下时间
    const durationTime = subtractTime <= quickMoveTime ? quickMoveDuration : easeDuration
    if (isCriticalItem) {
      offset.value = withTiming(targetOffset, {
        duration: durationTime,
        easing: easeMap[easeingFunc]
      }, () => {
        targetIndex.value = selectedIndex
        if (touchfinish.value !== false) {
          start.value = resetOffset
          offset.value = resetOffset
          canLoop.value = true
        }
      })
    } else {
      offset.value = withTiming(targetOffset, {
        duration: durationTime,
        easing: easeMap[easeingFunc]
      }, () => {
        targetIndex.value = selectedIndex
        if (touchfinish.value !== false) {
          start.value = targetOffset
          offset.value = targetOffset
          canLoop.value = true
        }
      })
    }
  }

  function handleBack () {
    'worklet';
    // 向右trans > 0, 向左trans < 0， 向右滑动的back， 向左滑动的back
    const posScrollRight = -(patchElementNum + targetIndex.value) * step.value
    const posScrollLeft = -(patchElementNum + targetIndex.value) * step.value
    const pos = customTrans.value < 0 ? posScrollRight : posScrollLeft
    const targetOffset = {
      x: dir.value === 'x' ? pos : 0,
      y: dir.value === 'y' ? pos : 0
    }
    offset.value = withTiming(targetOffset, {
      duration: easeDuration,
      easing: easeMap[easeingFunc]
    }, () => {
      if (touchfinish.value !== false) {
        start.value =targetOffset
        offset.value = targetOffset
        canLoop.value = true
      }
    })
  }

  function handleLongPress (e: GestureUpdateEvent<PanGestureHandlerEventPayload>) {
    'worklet';
    const currentOffset = Math.abs(offset.value[dir.value as dirType])
    const half = currentOffset % step.value > step.value / 2
    // 向右trans > 0, 向左trans < 0
    const isExceedHalf = customTrans.value < 0 ? half : !half
    if (isExceedHalf) {
      handleEnd(e)
    } else {
      handleBack()
    }
  }

  function reachBoundary (e: GestureUpdateEvent<PanGestureHandlerEventPayload>) {
    'worklet';
    // 移动的距离
    const transDistance = e[strTrans]
    const moveDistance = e[strAbso] - preRelativePos.value
    const elementsLength = step.value * totalElements.value
    let isBoundary = false
    let resetOffset = 0
    let moveToTargetPos = 0
    // Y轴向下滚动, transDistance > 0, 向上滚动 < 0
    // X轴向左滚动, transDistance > 0
    const currentOffset = offset.value[dir.value as dirType]
    const moveStep = Math.ceil(moveDistance / elementsLength)
    if (transDistance < 0) {
      const posEnd = (totalElements.value + patchElementNum + 1) * step.value
      const posReverseEnd = (patchElementNum - 1) * step.value
      if (currentOffset < -posEnd + step.value && currentOffset + posEnd > -2) {
        isBoundary = true
        moveToTargetPos = (totalElements.value + patchElementNum) * step.value
        resetOffset = Math.abs(moveStep) === 0 ? patchElementNum * step.value + moveDistance : moveStep * elementsLength
      }
      if (currentOffset > -posReverseEnd) {
        isBoundary = true
        moveToTargetPos = (patchElementNum + totalElements.value - 1) * step.value
        resetOffset =  moveStep * elementsLength
      }
    } else if (transDistance > 0) {
      const posEnd = (patchElementNum - 1) * step.value
      const posReverseEnd = (patchElementNum + totalElements.value) * step.value
      if (currentOffset > -posEnd) {
        isBoundary = true
        resetOffset = moveStep * elementsLength + step.value + (moveStep === 1 ? moveDistance : 0)
        moveToTargetPos = (patchElementNum - 1) * step.value
      }
      if (currentOffset < -posReverseEnd) {
        isBoundary = true
        resetOffset = moveStep * elementsLength + patchElementNum * step.value
        moveToTargetPos = posReverseEnd
      }

    }
    return {
      isBoundary,
      moveToTargetPos: {
        x: dir.value === 'x' ? -moveToTargetPos : 0,
        y: dir.value === 'y' ? -moveToTargetPos : 0
      },
      resetOffset: {
        x: dir.value === 'x' ? -resetOffset : 0,
        y: dir.value === 'y' ? -resetOffset : 0
      }
    }
  }

  const gestureHandler = Gesture.Pan()
    .onBegin((e) => {
      'worklet'
      touchfinish.value = false
      start.value = {
        x: dir.value === 'x' ? offset.value.x : 0,
        y: dir.value === 'y' ? offset.value.y : 0
      }
      cancelAnimation(offset)
      preRelativePos.value = e[strAbso]
      canLoop.value = false
      gestureTime.value = Date.now()
    })
    .onTouchesUp((e) => {
      'worklet'
      cancelAnimation(offset)
      touchfinish.value = true
      const touchEventData = e.changedTouches[0]
      // 只点击不会触发onEnd事件
      if (Math.ceil(preRelativePos.value) === Math.ceil(touchEventData[strAbso])) {
        const transObj: { [key in StrTransType]: number } = {
          translationX: 0,
          translationY: 0
        };
        transObj[strTrans] = customTrans.value
        handleLongPress(transObj as GestureUpdateEvent<PanGestureHandlerEventPayload>)
      }
    })
    .onUpdate((e) => {
      'worklet'
      cancelAnimation(offset)
      if (!props.circular && !canMove(e)) {
        return
      }
      const moveDistance = e[strAbso] - preRelativePos.value
      customTrans.value = moveDistance
      // 处理用户一直拖拽到临界点的场景, 不会执行onEnd
      const { isBoundary, resetOffset, moveToTargetPos } = reachBoundary(e)
      if (isBoundary && props.circular && !touchfinish.value) {
        start.value = resetOffset
        offset.value =  moveToTargetPos
      } else {
        offset.value = {
          x: moveDistance + start.value.x,
          y: moveDistance + start.value.y,
        };
      }
    })
    .onEnd((e) => {
      'worklet'
      if (!props.circular && !canMove(e)) {
        return
      }
      const { isBoundary, resetOffset: reachReset, moveToTargetPos } = reachBoundary(e)
      if (props.circular && isBoundary) {
        start.value = reachReset
        offset.value =  moveToTargetPos
        return
      }
      if (Math.abs(e[strVelocity]) < longPressRatio) {
        handleLongPress(e)
      } else {
        handleEnd(e)
      }
    })
  
  function renderSwiper () {
    return (<View style={[normalStyle, layoutStyle, { overflow: "scroll", display: "flex", justifyContent: "flex-start" }]} {...layoutProps} {...innerProps}>
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
        {showsPagination && renderPagination()}
    </View>)
  }

  if (totalElements.value === 1) {
    return renderSwiper()
  } else {
    return (<GestureDetector gesture={gestureHandler}>
      {renderSwiper()}
    </GestureDetector>)
  }
})
_SwiperWrapper.displayName = 'mpx-swiper'

export default _SwiperWrapper
