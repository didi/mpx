import { View, NativeSyntheticEvent, Dimensions, LayoutChangeEvent } from 'react-native'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing, runOnJS, useAnimatedReaction, cancelAnimation, interpolateColor, interpolate, Extrapolation } from 'react-native-reanimated'

import React, { JSX, forwardRef, useRef, useEffect, useState, ReactNode, ReactElement } from 'react'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数
import { useTransformStyle, splitStyle, splitProps, useLayout, wrapChildren } from './utils'
import { SwiperContext } from './context'
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
type EventDataType = {
  translation: number
}

type dirType = 'x' | 'y'
interface SwiperProps {
  children?: ReactNode;
  circular?: boolean;
  current?: number;
  interval?: number;
  autoplay?: boolean;
  // scrollView 只有安卓可以设
  duration?: number;
  // 滑动过程中元素是否scale变化
  scale?: boolean;
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
  },
  pagerWrapper: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  swiper: {
    overflow: 'scroll',
    display: 'flex',
    justifyContent: 'flex-start'
  }
}

const dotCommonStyle = {
  width: 8,
  height: 8,
  borderRadius: 4,
  marginLeft: 3,
  marginRight: 3,
  marginTop: 3,
  marginBottom: 3,
  zIndex: 98
}
const activeDotStyle = {
  zIndex: 99
}
const longPressRatio = 100

const easeMap = {
  default: Easing.linear,
  linear: Easing.linear,
  easeInCubic: Easing.in(Easing.cubic),
  easeOutCubic: Easing.out(Easing.cubic),
  easeInOutCubic: Easing.inOut(Easing.cubic)
}

