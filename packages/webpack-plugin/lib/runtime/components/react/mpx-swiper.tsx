import { View, NativeSyntheticEvent, LayoutChangeEvent } from 'react-native'
import { GestureDetector, Gesture, PanGesture, GestureStateChangeEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing, runOnJS, useAnimatedReaction, cancelAnimation, SharedValue } from 'react-native-reanimated'

import React, { JSX, forwardRef, useRef, useEffect, useState, ReactNode, ReactElement, useMemo, createElement } from 'react'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数
import { useTransformStyle, splitStyle, splitProps, useLayout, wrapChildren, extendObject, GestureHandler, flatGesture, useRunOnJSCallback } from './utils'
import { SwiperContext } from './context'
import Portal from './mpx-portal'
/**
 * ✔ indicator-dots
 * ✔ indicator-color
 * ✔ indicator-width
 * ✔ indicator-height
 * ✔ indicator-radius
 * ✔ indicator-spacing
 * ✔ indicator-margin
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
 * ✔ display-multiple-items
 * ✘ snap-to-edge
 */
type EaseType = 'default' | 'linear' | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic'
type StrAbsoType = 'absoluteX' | 'absoluteY'
type StrVelocityType = 'velocityX' | 'velocityY'
type EventDataType = {
  // 和上一帧offset值的对比
  translation: number
  // onUpdate时根据上一个判断方向，onFinalize根据transformStart判断
  transdir: number
}
// 只基于方向 + offset 计算最终的索引
type EventEndType = {
  transdir: number
}

function normalizeDisplayMultipleItems (value: number | string | undefined) {
  const displayMultipleItems = Math.floor(Number(value))
  return Number.isFinite(displayMultipleItems) ? Math.max(1, displayMultipleItems) : 1
}

function getSwiperMaxIndex (childrenLength: number, displayMultipleItems: number, circular: boolean) {
  'worklet'
  return Math.max(0, childrenLength - (circular ? 1 : displayMultipleItems))
}

function normalizeSwiperCurrent (
  current: number | string,
  childrenLength: number,
  displayMultipleItems: number,
  circular: boolean
) {
  const currentIndex = Math.floor(Number(current))
  if (!Number.isFinite(currentIndex)) return 0
  return Math.min(Math.max(0, currentIndex), getSwiperMaxIndex(childrenLength, displayMultipleItems, circular))
}

function getSwiperStep (
  mainAxisSize: number,
  previousMargin: number,
  nextMargin: number,
  displayMultipleItems: number
) {
  const step = (mainAxisSize - previousMargin - nextMargin) / displayMultipleItems
  return Number.isFinite(step) && step > 0 ? step : 0
}

function getSwiperPatchElmNum (
  circular: boolean,
  childrenLength: number,
  displayMultipleItems: number,
  hasEdgeMargin: boolean,
  viewportSize: number,
  step: number
) {
  if (!circular || childrenLength <= 1) return 0
  const basePatchElmNum = displayMultipleItems + (hasEdgeMargin ? 1 : 0)
  const viewportItemCount = Math.ceil(viewportSize / step)
  return Number.isFinite(viewportItemCount)
    ? Math.max(basePatchElmNum, viewportItemCount)
    : basePatchElmNum
}

function getCircularIndex (index: number, childrenLength: number) {
  'worklet'
  if (!childrenLength) return 0
  return ((index % childrenLength) + childrenLength) % childrenLength
}

function isSwiperDotActive (
  dotIndex: number,
  currentIndex: number,
  displayMultipleItems: number,
  childrenLength: number,
  circular: boolean
) {
  'worklet'
  if (dotIndex < 0 || dotIndex >= childrenLength) return false
  const activeDotCount = Math.min(displayMultipleItems, childrenLength)
  if (!circular) return dotIndex >= currentIndex && dotIndex < currentIndex + activeDotCount
  return getCircularIndex(dotIndex - currentIndex, childrenLength) < activeDotCount
}

