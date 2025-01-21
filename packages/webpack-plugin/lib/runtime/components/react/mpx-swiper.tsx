import { View, NativeSyntheticEvent, LayoutChangeEvent } from 'react-native'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing, runOnJS, useAnimatedReaction, cancelAnimation } from 'react-native-reanimated'

import React, { JSX, forwardRef, useRef, useEffect, ReactNode, ReactElement, useCallback, useMemo } from 'react'
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
type StrAbsoType = 'absoluteX' | 'absoluteY'
type EventDataType = {
  translation: number
}

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
    style = {},
    autoplay,
    circular
  } = props
  const easeingFunc = props['easing-function'] || 'default'
  const easeDuration = props.duration || 500
  const horizontal = props.vertical !== undefined ? !props.vertical : true
  const nodeRef = useRef<View>(null)
  useNodesRef<View, SwiperProps>(props, ref, nodeRef, {})
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
  const preMargin = props['previous-margin'] ? parseInt(props['previous-margin']) : 0
  const nextMargin = props['next-margin'] ? parseInt(props['next-margin']) : 0
  const previousMarginShared = useSharedValue(preMargin)
  const nextMarginShared = useSharedValue(nextMargin)
  const autoplayShared = useSharedValue(autoplay || false)
  // 默认前后补位的元素个数
  const patchElmNum = circular ? (preMargin ? 2 : 1) : 0
  const patchElmNumShared = useSharedValue(patchElmNum)
  const circularShared = useSharedValue(circular || false)
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
    if (children.length <= 1) return null
    const activeColor = activeDotColor || '#007aff'
    const unActionColor = dotColor || 'rgba(0,0,0,.2)'
    // 正常渲染所有dots
    const dots: Array<ReactNode> = []
    for (let i = 0; i < children.length; i++) {
      dots.push(<View style={[dotCommonStyle, { backgroundColor: unActionColor }]} key={i}></View>)
    }
    return (
      <View pointerEvents="none" style = {styles['pagination_' + dir]}>
        <View style = {[styles['pagerWrapper' + dir]]}>
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

  const { loop, pauseLoop, resumeLoop} = useMemo(() => {
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
        // targetOffset = -nextIndex * step.value - previousMarginShared.value
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
          targetOffset = -(childrenLength.value + patchElmNumShared.value) * step.value + previousMarginShared.value
          // 执行动画到下一帧
          offset.value = withTiming(targetOffset, {
            duration: easeDuration
          }, () => {
            const initOffset = -step.value * patchElmNumShared.value + previousMarginShared.value
            // 将开始位置设置为真正的位置
            offset.value = initOffset
            currentIndex.value = nextIndex
            runOnJS(loop)()
          })
        } else {
          nextIndex = currentIndex.value + 1
          targetOffset = -(nextIndex + patchElmNumShared.value) * step.value + previousMarginShared.value
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

  function getOffset (index:number, stepValue: number) {
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

  function updateCurrent (index:number, stepValue: number) {
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
    if (preMargin !== previousMarginShared.value) {
      patchStep += preMargin - previousMarginShared.value
    }
    if (nextMargin !== nextMarginShared.value) {
      patchStep += nextMargin - nextMarginShared.value
    }
    previousMarginShared.value = preMargin
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
    updateCurrent(props.current || 0, step.value)
  }, [props.current])

  useEffect(() => {
    autoplayShared.value = autoplay || false
    updateAutoplay()
    return () => {
      if (autoplay) {
        pauseLoop()
      }
    }
  }, [autoplay])

  useEffect(() => {
    if (circular !== circularShared.value) {
      circularShared.value = circular || false
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
      const currentOffset = translation < 0 ? offset.value - previousMarginShared.value : offset.value + previousMarginShared.value
      const computedIndex = Math.abs(currentOffset) / step.value
      const moveToIndex = translation < 0 ? Math.ceil(computedIndex) : Math.floor(computedIndex)
      // 实际应该定位的索引值
      if (!circularShared.value) {
        selectedIndex = moveToIndex
        moveToTargetPos = selectedIndex * step.value
      } else {
        if (moveToIndex >= childrenLength.value + patchElmNumShared.value) {
          selectedIndex = moveToIndex - (childrenLength.value + patchElmNumShared.value)
          resetOffsetPos = (selectedIndex + patchElmNumShared.value) * step.value - previousMarginShared.value
          moveToTargetPos = moveToIndex * step.value - previousMarginShared.value
          isCriticalItem = true
        } else if (moveToIndex <= patchElmNumShared.value - 1) {
          selectedIndex = moveToIndex === 0 ? childrenLength.value - patchElmNumShared.value : childrenLength.value - 1
          resetOffsetPos = (selectedIndex + patchElmNumShared.value) * step.value - previousMarginShared.value
          moveToTargetPos = moveToIndex * step.value - previousMarginShared.value
          isCriticalItem = true
        } else {
          selectedIndex = moveToIndex - patchElmNumShared.value
          moveToTargetPos = moveToIndex * step.value - previousMarginShared.value
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
      const currentOffset = Math.abs(offset.value)
      if (!circularShared.value) {
        if (translation < 0) {
          return currentOffset < step.value * (childrenLength.value - 1)
        } else {
          return currentOffset > 0
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
    function handleBack (eventData: EventDataType) {
      'worklet'
      const { translation } = eventData
      // 向右滑动的back:trans < 0， 向左滑动的back: trans < 0
      let currentOffset = Math.abs(offset.value)
      if (circularShared.value) {
        currentOffset += translation < 0 ? previousMarginShared.value : -previousMarginShared.value
      }
      const curIndex = currentOffset / step.value
      const moveToIndex = (translation < 0 ? Math.floor(curIndex) : Math.ceil(curIndex)) - patchElmNumShared.value
      const targetOffset = -(moveToIndex + patchElmNumShared.value) * step.value + (circularShared.value ? previousMarginShared.value : 0)
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
    function handleLongPress () {
      'worklet'
      const currentOffset = Math.abs(offset.value)
      let preOffset = (currentIndex.value + patchElmNumShared.value) * step.value
      if (circularShared.value) {
        preOffset -= previousMarginShared.value
      }
      // 正常事件中拿到的transition值(正向滑动<0，倒着滑>0)
      const diffOffset = preOffset - currentOffset
      const half = Math.abs(diffOffset) > step.value / 2
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
      const moveStep = Math.ceil(translation / elementsLength)
      if (translation < 0) {
        const posEnd = (childrenLength.value + patchElmNumShared.value + 1) * step.value
        const posReverseEnd = (patchElmNumShared.value - 1) * step.value
        if (currentOffset < -posEnd + step.value) {
          isBoundary = true
          resetOffset = Math.abs(moveStep) === 0 ? patchElmNumShared.value * step.value + translation : moveStep * elementsLength
        }
        if (currentOffset > -posReverseEnd) {
          isBoundary = true
          resetOffset = moveStep * elementsLength
        }
      } else if (translation > 0) {
        const posEnd = (patchElmNumShared.value - 1) * step.value
        const posReverseEnd = (patchElmNumShared.value + childrenLength.value) * step.value
        if (currentOffset > -posEnd) {
          isBoundary = true
          resetOffset = moveStep * elementsLength + step.value + (moveStep === 1 ? translation : 0)
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
    const gesturePan = Gesture.Pan()
      .onBegin((e) => {
        'worklet'
        if (!step.value) return
        touchfinish.value = false
        cancelAnimation(offset)
        runOnJS(pauseLoop)()
        preAbsolutePos.value = e[strAbso]
        moveTranstion.value = e[strAbso]
        moveTime.value = new Date().getTime()
      })
      .onTouchesMove((e) => {
        'worklet'
        if (touchfinish.value) return
        const touchEventData = e.changedTouches[0]
        const moveDistance = touchEventData[strAbso] - preAbsolutePos.value
        const eventData = {
          translation: moveDistance
        }
        // 处理用户一直拖拽到临界点的场景, 不会执行onEnd
        if (!circularShared.value && !canMove(eventData)) {
          return
        }
        const { isBoundary, resetOffset } = reachBoundary(eventData)
        if (isBoundary && circularShared.value) {
          offset.value = resetOffset
        } else {
          offset.value = moveDistance + offset.value
        }
        preAbsolutePos.value = touchEventData[strAbso]
      })
      .onTouchesUp((e) => {
        'worklet'
        if(touchfinish.value) return
        const touchEventData = e.changedTouches[0]
        const moveDistance = touchEventData[strAbso] - moveTranstion.value
        touchfinish.value = true
        const eventData = {
          translation: moveDistance
        }
        // 用户手指按下起来, 需要计算正确的位置, 比如在滑动过程中突然按下然后起来,需要计算到正确的位置
        if (!circularShared.value && !canMove(eventData)) {
          return
        }
        const strVelocity = moveDistance / (new Date().getTime() - moveTime.value) * 1000
        if (Math.abs(strVelocity) < longPressRatio) {
          handleLongPress()
        } else {
          handleEnd(eventData)
        }
      })
    return {
      gestureHandler: gesturePan
    }
  }, [])

  const animatedStyles = useAnimatedStyle(() => {
    if (dir === 'x') {
      return { transform: [{ translateX: offset.value }], opacity: step.value > 0 ? 1 : 0 }
    } else {
      return { transform: [{ translateY: offset.value }], opacity: step.value > 0 ? 1 : 0 }
    }
  })

  function renderSwiper () {
    const arrPages: Array<ReactNode> | ReactNode = renderItems()
    return (<View style={[normalStyle, layoutStyle, styles.swiper]} {...layoutProps} {...innerProps}>
        <Animated.View style={[{
          flexDirection: dir === 'x' ? 'row' : 'column',
          width: '100%',
          height: '100%'
        }, animatedStyles]}>
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

  if (children.length === 1) {
    return renderSwiper()
  } else {
    return (<GestureDetector gesture={gestureHandler}>
      {renderSwiper()}
    </GestureDetector>)
  }
})
SwiperWrapper.displayName = 'MpxSwiperWrapper'

export default SwiperWrapper