const SwiperWrapper = forwardRef<HandlerRef<View, SwiperProps>, SwiperProps>((props: SwiperProps, ref): JSX.Element => {
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
  const easeDuration = props.duration || 500
  const horizontal = props.vertical !== undefined ? !props.vertical : true
  // 默认前后补位的元素个数
  const patchElementNum = props.circular ? 1 : 0
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
  const pstep = dir.value === 'x' ? widthState : heightState
  const initStep = isNaN(pstep) ? 0 : pstep
  // 每个元素的宽度 or 高度
  const step = useSharedValue(initStep)
  const totalElements = useSharedValue(children.length)
  // 记录选中元素的索引值
  const targetIndex = useSharedValue(0)
  // 记录元素的偏移量
  const offset = useSharedValue(0)
  const strTrans = 'translation' + dir.value.toUpperCase() as StrTransType
  const strAbso = 'absolute' + dir.value.toUpperCase() as StrAbsoType
  const strVelocity = 'velocity' + dir.value.toUpperCase() as StrVelocity
  const arrPages: Array<ReactNode> | ReactNode = renderItems()
  // autoplay的状态下是否被暂停
  const paused = useRef(false)
  // 标识手指触摸和抬起, 起点在onBegin
  const touchfinish = useSharedValue(false)
  // 用户是否触发了move事件,起点在onStart, 触发move事件才会执行onEnd, 1. 移动一定会触发onStart, onTouchesMove, onEnd 2. 点击未进行操作, 会触发onTouchsUp
  const isTriggerStart = useSharedValue(false)
  // 记录用户点击时绝对定位坐标
  const preAbsolutePos = useSharedValue(0)
  const timerId = useRef(0 as number | ReturnType<typeof setTimeout>)
  // 用户点击未移动状态下,记录用户上一次操作的transtion 的 direction
  const customTrans = useSharedValue(0)
  const intervalTimer = props.interval || 500
  totalElements.value = children.length
  const {
    // 存储layout布局信息
    layoutRef,
    layoutProps,
    layoutStyle
  } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef, onLayout: onWrapperLayout })

  const innerProps = useInnerProps(props, {
    ref: nodeRef
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
    const { width, height } = e.nativeEvent.layout
    const realWidth = dir.value === 'x' ? width - previousMargin - nextMargin : width
    const realHeight = dir.value === 'y' ? height - previousMargin - nextMargin : height
    setWidthState(realWidth)
    setHeightState(realHeight)
  }

  const dotAnimatedStyle = useAnimatedStyle(() => {
    const step = dir.value === 'x' ? widthState : heightState
    if (isNaN(+step)) return {}
    const dotStep = dotCommonStyle.width + dotCommonStyle.marginRight + dotCommonStyle.marginLeft
    return {
      transform: [{
        translateX: targetIndex.value * dotStep
      }]
    }
  })

  function renderPagination () {
    const stepValue = getStepValue()
    if (totalElements.value <= 1 || isNaN(+stepValue)) return null
    const activeColor = activeDotColor || '#007aff'
    const unActionColor = dotColor || 'rgba(0,0,0,.2)'
    // 正常渲染所有dots
    const dots: Array<ReactNode> = []
    for (let i = 0; i < totalElements.value; i++) {
      dots.push(<View style={[dotCommonStyle, { backgroundColor: unActionColor }]} key={i}></View>)
    }
    return (
      <View pointerEvents="none" style = {[styles['pagination_' + [dir.value as dirType]]]}>
        <View style = {[styles.pagerWrapper]}>
          <Animated.View style={[
            dotCommonStyle,
            activeDotStyle,
            {
              backgroundColor: activeColor,
              position: 'absolute',
              left: 0
            },
            dotAnimatedStyle
          ]}
          />
          {dots}
      </View>
    </View>)
  }

  function renderItems () {
    const pageStyle = { width: widthState, height: heightState }
    let renderChild = children.slice()
    if (props.circular && totalElements.value > 1) {
      // 最前面加最后一个元素
      const lastChild = React.cloneElement(children[totalElements.value - 1] as ReactElement)
      // 最后面加第一个元素
      const firstChild = React.cloneElement(children[0] as ReactElement)
      renderChild = [lastChild].concat(renderChild).concat(firstChild)
    }
    return renderChild.map((child, index) => {
      const extraStyle = {} as { [key: string]: any }
      const xCondition = dir.value === 'x' && typeof widthState === 'number'
      const yCondition = dir.value === 'y' && typeof heightState === 'number'
      if (index === 0 && (xCondition || yCondition)) {
        previousMargin && dir.value === 'x' && (extraStyle.marginLeft = previousMargin)
        previousMargin && dir.value === 'y' && (extraStyle.marginTop = previousMargin)
      }
      if (index === totalElements.value - 1 && (xCondition || yCondition)) {
        nextMargin && dir.value === 'x' && (extraStyle.marginRight = nextMargin)
        nextMargin && dir.value === 'y' && (extraStyle.marginBottom = nextMargin)
      }
      const stepValue = dir.value === 'x' ? widthState : heightState
      const newChild = React.cloneElement(child, { itemIndex: index, scale: props.scale })
      const contextValue = {
        offset,
        stepValue: typeof stepValue === 'number' ? stepValue : 0
      }
      return (<Animated.View
        style={[
          pageStyle,
          extraStyle
        ]}
        key={ 'page' + index}>
        <SwiperContext.Provider value={contextValue}>
          {newChild}
        </SwiperContext.Provider>
      </Animated.View>)
    })
  }

  function createAutoPlay () {
    let targetOffset = 0
    let nextIndex = targetIndex.value
    if (!props.circular) {
      // 获取下一个位置的坐标, 循环到最后一个元素,直接停止, 取消定时器
      if (targetIndex.value === totalElements.value - 1) {
        pauseLoop()
        return
      }
      nextIndex += 1
      targetOffset = -nextIndex * step.value
      offset.value = withTiming(targetOffset, {
        duration: easeDuration,
        easing: easeMap[easeingFunc]
      }, () => {
        offset.value = targetOffset
        targetIndex.value = nextIndex
      })
    } else {
      // 默认向右, 向下
      if (nextIndex === totalElements.value - 1) {
        nextIndex = 0
        targetOffset = -(totalElements.value + patchElementNum) * step.value
        // 执行动画到下一帧
        offset.value = withTiming(targetOffset, {
          duration: easeDuration
        }, () => {
          const initOffset = -step.value * patchElementNum
          // 将开始位置设置为真正的位置
          offset.value = initOffset
          targetIndex.value = nextIndex
        })
      } else {
        nextIndex = targetIndex.value + 1
        targetOffset = -(nextIndex + patchElementNum) * step.value
        // 执行动画到下一帧
        offset.value = withTiming(targetOffset, {
          duration: easeDuration,
          easing: easeMap[easeingFunc]
        }, () => {
          offset.value = targetOffset
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
    'worklet'
    return dir.value === 'x' ? widthState : heightState
  }

  function getInitOffset () {
    const stepValue = getStepValue()
    if (isNaN(+stepValue)) return 0
    let targetOffset = 0
    if (props.circular && totalElements.value > 1) {
      const targetIndex = (props.current || 0) + patchElementNum
      targetOffset = -stepValue * targetIndex
    } else if (props.current && props.current > 0) {
      targetOffset = -props.current * stepValue
    }
    return targetOffset
  }

  function loop () {
    if (!paused.current) {
      timerId.current = setTimeout(() => {
        createAutoPlay()
        loop()
      }, intervalTimer)
    }
  }

  function pauseLoop () {
    paused.current = true
    clearTimeout(timerId.current)
  }

  function resumeLoop () {
    if (props.autoplay && paused.current) {
      paused.current = false
      loop()
    }
  }

  useAnimatedReaction(() => targetIndex.value, (newIndex, preIndex) => {
    // 这里必须传递函数名, 直接写()=> {}形式会报 访问了未sharedValue信息
    const isInit = !preIndex && newIndex === 0
    if (!isInit && props.current !== newIndex && props.bindchange) {
      runOnJS(handleSwiperChange)(newIndex)
    }
  })

  useEffect(() => {
    // 这里stepValue 有时候拿不到
    const stepValue = getStepValue()
    if (isNaN(+stepValue)) {
      return
    }
    step.value = stepValue
    const targetOffset = getInitOffset()
    if (props.current !== undefined && (props.current !== targetIndex.value || (props.current === 0 && targetIndex.value > 0))) {
      targetIndex.value = props.current
      offset.value = withTiming(targetOffset, {
        duration: easeDuration,
        easing: easeMap[easeingFunc]
      }, () => {
        offset.value = targetOffset
      })
    } else if (props.current !== targetIndex.value) {
      offset.value = targetOffset
    }
  }, [props.current, widthState, heightState])

  useEffect(() => {
    const stepValue = getStepValue()
    if (isNaN(+stepValue)) {
      return
    }
    const targetOffset = getInitOffset()
    if (props.autoplay) {
      pauseLoop()
      offset.value = targetOffset
      resumeLoop()
    } else {
      pauseLoop()
    }
    return () => { pauseLoop() }
  }, [props.autoplay, widthState, heightState])

  function getTargetPosition (eventData: EventDataType) {
    'worklet'
    // 移动的距离
    const { translation } = eventData
    let resetOffsetPos = 0
    let selectedIndex = targetIndex.value
    // 是否临界点
    let isCriticalItem = false
    // 真实滚动到的偏移量坐标
    let moveToTargetPos = 0
    // 当前的位置
    const currentOffset = offset.value
    const currentIndex = Math.abs(currentOffset) / step.value
    const moveToIndex = translation < 0 ? Math.ceil(currentIndex) : Math.floor(currentIndex)
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
        selectedIndex = moveToIndex === 0 ? totalElements.value - patchElementNum : totalElements.value - 1
        resetOffsetPos = (selectedIndex + patchElementNum) * step.value
        moveToTargetPos = moveToIndex * step.value
        isCriticalItem = true
      } else {
        selectedIndex = moveToIndex - patchElementNum
        moveToTargetPos = moveToIndex * step.value
      }
    }
    return {
      selectedIndex,
      isCriticalItem,
      resetOffset: -resetOffsetPos,
      targetOffset: -moveToTargetPos
    }
  }

  function canMove (eventData: EventDataType) {
    'worklet'
    const { translation } = eventData
    const stepValue = getStepValue()
    const currentOffset = Math.abs(offset.value)
    if (!props.circular) {
      if (translation < 0) {
        return currentOffset + Math.abs(translation) < stepValue * (totalElements.value - 1)
      } else {
        return currentOffset - Math.abs(translation) > 0
      }
    } else {
      return true
    }
  }

  function handleEnd (eventData: EventDataType) {
    'worklet'
    const { isCriticalItem, targetOffset, resetOffset, selectedIndex } = getTargetPosition(eventData)
    if (isCriticalItem) {
      offset.value = withTiming(targetOffset, {
        duration: easeDuration,
        easing: easeMap[easeingFunc]
      }, () => {
        if (touchfinish.value !== false) {
          targetIndex.value = selectedIndex
          offset.value = resetOffset
          runOnJS(resumeLoop)()
        }
      })
    } else {
      offset.value = withTiming(targetOffset, {
        duration: easeDuration,
        easing: easeMap[easeingFunc]
      }, () => {
        if (touchfinish.value !== false) {
          targetIndex.value = selectedIndex
          offset.value = targetOffset
          runOnJS(resumeLoop)()
        }
      })
    }
  }

  function handleBack (eventData: EventDataType) {
    'worklet'
    const { translation } = eventData
    // 向右滑动的back:trans < 0， 向左滑动的back: trans < 0
    const currentOffset = Math.abs(offset.value)
    const curIndex = currentOffset / step.value
    const moveToIndex = (translation < 0 ? Math.floor(curIndex) : Math.ceil(curIndex)) - patchElementNum
    const targetOffset = -(moveToIndex + patchElementNum) * step.value
    offset.value = withTiming(targetOffset, {
      duration: easeDuration,
      easing: easeMap[easeingFunc]
    }, () => {
      if (touchfinish.value !== false) {
        offset.value = targetOffset
        targetIndex.value = moveToIndex
        runOnJS(resumeLoop)()
      }
    })
  }

  function handleLongPress (eventData: EventDataType) {
    'worklet'
    const { translation } = eventData
    const currentOffset = Math.abs(offset.value)
    const half = currentOffset % step.value > step.value / 2
    // 向右trans < 0, 向左trans > 0
    const isExceedHalf = translation < 0 ? half : !half
    if (+translation === 0) {
      runOnJS(resumeLoop)()
    } else if (isExceedHalf) {
      handleEnd(eventData)
    } else {
      handleBack(eventData)
    }
  }

  function reachBoundary (eventData: EventDataType) {
    'worklet'
    // 移动的距离
    const { translation } = eventData
    const elementsLength = step.value * totalElements.value

    let isBoundary = false
    let resetOffset = 0
    // Y轴向下滚动, transDistance > 0, 向上滚动 < 0 X轴向左滚动, transDistance > 0
    const currentOffset = offset.value
    const moveStep = Math.ceil(translation / elementsLength)
    if (translation < 0) {
      const posEnd = (totalElements.value + patchElementNum + 1) * step.value
      const posReverseEnd = (patchElementNum - 1) * step.value
      if (currentOffset < -posEnd + step.value) {
        isBoundary = true
        resetOffset = Math.abs(moveStep) === 0 ? patchElementNum * step.value + translation : moveStep * elementsLength
      }
      if (currentOffset > -posReverseEnd) {
        isBoundary = true
        resetOffset = moveStep * elementsLength
      }
    } else if (translation > 0) {
      const posEnd = (patchElementNum - 1) * step.value
      const posReverseEnd = (patchElementNum + totalElements.value) * step.value
      if (currentOffset > -posEnd) {
        isBoundary = true
        resetOffset = moveStep * elementsLength + step.value + (moveStep === 1 ? translation : 0)
      }
      if (currentOffset < -posReverseEnd) {
        isBoundary = true
        resetOffset = moveStep * elementsLength + patchElementNum * step.value
      }
    }
    return {
      isBoundary,
      resetOffset: -resetOffset
    }
  }

  const gestureHandler = Gesture.Pan()
    .onBegin((e) => {
      'worklet'
      touchfinish.value = false
      cancelAnimation(offset)
      runOnJS(pauseLoop)()
      preAbsolutePos.value = e[strAbso]
    })
    .onStart(() => {
      'worklet'
      isTriggerStart.value = true
    })
    .onTouchesMove((e) => {
      'worklet'
      const touchEventData = e.changedTouches[0]
      const moveDistance = touchEventData[strAbso] - preAbsolutePos.value
      customTrans.value = moveDistance
      const eventData = {
        translation: moveDistance
      }
      // 处理用户一直拖拽到临界点的场景, 不会执行onEnd
      if (!props.circular && !canMove(eventData)) {
        return
      }
      const { isBoundary, resetOffset } = reachBoundary(eventData)
      if (isBoundary && props.circular && !touchfinish.value) {
        offset.value = resetOffset
      } else {
        offset.value = moveDistance + offset.value
      }
      preAbsolutePos.value = touchEventData[strAbso]
    })
    .onTouchesUp((e) => {
      'worklet'
      // 未触发移动不会触发onStart事件, touches事件拿到的数据只有absoluteX 和 x, 无法判断方向
      if (!isTriggerStart.value) {
        const eventData = {
          translation: customTrans.value
        }
        handleLongPress(eventData)
      }
      isTriggerStart.value = false
      touchfinish.value = true
    })
    .onEnd((e) => {
      'worklet'
      const eventData = {
        translation: e[strTrans]
      }
      if (!props.circular && !canMove(eventData) && isTriggerStart.value) {
        return
      }
      if (Math.abs(e[strVelocity]) < longPressRatio) {
        handleLongPress(eventData)
      } else {
        handleEnd(eventData)
      }
    })

  const animatedStyles = useAnimatedStyle(() => {
    if (dir.value === 'x') {
      return { transform: [{ translateX: offset.value }] }
    } else {
      return { transform: [{ translateY: offset.value }] }
    }
  })

  function renderSwiper () {
    return (<View style={[normalStyle, layoutStyle, styles.swiper]} {...layoutProps} {...innerProps}>
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
SwiperWrapper.displayName = 'MpxSwiperWrapper'

export default SwiperWrapper
