import { View, NativeSyntheticEvent, LayoutChangeEvent } from 'react-native'
import { GestureDetector, Gesture, PanGesture, GestureStateChangeEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing, runOnJS, useAnimatedReaction, cancelAnimation } from 'react-native-reanimated'

import React, { JSX, forwardRef, useRef, useEffect, ReactNode, ReactElement, useMemo, createElement } from 'react'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数
import { useTransformStyle, splitStyle, splitProps, useLayout, wrapChildren, extendObject, GestureHandler, flatGesture } from './utils'
import { SwiperContext } from './context'
import Portal from './mpx-portal'
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
type StrAbsoType = 'absoluteX' | 'absoluteY'
type StrVelocityType = 'velocityX' | 'velocityY'
type EventDataType = {
  translation: number
}
type MoveDataType = {
  // 记录从onBegin到onUpdate/onFinalize 移动的距离
  translation: number
  // 记录移动的方向
  transdir: number
}

interface SwiperProps {
  children?: ReactNode
  circular?: boolean
  current?: number
  interval?: number
  autoplay?: boolean
  // scrollView 只有安卓可以设
  duration?: number
  // 滑动过程中元素是否scale变化
  scale?: boolean
  'indicator-dots'?: boolean
  'indicator-color'?: string
  'indicator-active-color'?: string
  vertical?: boolean
  style: {
    [key: string]: any
  }
  'easing-function'?: EaseType
  'previous-margin'?: string
  'next-margin'?: string
  'enable-offset'?: boolean
  'enable-var': boolean
  'parent-font-size'?: number
  'parent-width'?: number
  'parent-height'?: number
  'external-var-context'?: Record<string, any>
  'wait-for'?: Array<GestureHandler>
  'simultaneous-handlers'?: Array<GestureHandler>
  disableGesture?: boolean
  bindchange?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void
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
  default: Easing.inOut(Easing.cubic),
  linear: Easing.linear,
  easeInCubic: Easing.in(Easing.cubic),
  easeOutCubic: Easing.out(Easing.cubic),
  easeInOutCubic: Easing.inOut(Easing.cubic)
}