function getCircularBoundary (
  moveToOffset: number,
  childrenLength: number,
  patchElmNum: number,
  step: number,
  viewportSize: number
) {
  'worklet'
  if (childrenLength <= 0 || step <= 0) {
    return {
      isBoundary: false,
      resetOffset: 0
    }
  }
  const boundaryStart = 0
  const boundaryEnd = Math.max(
    -(childrenLength + patchElmNum) * step,
    -((childrenLength + patchElmNum * 2) * step - viewportSize)
  )
  const cycleSize = childrenLength * step
  if (moveToOffset < boundaryEnd) {
    return {
      isBoundary: true,
      resetOffset: moveToOffset + Math.ceil((boundaryEnd - moveToOffset) / cycleSize) * cycleSize
    }
  }
  if (moveToOffset > boundaryStart) {
    return {
      isBoundary: true,
      resetOffset: moveToOffset - Math.ceil((moveToOffset - boundaryStart) / cycleSize) * cycleSize
    }
  }
  return {
    isBoundary: false,
    resetOffset: 0
  }
}

function getSwiperPositionOffset (offset: number, circular: boolean, previousMargin: number) {
  'worklet'
  return Math.abs(offset - (circular ? previousMargin : 0))
}

interface SwiperProps {
  children?: ReactNode
  circular?: boolean
  current?: number | string
  interval?: number
  autoplay?: boolean
  // scrollView 只有安卓可以设
  duration?: number
  // 滑动过程中元素是否scale变化
  scale?: boolean
  'indicator-dots'?: boolean
  'indicator-color'?: string
  'indicator-width'?: number
  'indicator-height'?: number
  'indicator-spacing'?: number
  'indicator-radius'?: number
  'indicator-margin'?: number
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
  'display-multiple-items'?: number | string
  bindchange?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void
  bindchangestart?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void
}

/**
 * 默认的Style类型
 */
const styles: { [key: string]: Object } = {
  pagination_x: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  pagination_y: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end'
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

interface SwiperDotProps {
  index: number
  currentIndex: SharedValue<number>
  displayMultipleItems: SharedValue<number>
  childrenLength: SharedValue<number>
  circular: SharedValue<boolean>
  activeColor: string
  inactiveColor: string
  style: Object
}

function SwiperDot ({
  index,
  currentIndex,
  displayMultipleItems,
  childrenLength,
  circular,
  activeColor,
  inactiveColor,
  style
}: SwiperDotProps) {
  const dotAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: isSwiperDotActive(index, currentIndex.value, displayMultipleItems.value, childrenLength.value, circular.value)
      ? activeColor
      : inactiveColor
  }))
  return <Animated.View style={[style, dotAnimatedStyle]} />
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
    'indicator-width': dotWidth = 8,
    'indicator-height': dotHeight = 8,
    'indicator-radius': dotRadius = 4,
    'indicator-spacing': dotSpacing = 4,
    'indicator-margin': paginationMargin = 10,
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
    disableGesture = false,
    current: propCurrent = 0,
    bindchange,
    bindchangestart
  } = props

  const dotCommonStyle = {
    width: dotWidth,
    height: dotHeight,
    borderRadius: dotRadius,
    marginLeft: dotSpacing,
    marginRight: dotSpacing,
    marginTop: dotSpacing,
    marginBottom: dotSpacing,
    zIndex: 98
  }
  const displayMultipleItems = normalizeDisplayMultipleItems(props['display-multiple-items'])
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
  const hasEdgeMargin = !!preMargin || !!nextMargin
  const preMarginShared = useSharedValue(preMargin)
  const nextMarginShared = useSharedValue(nextMargin)
  const autoplayShared = useSharedValue(autoplay)
  // 支持swiper-item 同时存在<swiper-item wx:for/>和<swiper-item>并列的情况
  const children = React.Children.toArray(props.children) as ReactElement[]
  const displayMultipleItemsShared = useSharedValue(displayMultipleItems)
  const circularShared = useSharedValue(circular)
  // 对有变化的变量，在worklet中只能使用sharedValue变量，useRef不能更新
  const childrenLength = useSharedValue(children.length)
  const dir = horizontal === false ? 'y' : 'x'
  const mainAxisSize = dir === 'x' ? normalStyle?.width : normalStyle?.height
  const initMainAxisSize = typeof mainAxisSize === 'number' ? mainAxisSize : 0
  const [layoutMainAxisSize, setLayoutMainAxisSize] = useState(initMainAxisSize)
  const mainAxisSizeShared = useSharedValue(layoutMainAxisSize)
  const initStep = getSwiperStep(layoutMainAxisSize, preMargin, nextMargin, displayMultipleItems)
  // 前后补位需要覆盖整个视口，避免边距较大时动画过程露白
  const patchElmNum = getSwiperPatchElmNum(circular, children.length, displayMultipleItems, hasEdgeMargin, layoutMainAxisSize, initStep)
  const patchElmNumShared = useSharedValue(patchElmNum)
  // 每个元素的宽度 or 高度，有固定值直接初始化无则0
  const step = useSharedValue(initStep)
  const initCurrent = normalizeSwiperCurrent(propCurrent, children.length, displayMultipleItems, circular)
  // 记录选中元素的索引值
  const currentIndex = useSharedValue(initCurrent)
  // 记录动画或手势已选定、但可能尚未完成切换的目标索引
  const targetIndex = useSharedValue(initCurrent)
  // const initOffset = getOffset(props.current || 0, initStep)
  // 记录元素的偏移量
  const offset = useSharedValue(getOffset(initCurrent, initStep))
  const strAbso = 'absolute' + dir.toUpperCase() as StrAbsoType
  const strVelocity = 'velocity' + dir.toUpperCase() as StrVelocityType
  // 标识手指触摸和抬起, 起点在onBegin
  const touchfinish = useSharedValue(true)
  // 记录上一帧的绝对定位坐标
  const preAbsolutePos = useSharedValue(0)
  // 记录从onBegin 到 onTouchesUp 时移动的距离
  const moveTranstion = useSharedValue(0)
  // 记录用户手滑动的方向
  const moveDir = useSharedValue(0)
  const timerId = useRef(0 as number | ReturnType<typeof setTimeout>)
  const propCurrentRef = useRef(propCurrent)
  const intervalTimer = props.interval || 500
  // 记录是否首次，首次不能触发bindchange回调
  const isFirstShared = useSharedValue(true)

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
      'indicator-width',
      'indicator-active-color',
      'previous-margin',
      'vertical',
      'previous-margin',
      'next-margin',
      'easing-function',
      'autoplay',
      'circular',
      'interval',
      'easing-function',
      'display-multiple-items'
    ], { layoutRef: layoutRef })

  function onWrapperLayout (e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout
    const newMainAxisSize = dir === 'x' ? width : height
    const iStep = getSwiperStep(newMainAxisSize, preMargin, nextMargin, displayMultipleItems)
    const nextPatchElmNum = getSwiperPatchElmNum(circular, children.length, displayMultipleItems, hasEdgeMargin, newMainAxisSize, iStep)
    mainAxisSizeShared.value = newMainAxisSize
    if (newMainAxisSize !== layoutMainAxisSize) setLayoutMainAxisSize(newMainAxisSize)
    if (nextPatchElmNum !== patchElmNum) {
      pauseLoop()
      return
    }
    if (iStep !== step.value) {
      step.value = iStep
      syncCurrent(targetIndex.value, iStep)
      updateAutoplay()
    }
  }

  function renderPagination () {
    const activeColor = activeDotColor || '#007aff'
    const unActionColor = dotColor || 'rgba(0,0,0,.2)'
    // 正常渲染所有dots
    const dots: Array<ReactNode> = []
    for (let i = 0; i < children.length; i++) {
      dots.push(<SwiperDot
        index={i}
        currentIndex={currentIndex}
        displayMultipleItems={displayMultipleItemsShared}
        childrenLength={childrenLength}
        circular={circularShared}
        activeColor={activeColor}
        inactiveColor={unActionColor}
        style={dotCommonStyle}
        key={i}
      />)
    }
    let paginationStyle = styles['pagination_' + dir]
    if (paginationMargin) {
      paginationStyle = {
        ...paginationStyle,
        marginBottom: paginationMargin,
        marginLeft: paginationMargin,
        marginRight: paginationMargin,
        marginTop: paginationMargin
      }
    }
    return (
      <View pointerEvents="none" style={paginationStyle} key="pagination">
        <View style={[styles['pagerWrapper' + dir]]}>
          {dots}
        </View>
      </View>)
  }

  function renderItems () {
    const intLen = children.length
    let renderChild = children.slice()
    // if (circular && intLen > 1) {
    //   // 最前面加最后一个元素
    //   const lastChild = React.cloneElement(children[intLen - 1] as ReactElement, { key: 'clone0' })
    //   // 最后面加第一个元素
    //   const firstChild = React.cloneElement(children[0] as ReactElement, { key: 'clone1' })
    //   if (preMargin) {
    //     const lastChild1 = React.cloneElement(children[intLen - 2] as ReactElement, { key: 'clone2' })
    //     const firstChild1 = React.cloneElement(children[1] as ReactElement, { key: 'clone3' })
    //     renderChild = [lastChild1, lastChild].concat(renderChild).concat([firstChild, firstChild1])
    //   } else {
    //     renderChild = [lastChild].concat(renderChild).concat([firstChild])
    //   }
    // }
    if (circular && intLen > 1) {
      // 动态生成前置补位元素
      const frontClones = []
      // 计算补位序列的起始索引。例如 len=3, patch=2 -> start=1 (即从B开始)
      const startIndex = intLen - (patchElmNum % intLen)
      for (let i = 0; i < patchElmNum; i++) {
        const sourceIndex = (startIndex + i) % intLen
        frontClones.push(React.cloneElement(children[sourceIndex], { key: `clone_front_${i}` }))
      }
      // 动态生成后置补位元素
      const backClones = []
      for (let i = 0; i < patchElmNum; i++) {
        const sourceIndex = i % intLen
        backClones.push(React.cloneElement(children[sourceIndex], { key: `clone_back_${i}` }))
      }
      renderChild = [...frontClones, ...renderChild, ...backClones]
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
        const maxIndex = getSwiperMaxIndex(childrenLength.value, displayMultipleItemsShared.value, false)
        if (currentIndex.value >= maxIndex) {
          pauseLoop()
          return
        }
        nextIndex += 1
        // targetOffset = -nextIndex * step.value - preMarginShared.value
        targetOffset = -nextIndex * step.value
        targetIndex.value = nextIndex
        runOnJSCallback('handleSwiperChangeStart', nextIndex)
        offset.value = withTiming(targetOffset, {
          duration: easeDuration,
          easing: easeMap[easeingFunc]
        }, (finished) => {
          if (finished && targetIndex.value === nextIndex) {
            currentIndex.value = nextIndex
            runOnJS(runOnJSCallback)('loop')
          }
        })
      } else {
        // 默认向右, 向下
        if (nextIndex === childrenLength.value - 1) {
          nextIndex = 0
          targetOffset = -(childrenLength.value + patchElmNumShared.value) * step.value + preMarginShared.value
          // 执行动画到下一帧
          targetIndex.value = nextIndex
          runOnJSCallback('handleSwiperChangeStart', nextIndex)
          offset.value = withTiming(targetOffset, {
            duration: easeDuration
          }, (finished) => {
            if (finished && targetIndex.value === nextIndex) {
              const initOffset = -step.value * patchElmNumShared.value + preMarginShared.value
              // 将开始位置设置为真正的位置
              offset.value = initOffset
              currentIndex.value = nextIndex
              runOnJS(runOnJSCallback)('loop')
            }
          })
        } else {
          nextIndex = currentIndex.value + 1
          targetOffset = -(nextIndex + patchElmNumShared.value) * step.value + preMarginShared.value
          // 执行动画到下一帧
          targetIndex.value = nextIndex
          runOnJSCallback('handleSwiperChangeStart', nextIndex)
          offset.value = withTiming(targetOffset, {
            duration: easeDuration,
            easing: easeMap[easeingFunc]
          }, (finished) => {
            if (finished && targetIndex.value === nextIndex) {
              currentIndex.value = nextIndex
              runOnJS(runOnJSCallback)('loop')
            }
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
    const eventData = getCustomEvent('change', {}, { detail: { current, source: 'touch' }, layoutRef: layoutRef })
    bindchange && bindchange(eventData)
  }

  function handleSwiperChangeStart (current: number) {
    const eventData = getCustomEvent('changestart', {}, { detail: { current }, layoutRef: layoutRef })
    bindchangestart && bindchangestart(eventData)
  }

  const runOnJSCallbackRef = useRef({
    loop,
    pauseLoop,
    resumeLoop,
    handleSwiperChange,
    handleSwiperChangeStart
  })
  const runOnJSCallback = useRunOnJSCallback(runOnJSCallbackRef)

  function getOffset (index: number, stepValue: number) {
    if (!stepValue) return 0
    let targetOffset = 0
    if (circular && children.length > 1) {
      const targetPositionIndex = index + patchElmNum
      targetOffset = -(stepValue * targetPositionIndex - preMargin)
    } else {
      targetOffset = -index * stepValue
    }
    return targetOffset
  }

  function syncCurrent (index: number | string, stepValue: number) {
    const nextCurrent = normalizeSwiperCurrent(index, children.length, displayMultipleItems, circular)
    if (nextCurrent !== currentIndex.value && nextCurrent !== targetIndex.value) {
      runOnJSCallback('handleSwiperChangeStart', nextCurrent)
    }
    touchfinish.value = true
    cancelAnimation(offset)
    targetIndex.value = nextCurrent
    offset.value = getOffset(nextCurrent, stepValue)
    currentIndex.value = nextCurrent
  }

  function updateCurrent (index: number | string, stepValue: number) {
    const nextCurrent = normalizeSwiperCurrent(index, children.length, displayMultipleItems, circular)
    if (nextCurrent === targetIndex.value) return
    pauseLoop()
    if (touchfinish.value === false) touchfinish.value = true
    const targetOffset = getOffset(nextCurrent, stepValue)
    cancelAnimation(offset)
    targetIndex.value = nextCurrent
    if (nextCurrent !== currentIndex.value) {
      runOnJSCallback('handleSwiperChangeStart', nextCurrent)
      if (targetOffset !== offset.value) {
        offset.value = withTiming(targetOffset, {
          duration: easeDuration,
          easing: easeMap[easeingFunc]
        }, (finished) => {
          if (finished && targetIndex.value === nextCurrent) {
            currentIndex.value = nextCurrent
            runOnJS(runOnJSCallback)('resumeLoop')
          }
        })
      } else {
        currentIndex.value = nextCurrent
        updateAutoplay()
      }
    } else {
      cancelAnimation(offset)
      offset.value = targetOffset
      updateAutoplay()
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
    if (isFirstShared.value) {
      isFirstShared.value = false
      return
    }
    // 这里必须传递函数名, 直接写()=> {}形式会报 访问了未sharedValue信息
    if (newIndex !== preIndex && bindchange) {
      runOnJS(runOnJSCallback)('handleSwiperChange', newIndex, propCurrent)
    }
  })

  useEffect(() => {
    // 1. 如果用户在touch的过程中, 外部更新了current以外部为准（小程序表现）
    // 2. 手指滑动过程中更新索引，外部会把current再传入进来，导致offset直接更新，增加判断不同才更新
    const propCurrentChanged = !Object.is(propCurrent, propCurrentRef.current)
    const configChanged = preMargin !== preMarginShared.value ||
      nextMargin !== nextMarginShared.value ||
      circular !== circularShared.value ||
      patchElmNum !== patchElmNumShared.value ||
      displayMultipleItems !== displayMultipleItemsShared.value ||
      children.length !== childrenLength.value
    if (!propCurrentChanged && !configChanged) return
    propCurrentRef.current = propCurrent
    preMarginShared.value = preMargin
    nextMarginShared.value = nextMargin
    circularShared.value = circular
    patchElmNumShared.value = patchElmNum
    displayMultipleItemsShared.value = displayMultipleItems
    childrenLength.value = children.length
    const newStep = getSwiperStep(mainAxisSizeShared.value, preMargin, nextMargin, displayMultipleItems)
    step.value = newStep
    if (configChanged) {
      syncCurrent(propCurrentChanged ? propCurrent : targetIndex.value, newStep)
      updateAutoplay()
    } else {
      updateCurrent(propCurrent, newStep)
    }
  }, [propCurrent, preMargin, nextMargin, circular, patchElmNum, displayMultipleItems, children.length])

  useEffect(() => {
    autoplayShared.value = autoplay
    updateAutoplay()
    return () => {
      if (autoplay) {
        pauseLoop()
      }
    }
  }, [autoplay])
  const { gestureHandler } = useMemo(() => {
    // 基于transdir + 当前offset计算索引
    function getTargetPosition (eventData: EventEndType) {
      'worklet'
      // 移动的距离
      const { transdir } = eventData
      let resetOffsetPos = 0
      let selectedIndex = currentIndex.value
      // 是否临界点
      let isCriticalItem = false
      // 真实滚动到的偏移量坐标
      let moveToTargetPos = 0
      const currentOffset = getSwiperPositionOffset(offset.value, circularShared.value, preMarginShared.value)
      const computedIndex = currentOffset / step.value
      const moveToIndex = transdir < 0 ? Math.ceil(computedIndex) : Math.floor(computedIndex)
      // 实际应该定位的索引值
      if (!circularShared.value) {
        const maxIndex = getSwiperMaxIndex(childrenLength.value, displayMultipleItemsShared.value, false)
        selectedIndex = Math.min(Math.max(moveToIndex, 0), maxIndex)
        moveToTargetPos = selectedIndex * step.value
      } else {
        const circularIndex = getCircularIndex(moveToIndex - patchElmNumShared.value, childrenLength.value)
        if (moveToIndex >= childrenLength.value + patchElmNumShared.value) {
          selectedIndex = circularIndex
          resetOffsetPos = (selectedIndex + patchElmNumShared.value) * step.value - preMarginShared.value
          moveToTargetPos = moveToIndex * step.value - preMarginShared.value
          isCriticalItem = true
        } else if (moveToIndex <= patchElmNumShared.value - 1) {
          selectedIndex = circularIndex
          resetOffsetPos = (selectedIndex + patchElmNumShared.value) * step.value - preMarginShared.value
          moveToTargetPos = moveToIndex * step.value - preMarginShared.value
          isCriticalItem = true
        } else {
          selectedIndex = circularIndex
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
    function canMove (eventData: EventDataType) {
      'worklet'
      // 旧版：如果在快速多次滑动时，只根据当前的offset判断，会出现offset没超出，加上translation后越界的场景(如在倒数第二个元素快速滑动)
      // 新版：会加上translation
      const { translation, transdir } = eventData
      const gestureMovePos = offset.value + translation
      if (!circularShared.value) {
        // 如果只判断区间，中间非滑动状态(handleResistanceMove)向左滑动，突然改为向右滑动，但是还在非滑动态，本应该可滑动判断为了不可滑动
        const maxIndex = getSwiperMaxIndex(childrenLength.value, displayMultipleItemsShared.value, false)
        const posEnd = -step.value * maxIndex
        if (transdir < 0) {
          return gestureMovePos > posEnd
        } else {
          return gestureMovePos < 0
        }
      } else {
        return true
      }
    }
    function handleEnd (eventData: EventEndType) {
      'worklet'
      const { isCriticalItem, targetOffset, resetOffset, selectedIndex } = getTargetPosition(eventData)
      targetIndex.value = selectedIndex
      if (isCriticalItem) {
        offset.value = withTiming(targetOffset, {
          duration: easeDuration,
          easing: easeMap[easeingFunc]
        }, (finished) => {
          if (finished && touchfinish.value !== false && targetIndex.value === selectedIndex) {
            currentIndex.value = selectedIndex
            offset.value = resetOffset
            runOnJS(runOnJSCallback)('resumeLoop')
          }
        })
      } else {
        offset.value = withTiming(targetOffset, {
          duration: easeDuration,
          easing: easeMap[easeingFunc]
        }, (finished) => {
          if (finished && touchfinish.value !== false && targetIndex.value === selectedIndex) {
            currentIndex.value = selectedIndex
            runOnJS(runOnJSCallback)('resumeLoop')
          }
        })
      }
    }
    function handleBack (eventData: EventEndType) {
      'worklet'
      const { transdir } = eventData
      // 向右滑动的back:trans < 0， 向左滑动的back: trans < 0
      const currentOffset = getSwiperPositionOffset(offset.value, circularShared.value, preMarginShared.value)
      const curIndex = currentOffset / step.value
      const moveToIndex = (transdir < 0 ? Math.floor(curIndex) : Math.ceil(curIndex)) - patchElmNumShared.value
      const selectedIndex = circularShared.value
        ? getCircularIndex(moveToIndex, childrenLength.value)
        : Math.min(Math.max(moveToIndex, 0), getSwiperMaxIndex(childrenLength.value, displayMultipleItemsShared.value, false))
      const targetPositionIndex = circularShared.value ? moveToIndex : selectedIndex
      const targetOffset = -(targetPositionIndex + patchElmNumShared.value) * step.value + (circularShared.value ? preMarginShared.value : 0)
      targetIndex.value = selectedIndex
      offset.value = withTiming(targetOffset, {
        duration: easeDuration,
        easing: easeMap[easeingFunc]
      }, (finished) => {
        if (finished && touchfinish.value !== false && targetIndex.value === selectedIndex) {
          currentIndex.value = selectedIndex
          runOnJS(runOnJSCallback)('resumeLoop')
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
      return half
    }
    function reachBoundary (eventData: EventDataType) {
      'worklet'
      // 1. 基于当前的offset和translation判断是否超过当前边界值
      const { translation } = eventData
      const moveToOffset = offset.value + translation
      return getCircularBoundary(moveToOffset, childrenLength.value, patchElmNumShared.value, step.value, mainAxisSizeShared.value)
    }
    // 非循环超出边界，应用阻力; 开始滑动少阻力小，滑动越长阻力越大
    function handleResistanceMove (eventData: EventDataType) {
      'worklet'
      const { translation, transdir } = eventData
      const moveToOffset = offset.value + translation
      const maxOverDrag = Math.floor(step.value / 2)
      const maxIndex = getSwiperMaxIndex(childrenLength.value, displayMultipleItemsShared.value, false)
      const maxOffset = translation < 0 ? -maxIndex * step.value : 0
      let resistance = 0.1
      let overDrag = 0
      let finalOffset = 0
      // 向右向下小于0, 向左向上大于0；
      if (transdir < 0) {
        overDrag = Math.abs(moveToOffset - maxOffset)
      } else {
        overDrag = Math.abs(moveToOffset)
      }
      // 滑动越多resistance越小
      resistance = 1 - overDrag / maxOverDrag
      // 确保阻力在合理范围内
      resistance = Math.min(0.5, resistance)
      // 限制在最大拖拽范围内
      if (transdir < 0) {
        const adjustOffset = offset.value + translation * resistance
        finalOffset = Math.max(adjustOffset, maxOffset - maxOverDrag)
      } else {
        const adjustOffset = offset.value + translation * resistance
        finalOffset = Math.min(adjustOffset, maxOverDrag)
      }
      return finalOffset
    }
    // 设置手势移动的方向
    function setMoveDir (curAbsoPos: number) {
      'worklet'
      const distance = curAbsoPos - preAbsolutePos.value
      if (distance) {
        moveDir.value = curAbsoPos - preAbsolutePos.value
      }
    }
    const gesturePan = Gesture.Pan()
      .onBegin((e: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
        'worklet'
        if (!step.value) return
        touchfinish.value = false
        cancelAnimation(offset)
        targetIndex.value = currentIndex.value
        runOnJS(runOnJSCallback)('pauseLoop')
        preAbsolutePos.value = e[strAbso]
        moveTranstion.value = e[strAbso]
      })
      .onUpdate((e: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
        'worklet'
        const moveDistance = e[strAbso] - preAbsolutePos.value
        if (touchfinish.value || moveDistance === 0) return
        const eventData = {
          translation: moveDistance,
          transdir: moveDistance
        }
        // 1. 支持滑动中超出一半更新索引的能力：只更新索引并不会影响onFinalize依据当前offset计算的索引
        const offsetHalf = computeHalf()
        if (childrenLength.value > 1 && offsetHalf) {
          const { selectedIndex } = getTargetPosition({ transdir: moveDistance } as EventEndType)
          if (selectedIndex !== currentIndex.value) {
            targetIndex.value = selectedIndex
            currentIndex.value = selectedIndex
            runOnJS(runOnJSCallback)('handleSwiperChangeStart', selectedIndex)
          }
        }
        // 2. 非循环: 处理用户一直拖拽到临界点的场景,如果放到onFinalize无法阻止offset.value更新为越界的值
        if (!circularShared.value) {
          if (canMove(eventData)) {
            offset.value = moveDistance + offset.value
          } else {
            const finalOffset = handleResistanceMove(eventData)
            offset.value = finalOffset
          }
          setMoveDir(e[strAbso])
          preAbsolutePos.value = e[strAbso]
          return
        }
        // 3. 循环更新: 只有一个元素时可滑动，加入阻力
        if (circularShared.value && childrenLength.value === 1) {
          const finalOffset = handleResistanceMove(eventData)
          offset.value = finalOffset
          setMoveDir(e[strAbso])
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
        setMoveDir(e[strAbso])
        preAbsolutePos.value = e[strAbso]
      })
      .onFinalize((e: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
        'worklet'
        if (touchfinish.value) return
        touchfinish.value = true
        // 触发过onUpdate正常情况下e[strAbso] - preAbsolutePos.value=0; 未触发过onUpdate的情况下e[strAbso] - preAbsolutePos.value 不为0
        // 正常状态下基于onUpdate时的moveDir判断方向、未触发onUpdate的则基于onBegin的moveTranstion判断方向
        const moveDistance = e[strAbso] - preAbsolutePos.value
        // 默认兜底方向: 以onBegin为起点，因一些原因未触发onUpdate但是触发了位移
        const defaultDir = e[strAbso] - moveTranstion.value
        // 实时方向：方向基于onUpdate时的方向，滑动的速度超过阈值时基于实时的滑动方向计算
        const realtimeData = {
          transdir: moveDir.value || defaultDir
        }
        // 起始方向：基于用户起始手势
        const originData = {
          transdir: defaultDir
        }
        const eventData = {
          translation: moveDistance,
          transdir: realtimeData.transdir
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
        if (!circularShared.value && !canMove(eventData)) {
          if (realtimeData.transdir < 0) {
            handleBack(realtimeData)
          } else {
            handleEnd(realtimeData)
          }
          return
        }
        // 3. 非循环状态可移动态、循环状态, 正常逻辑处理
        const velocity = e[strVelocity]
        // 用于判断是否超过一半，基于索引判断是否超过一半不可行(1.滑动过程中索引会变更导致计算反向, 2.边界场景会更新offset也会导致基于索引+offset判断实效)
        const tmp = offset.value % step.value > step.value / 2
        // 小于0手向左滑动
        const offsetHalf = originData.transdir < 0 ? tmp : !tmp
        if (offsetHalf) {
          if (Math.abs(velocity) > longPressRatio) {
            // 超过速度阈值，按照实时方向(快速来回滑动)
            handleEnd(realtimeData)
          } else {
            // 超过速度阈值，按照起始方向（慢速长按）
            handleEnd(originData)
          }
        } else {
          if (Math.abs(velocity) > longPressRatio) {
            // 超过速度阈值，按照实时方向(快速来回滑动)
            handleEnd(realtimeData)
          } else {
            // 超过速度阈值，按照起始方向（慢速长按）
            handleBack(originData)
          }
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
    key: 'swiperContainer',
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