const SwiperWrapper = forwardRef<HandlerRef<View, SwiperProps>, SwiperProps>((props: SwiperProps, ref): JSX.Element => {
  const {
    'indicator-dots': showPagination,
    'indicator-color': dotColor = 'rgba(0, 0, 0, .3)',
    'indicator-active-color': activeDotColor = '#000000',
    'enable-var': enableVar = false,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight,
    'external-var-context': externalVarContext,
    'simultaneous-handlers': originSimultaneousHandlers = [],
    'wait-for': waitFor = [],
    style = {},
    autoplay = false,
    circular = false,
    disableGesture = false
  } = props
  const easeingFunc = props['easing-function'] || 'default'
  const easeDuration = props.duration || 500
  const horizontal = props.vertical !== undefined ? !props.vertical : true
  const nodeRef = useRef<View>(null)
  // 手势协同gesture 1.0
  const swiperGestureRef = useRef<PanGesture>()
  useNodesRef<View, SwiperProps>(props, ref, nodeRef, {
    // scrollView内部会过滤是否绑定了gestureRef，withRef(swiperGestureRef)给gesture对象设置一个ref(2.0版本)
    gestureRef: swiperGestureRef
  })
  // 计算transfrom之类的
  const {
    normalStyle,
    hasVarDec,
    varContextRef,
    hasSelfPercent,
    hasPositionFixed,
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
  const preMargin = props['previous-margin'] ? global.__formatValue(props['previous-margin']) as number : 0
  const nextMargin = props['next-margin'] ? global.__formatValue(props['next-margin']) as number : 0
  const preMarginShared = useSharedValue(preMargin)
  const nextMarginShared = useSharedValue(nextMargin)
  const autoplayShared = useSharedValue(autoplay)
  // 默认前后补位的元素个数
  const patchElmNum = circular ? (preMargin ? 2 : 1) : 0
  const patchElmNumShared = useSharedValue(patchElmNum)
  const circularShared = useSharedValue(circular)
  const children = Array.isArray(props.children) ? props.children.filter(child => child) : (props.children ? [props.children] : [])
  // 对有变化的变量，在worklet中只能使用sharedValue变量，useRef不能更新
  const childrenLength = useSharedValue(children.length)
  const initWidth = typeof normalStyle?.width === 'number' ? normalStyle.width - preMargin - nextMargin : normalStyle.width
  const initHeight = typeof normalStyle?.height === 'number' ? normalStyle.height - preMargin - nextMargin : normalStyle.height
  const dir = horizontal === false ? 'y' : 'x'
  const pstep = dir === 'x' ? initWidth : initHeight
  const initStep: number = isNaN(pstep) ? 0 : pstep
  // 每个元素的宽度 or 高度，有固定值直接初始化无则0
  const step = useSharedValue(initStep)
  // 记录选中元素的索引值
  const currentIndex = useSharedValue(props.current || 0)
  // const initOffset = getOffset(props.current || 0, initStep)
  // 记录元素的偏移量
  const offset = useSharedValue(getOffset(props.current || 0, initStep))
  const strAbso = 'absolute' + dir.toUpperCase() as StrAbsoType
  const strVelocity = 'velocity' + dir.toUpperCase as StrVelocityType
  // 标识手指触摸和抬起, 起点在onBegin
  const touchfinish = useSharedValue(true)
  // 记录上一帧的绝对定位坐标
  const preAbsolutePos = useSharedValue(0)
  // 记录从onBegin 到 onTouchesUp 时移动的距离
  const moveTranstion = useSharedValue(0)
  // 记录从onBegin 到 onTouchesUp 的时间
  const moveTime = useSharedValue(0)
  const timerId = useRef(0 as number | ReturnType<typeof setTimeout>)
  const intervalTimer = props.interval || 500

  const simultaneousHandlers = flatGesture(originSimultaneousHandlers)
  const waitForHandlers = flatGesture(waitFor)
  // 判断gesture手势是否需要协同处理、等待手势失败响应
  const gestureSwitch = useRef(false)
  // 初始化上一次的手势
  const prevSimultaneousHandlersRef = useRef<Array<GestureHandler>>(originSimultaneousHandlers || [])
  const prevWaitForHandlersRef = useRef<Array<GestureHandler>>(waitFor || [])
  const hasSimultaneousHandlersChanged = prevSimultaneousHandlersRef.current.length !== (originSimultaneousHandlers?.length || 0) ||
  (originSimultaneousHandlers || []).some((handler, index) => handler !== prevSimultaneousHandlersRef.current[index])

  const hasWaitForHandlersChanged = prevWaitForHandlersRef.current.length !== (waitFor?.length || 0) ||
    (waitFor || []).some((handler, index) => handler !== prevWaitForHandlersRef.current[index])

  if (hasSimultaneousHandlersChanged || hasWaitForHandlersChanged) {
    gestureSwitch.current = !gestureSwitch.current
  }
  // 存储上一次的手势
  prevSimultaneousHandlersRef.current = originSimultaneousHandlers || []
  prevWaitForHandlersRef.current = waitFor || []

  const {
    // 存储layout布局信息
    layoutRef,
    layoutProps,
    layoutStyle
  } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef, onLayout: onWrapperLayout })
  const innerProps = useInnerProps(
    extendObject(
      {},
      props,
      {
        ref: nodeRef
      }
    ),
    [
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
    const realWidth = dir === 'x' ? width - preMargin - nextMargin : width
    const realHeight = dir === 'y' ? height - preMargin - nextMargin : height
    const iStep = dir === 'x' ? realWidth : realHeight
    if (iStep !== step.value) {
      step.value = iStep
      updateCurrent(props.current || 0, iStep)
      updateAutoplay()
    }
  }

  const dotAnimatedStyle = useAnimatedStyle(() => {
    if (!step.value) return {}
    const dotStep = dotCommonStyle.width + dotCommonStyle.marginRight + dotCommonStyle.marginLeft
    if (dir === 'x') {
      return { transform: [{ translateX: currentIndex.value * dotStep }] }
    } else {
      return { transform: [{ translateY: currentIndex.value * dotStep }] }
    }
  })

  function renderPagination () {
    const activeColor = activeDotColor || '#007aff'
    const unActionColor = dotColor || 'rgba(0,0,0,.2)'
    // 正常渲染所有dots
    const dots: Array<ReactNode> = []
    for (let i = 0; i < children.length; i++) {
      dots.push(<View style={[dotCommonStyle, { backgroundColor: unActionColor }]} key={i}></View>)
    }
    return (
      <View pointerEvents="none" style={styles['pagination_' + dir]}>
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
          ]}
          />
          {dots}
        </View>
      </View>)
  }

  function renderItems () {
    const intLen = children.length
    let renderChild = children.slice()
    if (circular && intLen > 1) {
      // 最前面加最后一个元素
      const lastChild = React.cloneElement(children[intLen - 1] as ReactElement, { key: 'clone0' })
      // 最后面加第一个元素
      const firstChild = React.cloneElement(children[0] as ReactElement, { key: 'clone1' })
      if (preMargin) {
        const lastChild1 = React.cloneElement(children[intLen - 2] as ReactElement, { key: 'clone2' })
        const firstChild1 = React.cloneElement(children[1] as ReactElement, { key: 'clone3' })
        renderChild = [lastChild1, lastChild].concat(renderChild).concat([firstChild, firstChild1])
      } else {
        renderChild = [lastChild].concat(renderChild).concat([firstChild])
      }
    }
    const arrChildren = renderChild.map((child, index) => {
      const extraStyle = {} as { [key: string]: any }
      if (index === 0 && !circular) {
        preMargin && dir === 'x' && (extraStyle.marginLeft = preMargin)
        preMargin && dir === 'y' && (extraStyle.marginTop = preMargin)
      }
      if (index === intLen - 1 && !circular) {
        nextMargin && dir === 'x' && (extraStyle.marginRight = nextMargin)
        nextMargin && dir === 'y' && (extraStyle.marginBottom = nextMargin)
      }
      // 业务swiper-item自己生成key，内部添加的元素自定义key
      const newChild = React.cloneElement(child, {
        itemIndex: index,
        customStyle: extraStyle
      })
      return newChild
    })
    const contextValue = {
      offset,
      step,
      scale: props.scale,
      dir
    }
    return (<SwiperContext.Provider value={contextValue}>{arrChildren}</SwiperContext.Provider>)
  }

  const { loop, pauseLoop, resumeLoop } = useMemo(() => {
    function createAutoPlay () {
      if (!step.value) return
      let targetOffset = 0
      let nextIndex = currentIndex.value
      if (!circularShared.value) {
        // 获取下一个位置的坐标, 循环到最后一个元素,直接停止, 取消定时器
        if (currentIndex.value === childrenLength.value - 1) {
          pauseLoop()
          return
        }
        nextIndex += 1
        // targetOffset = -nextIndex * step.value - preMarginShared.value
        targetOffset = -nextIndex * step.value
        offset.value = withTiming(targetOffset, {
          duration: easeDuration,
          easing: easeMap[easeingFunc]
        }, () => {
          currentIndex.value = nextIndex
          runOnJS(loop)()
        })
      } else {
        // 默认向右, 向下
        if (nextIndex === childrenLength.value - 1) {
          nextIndex = 0
          targetOffset = -(childrenLength.value + patchElmNumShared.value) * step.value + preMarginShared.value
          // 执行动画到下一帧
          offset.value = withTiming(targetOffset, {
            duration: easeDuration
          }, () => {
            const initOffset = -step.value * patchElmNumShared.value + preMarginShared.value
            // 将开始位置设置为真正的位置
            offset.value = initOffset
            currentIndex.value = nextIndex
            runOnJS(loop)()
          })
        } else {
          nextIndex = currentIndex.value + 1
          targetOffset = -(nextIndex + patchElmNumShared.value) * step.value + preMarginShared.value
          // 执行动画到下一帧
          offset.value = withTiming(targetOffset, {
            duration: easeDuration,
            easing: easeMap[easeingFunc]
          }, () => {
            currentIndex.value = nextIndex
            runOnJS(loop)()
          })
        }
      }
    }

    // loop在JS线程中调用，createAutoPlay + useEffect中
    function loop () {
      timerId.current && clearTimeout(timerId.current)
      timerId.current = setTimeout(createAutoPlay, intervalTimer)
    }

    function pauseLoop () {
      timerId.current && clearTimeout(timerId.current)
    }
    // resumeLoop在worklet中调用
    function resumeLoop () {
      if (autoplayShared.value && childrenLength.value > 1) {
        loop()
      }
    }
    return {
      loop,
      pauseLoop,
      resumeLoop
    }
  }, [])

  function handleSwiperChange (current: number) {
    if (props.current !== currentIndex.value) {
      const eventData = getCustomEvent('change', {}, { detail: { current, source: 'touch' }, layoutRef: layoutRef })
      props.bindchange && props.bindchange(eventData)
    }
  }

  function getOffset (index: number, stepValue: number) {
    if (!stepValue) return 0
    let targetOffset = 0
    if (circular && children.length > 1) {
      const targetIndex = index + patchElmNum
      targetOffset = -(stepValue * targetIndex - preMargin)
    } else {
      targetOffset = -index * stepValue
    }
    return targetOffset
  }

  function updateCurrent (index: number, stepValue: number) {
    const targetOffset = getOffset(index || 0, stepValue)
    if (targetOffset !== offset.value) {
      // 内部基于props.current!==currentIndex.value决定是否使用动画及更新currentIndex.value
      if (props.current !== undefined && props.current !== currentIndex.value) {
        offset.value = withTiming(targetOffset, {
          duration: easeDuration,
          easing: easeMap[easeingFunc]
        }, () => {
          currentIndex.value = props.current || 0
        })
      } else {
        offset.value = targetOffset
      }
    }
  }
  function updateAutoplay () {
    if (autoplay && children.length > 1) {
      loop()
    } else {
      pauseLoop()
    }
  }
  // 1. 用户在当前页切换选中项，动画；用户携带选中index打开到swiper页直接选中不走动画
  useAnimatedReaction(() => currentIndex.value, (newIndex: number, preIndex: number) => {
    // 这里必须传递函数名, 直接写()=> {}形式会报 访问了未sharedValue信息
    if (newIndex !== preIndex && props.bindchange) {
      runOnJS(handleSwiperChange)(newIndex)
    }
  })

  useEffect(() => {
    let patchStep = 0
    if (preMargin !== preMarginShared.value) {
      patchStep += preMargin - preMarginShared.value
    }
    if (nextMargin !== nextMarginShared.value) {
      patchStep += nextMargin - nextMarginShared.value
    }
    preMarginShared.value = preMargin
    nextMarginShared.value = nextMargin
    const newStep = step.value - patchStep
    if (step.value !== newStep) {
      step.value = newStep
      offset.value = getOffset(currentIndex.value, newStep)
    }
  }, [preMargin, nextMargin])

  useEffect(() => {
    childrenLength.value = children.length
    if (children.length - 1 < currentIndex.value) {
      pauseLoop()
      currentIndex.value = 0
      offset.value = getOffset(0, step.value)
      if (autoplay && children.length > 1) {
        loop()
      }
    }
  }, [children.length])

  useEffect(() => {
    // 1. 如果用户在touch的过程中, 外部更新了current以外部为准（小程序表现）
    // 2. 手指滑动过程中更新索引，外部会把current再传入进来，导致offset直接更新，增加判断不同才更新
    if (props.current !== currentIndex.value) {
      updateCurrent(props.current || 0, step.value)
    }
  }, [props.current])

  useEffect(() => {
    autoplayShared.value = autoplay
    updateAutoplay()
    return () => {
      if (autoplay) {
        pauseLoop()
      }
    }
  }, [autoplay])

  useEffect(() => {
    if (circular !== circularShared.value) {
      circularShared.value = circular
      patchElmNumShared.value = circular ? (preMargin ? 2 : 1) : 0
      offset.value = getOffset(currentIndex.value, step.value)
    }
  }, [circular, preMargin])
  const { gestureHandler } = useMemo(() => {
    function getTargetPosition (eventData: EventDataType) {
      'worklet'
      // 移动的距离
      const { translation } = eventData
      let resetOffsetPos = 0
      let selectedIndex = currentIndex.value
      // 是否临界点
      let isCriticalItem = false
      // 真实滚动到的偏移量坐标
      let moveToTargetPos = 0
      const tmp = !circularShared.value ? 0 : preMarginShared.value
      const currentOffset = translation < 0 ? offset.value - tmp : offset.value + tmp
      const computedIndex = Math.abs(currentOffset) / step.value
      const moveToIndex = translation < 0 ? Math.ceil(computedIndex) : Math.floor(computedIndex)
      // 实际应该定位的索引值
      if (!circularShared.value) {
        selectedIndex = moveToIndex
        moveToTargetPos = selectedIndex * step.value
      } else {
        if (moveToIndex >= childrenLength.value + patchElmNumShared.value) {
          selectedIndex = moveToIndex - (childrenLength.value + patchElmNumShared.value)
          resetOffsetPos = (selectedIndex + patchElmNumShared.value) * step.value - preMarginShared.value
          moveToTargetPos = moveToIndex * step.value - preMarginShared.value
          isCriticalItem = true
        } else if (moveToIndex <= patchElmNumShared.value - 1) {
          selectedIndex = moveToIndex === 0 ? childrenLength.value - patchElmNumShared.value : childrenLength.value - 1
          resetOffsetPos = (selectedIndex + patchElmNumShared.value) * step.value - preMarginShared.value
          moveToTargetPos = moveToIndex * step.value - preMarginShared.value
          isCriticalItem = true
        } else {
          selectedIndex = moveToIndex - patchElmNumShared.value
          moveToTargetPos = moveToIndex * step.value - preMarginShared.value
        }
      }
      return {
        selectedIndex,
        isCriticalItem,
        resetOffset: -resetOffsetPos,
        targetOffset: -moveToTargetPos
      }
    }
    function canMove (moveData: MoveDataType) {
      'worklet'
      // 旧版：如果在快速多次滑动时，只根据当前的offset判断，会出现offset没超出，加上translation后越界的场景(如在倒数第二个元素快速滑动)
      // 新版：会加上translation
      const { translation, transdir } = moveData
      const gestureMovePos = offset.value + translation
      if (!circularShared.value) {
        if (transdir < 0) {
          return gestureMovePos > -step.value * (childrenLength.value - 1)
        } else {
          return gestureMovePos < 0
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
            currentIndex.value = selectedIndex
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
            currentIndex.value = selectedIndex
            runOnJS(resumeLoop)()
          }
        })
      }
    }
    function handleBackInit () {
      'worklet'
      // 微信的效果
      // 1. 只有一个元素，即使设置了circular，也不会产生循环的效果，2. 可以响应手势，但是会有回弹的效果
      offset.value = withTiming(0, {
        duration: easeDuration,
        easing: easeMap[easeingFunc]
      })
    }
    function handleBack (eventData: EventDataType) {
      'worklet'
      const { translation } = eventData
      // 向右滑动的back:trans < 0， 向左滑动的back: trans < 0
      let currentOffset = Math.abs(offset.value)
      if (circularShared.value) {
        currentOffset += translation < 0 ? preMarginShared.value : -preMarginShared.value
      }
      const curIndex = currentOffset / step.value
      const moveToIndex = (translation < 0 ? Math.floor(curIndex) : Math.ceil(curIndex)) - patchElmNumShared.value
      const targetOffset = -(moveToIndex + patchElmNumShared.value) * step.value + (circularShared.value ? preMarginShared.value : 0)
      offset.value = withTiming(targetOffset, {
        duration: easeDuration,
        easing: easeMap[easeingFunc]
      }, () => {
        if (touchfinish.value !== false) {
          currentIndex.value = moveToIndex
          runOnJS(resumeLoop)()
        }
      })
    }
    function computeHalf () {
      'worklet'
      const currentOffset = Math.abs(offset.value)
      let preOffset = (currentIndex.value + patchElmNumShared.value) * step.value
      if (circularShared.value) {
        preOffset -= preMarginShared.value
      }
      // 正常事件中拿到的translation值(正向滑动<0，倒着滑>0)
      const diffOffset = preOffset - currentOffset
      const half = Math.abs(diffOffset) > step.value / 2
      return {
        diffOffset,
        half
      }
    }
    function handleLongPress () {
      'worklet'
      const { diffOffset, half } = computeHalf()
      if (+diffOffset === 0) {
        runOnJS(resumeLoop)()
      } else if (half) {
        handleEnd({ translation: diffOffset })
      } else {
        handleBack({ translation: diffOffset })
      }
    }
    function reachBoundary (eventData: EventDataType) {
      'worklet'
      // 移动的距离
      const { translation } = eventData
      const elementsLength = step.value * childrenLength.value
      let isBoundary = false
      let resetOffset = 0
      // Y轴向下滚动, transDistance > 0, 向上滚动 < 0 X轴向左滚动, transDistance > 0
      const currentOffset = offset.value
      // 滑动未超过元素长度moveStep=1， 其它连续滑动moveStep>1
      const moveStep = Math.ceil(translation / elementsLength)
      if (translation < 0) {
        const posEnd = (childrenLength.value + patchElmNumShared.value) * step.value
        const posReverseEnd = (patchElmNumShared.value - 1) * step.value
        if (currentOffset < -posEnd) {
          isBoundary = true
          // currentOffset + posEnd当前超过边界的值， 还需要加上transition的值，才是真正的超出边界的值
          const exceedLength = Math.abs(currentOffset + posEnd) + Math.abs(translation)
          // 计算对标正常元素所在的offset
          resetOffset = Math.abs(moveStep) === 0 ? patchElmNumShared.value * step.value + exceedLength : moveStep * elementsLength
        }
        if (currentOffset > -posReverseEnd) {
          isBoundary = true
          resetOffset = moveStep * elementsLength
        }
      } else if (translation > 0) {
        // 和translation<0的计算end保持一致
        const posEnd = patchElmNumShared.value * step.value
        const posReverseEnd = (patchElmNumShared.value + childrenLength.value) * step.value
        if (currentOffset > -posEnd) {
          isBoundary = true
          // 滑动超出的长度
          const exceedLength = Math.abs(currentOffset + posEnd)
          // 反向应该展示的长度
          const rectifyLength = step.value - exceedLength - translation
          // 前置补位元素应增加的长度
          const patchLength = (patchElmNumShared.value - 1) * step.value
          resetOffset = moveStep * elementsLength + patchLength + (moveStep === 1 ? rectifyLength : 0)
        }
        if (currentOffset < -posReverseEnd) {
          isBoundary = true
          resetOffset = moveStep * elementsLength + patchElmNumShared.value * step.value
        }
      }
      return {
        isBoundary,
        resetOffset: -resetOffset
      }
    }
    // 非循环超出边界，应用阻力; 开始滑动少阻力小，滑动越长阻力越大
    function handleResistanceMove (eventData: EventDataType) {
      'worklet'
      const { translation } = eventData
      const moveToOffset = offset.value + translation
      const maxOverDrag = Math.floor(step.value / 2)
      const maxOffset = translation < 0 ? -(childrenLength.value - 1) * step.value : 0
      let resistance = 0.1
      let overDrag = 0
      let finalOffset = 0
      // 向右向下小于0, 向左向上大于0；
      if (translation < 0) {
        overDrag = Math.abs(moveToOffset - maxOffset)
      } else {
        overDrag = Math.abs(moveToOffset)
      }
      // 滑动越多resistance越小
      resistance = 1 - overDrag / maxOverDrag
      // 确保阻力在合理范围内
      resistance = Math.min(0.5, resistance)
      // 限制在最大拖拽范围内
      if (translation < 0) {
        const adjustOffset = offset.value + translation * resistance
        finalOffset = Math.max(adjustOffset, maxOffset - maxOverDrag)
      } else {
        const adjustOffset = offset.value + translation * resistance
        finalOffset = Math.min(adjustOffset, maxOverDrag)
      }
      return finalOffset
    }
    const gesturePan = Gesture.Pan()
      .onBegin((e: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
        'worklet'
        if (!step.value) return
        touchfinish.value = false
        cancelAnimation(offset)
        runOnJS(pauseLoop)()
        preAbsolutePos.value = e[strAbso]
        moveTranstion.value = e[strAbso]
        moveTime.value = new Date().getTime()
      })
      .onUpdate((e: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
        'worklet'
        if (touchfinish.value) return
        const moveDistance = e[strAbso] - preAbsolutePos.value
        const eventData = {
          translation: moveDistance
        }
        // 1. 支持滑动中超出一半更新索引的能力：只更新索引并不会影响onFinalize依据当前offset计算的索引
        const { half } = computeHalf()
        if (childrenLength.value > 1 && half) {
          const { selectedIndex } = getTargetPosition(eventData)
          currentIndex.value = selectedIndex
        }
        // 2. 非循环: 处理用户一直拖拽到临界点的场景,如果放到onFinalize无法阻止offset.value更新为越界的值
        const moveData = {
          translation: moveDistance,
          transdir: moveDistance
        }
        if (!circularShared.value) {
          if (canMove(moveData)) {
            offset.value = moveDistance + offset.value
          } else {
            const finalOffset = handleResistanceMove(eventData)
            offset.value = finalOffset
          }
          preAbsolutePos.value = e[strAbso]
          return
        }
        // 3. 循环更新: 只有一个元素时可滑动，加入阻力
        if (circularShared.value && childrenLength.value === 1) {
          const finalOffset = handleResistanceMove(eventData)
          offset.value = finalOffset
          preAbsolutePos.value = e[strAbso]
          return
        }
        // 4. 循环更新：正常
        const { isBoundary, resetOffset } = reachBoundary(eventData)
        if (childrenLength.value > 1 && isBoundary && circularShared.value) {
          offset.value = resetOffset
        } else {
          offset.value = moveDistance + offset.value
        }
        preAbsolutePos.value = e[strAbso]
      })
      .onFinalize((e: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
        'worklet'
        if (touchfinish.value) return
        const moveDistance = e[strAbso] - moveTranstion.value
        touchfinish.value = true
        // 记录从onBegin到onFinalize移动的距离，translation主要用于后续判断方向
        const eventData = {
          translation: moveDistance
        }
        // 1. 触发过onUpdate正常情况下e[strAbso] - preAbsolutePos.value=0
        // 2. 未出发过onUpdate的情况下e[strAbso] - preAbsolutePos.value 不为0
        const moveData = {
          translation: e[strAbso] - preAbsolutePos.value,
          transdir: moveDistance
        }
        // 1. 只有一个元素：循环 和 非循环状态，都走回弹效果
        if (childrenLength.value === 1) {
          offset.value = withTiming(0, {
            duration: easeDuration,
            easing: easeMap[easeingFunc]
          })
          return
        }
        // 2.非循环状态不可移动态：最后一个元素 和 第一个元素
        // 非循环支持最后元素可滑动能力后，向左快速移动未超过最大可移动范围一半，因为offset为正值，向左滑动handleBack，默认向上取整
        // 但是在offset大于0时，取0。[-100, 0](back取0), [0, 100](back取1)， 所以handleLongPress里的处理逻辑需要兼容支持，因此这里直接单独处理，不耦合下方公共的判断逻辑。
        if (!circularShared.value && !canMove(moveData)) {
          if (moveDistance < 0) {
            handleBack(eventData)
          } else {
            handleEnd(eventData)
          }
          return
        }
        // 3. 非循环状态可移动态、循环状态, 正常逻辑处理
        const velocity = e[strVelocity]
        if (Math.abs(velocity) < longPressRatio) {
          handleLongPress()
        } else {
          handleEnd(eventData)
        }
      })
      .withRef(swiperGestureRef)
    // swiper横向,当y轴滑动5像素手势失效；swiper纵向只响应swiper的滑动事件
    if (dir === 'x') {
      gesturePan.activeOffsetX([-2, 2]).failOffsetY([-5, 5])
    } else {
      gesturePan.activeOffsetY([-2, 2]).failOffsetX([-5, 5])
    }
    // 手势协同2.0
    if (simultaneousHandlers && simultaneousHandlers.length) {
      gesturePan.simultaneousWithExternalGesture(...simultaneousHandlers)
    }

    if (waitForHandlers && waitForHandlers.length) {
      gesturePan.requireExternalGestureToFail(...waitForHandlers)
    }
    return {
      gestureHandler: gesturePan
    }
  }, [gestureSwitch.current])

  const animatedStyles = useAnimatedStyle(() => {
    if (dir === 'x') {
      return { transform: [{ translateX: offset.value }], opacity: step.value > 0 ? 1 : 0 }
    } else {
      return { transform: [{ translateY: offset.value }], opacity: step.value > 0 ? 1 : 0 }
    }
  })

  let finalComponent: JSX.Element
  const arrPages: Array<ReactNode> | ReactNode = renderItems()
  const mergeProps = Object.assign({
    style: [normalStyle, layoutStyle, styles.swiper]
  }, layoutProps, innerProps)
  const animateComponent = createElement(Animated.View, {
    style: [{ flexDirection: dir === 'x' ? 'row' : 'column', width: '100%', height: '100%' }, animatedStyles]
  }, wrapChildren({
    children: arrPages
  }, {
    hasVarDec,
    varContext: varContextRef.current,
    textStyle,
    textProps
  }))
  const renderChildrens = showPagination ? [animateComponent, renderPagination()] : animateComponent
  finalComponent = createElement(View, mergeProps, renderChildrens)
  if (!disableGesture) {
    finalComponent = createElement(GestureDetector, {
      gesture: gestureHandler
    }, finalComponent)
  }
  if (hasPositionFixed) {
    finalComponent = createElement(Portal, null, finalComponent)
  }
  return finalComponent
})
SwiperWrapper.displayName = 'MpxSwiperWrapper'

export default SwiperWrapper
