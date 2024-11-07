import { View, NativeSyntheticEvent, Dimensions, NativeScrollPoint,NativeScrollEvent, LayoutChangeEvent } from 'react-native'
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';

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
 * ✔ interval(暂时不支持, Android可以, IOS不可以)
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
  index: number;
  total: number;
  // 设置scrollView初始的滚动坐标，contentOffset
  offset: {
    x: number,
    y: number
  };
  dir: 'x' | 'y';
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
  const totalElements = children.length
  const defaultHeight = (normalStyle?.height || 150)
  const defaultWidth = (normalStyle?.width || width || 375)
  const dir = horizontal === false ? 'y' : 'x'
  // 内部存储上一次的offset值
  const autoplayTimerRef = useRef<ReturnType <typeof setInterval> | null>(null)

  const {
    // 存储layout布局信息
    layoutRef,
    layoutProps,
    layoutStyle
  } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef, onLayout: onWrapperLayout })
  console.log('--------------layoutStyle', layoutStyle, layoutRef.current)

  const [state, setState] = useState({
    width: dir === 'x' && typeof defaultWidth === 'number' ? defaultWidth - previousMargin - nextMargin : defaultWidth,
    height: dir === 'y' && typeof defaultHeight === 'number' ? defaultHeight - previousMargin - nextMargin : defaultHeight,
    offset: {
      x: 0,
      y: 0
    },
    dir
  } as CarouseState)

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
    'easing-function'
  ], { layoutRef: layoutRef })

  function onWrapperLayout (e: LayoutChangeEvent) {
    nodeRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
      const isWDiff = state.width !== width
      const isHDiff = state.height !== height
      if (isWDiff || isHDiff) {
        const changeState = {
          width: isWDiff ? width : state.width,
          height: isHDiff ? height : state.height
        }
        const attr = state.dir === 'x' ? 'width' : 'height'
        changeState[attr] = changeState[attr] - previousMargin - nextMargin
        state.width = changeState.width
        state.height = changeState.height
        // 这里setState之后,会再触发重新渲染, renderScrollView会再次触发onScrollEnd,
        setState((preState) => {
          return {
            ...preState,
            width: changeState.width,
            height: changeState.height
          }
        })
      }
    })
  }

  function renderPagination () {
    if (state.total <= 1) return null
    const dots: Array<ReactNode> = []
    const activeDotStyle = Object.assign({ backgroundColor: activeDotColor || '#007aff' }, dotCommonStyle)
    const dotStyle = Object.assign({ backgroundColor: dotColor || 'rgba(0,0,0,.2)' }, dotCommonStyle)
    for (let i = 0; i < state.total; i++) {
      if (i === state.index) {
        dots.push(<View style={[activeDotStyle]} key={i}></View>)
      } else {
        dots.push(<View style={[dotStyle]} key={i}></View>)
      }
    }
    // 这里也可以用动画实现
    return (
      <View pointerEvents="none" style={[styles['pagination_' + state.dir]]}>
        {dots}
      </View>
    )
  }

  function renderItems () {
    const { width, height } = state
    const pageStyle = { width: width, height: height }
    // pages = ["0", "1", "2", "0", "1"]
    const renderChild = children.slice()
    console.log('------------renderItems', step)
    if (!Number.isNaN(+step)) {
      console.log('-------------renderItems2')
      if (props.circular && totalElements > 1) {
        if (totalElements === 2) {
          renderChild.concat(children).concat(children)
        } else {
          // 最前加两个
          renderChild.unshift(children[totalElements - 1])
          renderChild.unshift(children[totalElements - 2])
          // 最后加两个
          renderChild.push(children[0])
          renderChild.push(children[1])
        }
      }
      console.log('-------------renderItems3')
      const targetOffset = getInitIndex()
      offset.value = targetOffset
      start.value = targetOffset
    }
    // 1. 不支持循环 + margin 模式
    return renderChild.map((child, i) => {
      const extraStyle = {} as {
        [key: string]: any
      }
      if (i === 0 && dir === 'x' && typeof width === 'number') {
        previousMargin && (extraStyle.marginLeft = previousMargin)
      } else if (i === totalElements - 1 && typeof width === 'number') {
        nextMargin && (extraStyle.marginRight = nextMargin)
      }
      return (<View style={[pageStyle, extraStyle]} key={ 'page' + i}>{child}</View>)
    })
  }


  const targetIndex = useRef(0)
  const initOffset = getInitIndex()
  const offset = useSharedValue(initOffset)
  const start = useSharedValue(initOffset);
  const step = dir === 'x' ? state.width : state.height
  const strTrans = 'translation' + dir.toUpperCase()
  const arrPages: Array<ReactNode> | ReactNode = renderItems()

  function createAutoPlay () {
    autoplayTimerRef.current && clearInterval(autoplayTimerRef.current)
    autoplayTimerRef.current = setInterval(() => {
      const targetOffset = getInitIndex()
      if (!props.circular) {
        // 获取下一个位置的坐标, 循环到最后一个元素,直接停止
        if (targetIndex.current === totalElements - 1) {
          autoplayTimerRef.current && clearTimeout(autoplayTimerRef.current)
          autoplayTimerRef.current = null
          return
        }
        targetIndex.current = targetIndex.current + 1
        targetOffset[dir] = -targetIndex.current * step
      } else {
        if (targetIndex.current === totalElements - 1) {
          targetIndex.current = 0
        } else {
          targetIndex.current = targetIndex.current + 1
        }
        targetOffset[dir] = -(targetIndex.current + 2) * step
        console.log('---------createAutoPlay----2-', targetIndex, targetOffset)
      }
      offset.value = targetOffset
      start.value = targetOffset
    }, props.interval || 500)
  }

  useEffect(() => {
    if (props.autoplay) {
      !Number.isNaN(+step) && createAutoPlay()
    } else {
      const targetOffset = getInitIndex()
      console.log('---------useEffect---',targetOffset)
      offset.value = targetOffset
      start.value = targetOffset
    }
  }, [props.autoplay, props.current, state.width, state.height])

  function getInitIndex () {
    if (Number.isNaN(+step)) return { x: 0, y: 0 }
    const targetOffset = { x: 0, y: 0 }
    if(props.circular) {
      const targetIndex = (props.current || 0) + 2
      targetOffset[dir] = -step * targetIndex
    } else if (props.current){
      targetOffset[dir] = -props.current * step
    }
    return targetOffset
  }

  function getTargetPosition (e) {
    let targetPos = 0
    const posView = e[dir]
    // 移动的目标步长
    const moveDistance  = Math.ceil(Math.abs(e[strTrans]) / step) * step
    // 移动的目标步长之后的坐标, e[strTrans] < 0) 代表正向滚动 否则反向
    const moveTargetPos = e[strTrans] < 0 ? posView + moveDistance : posView - moveDistance
    // 目标索引值
    const index = Math.floor(moveTargetPos / step)
    if (!props.circular) {
      targetIndex.current = index
      targetPos = -targetIndex.current * step
    } else {
      if (e[strTrans] < 0) {
        const a1 = index - (totalElements + 2)
        const a2 = index - 2
        targetIndex.current = a1 >= 0 ? a1 : a2
        targetPos = -(targetIndex.current + 2) * step
      } else {
        targetIndex.current = index > 1 ? index - 2 : ( index === 0 ? totalElements - 2 : totalElements - 1)
        targetPos = -(targetIndex.current + 2) * step
      }
    }
    return {
      targetOffset: {
        x: dir === 'x' ? targetPos : offset.value.x,
        y: dir === 'y' ? targetPos : offset.value.y
      }
    }
  }

  function canMove (e) {
    if (!props.circular && (e[strTrans] < 0 && e[dir] >= (totalElements - 1) * step || e[strTrans] > 0 && e[dir] <= step)) {
      return false
    } else {
      return true
    }
  }

  const animatedStyles = useAnimatedStyle(() => {
    if (dir === 'x') {
      console.log(1111)
      return { transform: [{ translateX: offset.value.x }]}
    } else {
      console.log(2222, offset.value.y)
      return { transform: [{ translateY: offset.value.y }]}
    }
  })

  const gesture = Gesture.Pan()
    .onBegin((e) => {
      autoplayTimerRef.current && clearTimeout(autoplayTimerRef.current)
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
      const { targetOffset } = getTargetPosition(e)
      console.log('------------onEnd1', e, targetOffset)
      console.log('------------onEnd2', offset.value.x)
      /*
      withTiming(offset.value, {
        easing: Easing.bounce,
      });
      */
      offset.value = targetOffset
      start.value = targetOffset
      const eventData = getCustomEvent('change', {}, { detail: { current: targetIndex.current, source: 'touch' }, layoutRef: layoutRef })
      props.bindchange && props.bindchange(eventData)
      props.autoplay && !Number.isNaN(+step) && createAutoPlay()
    })
    .onFinalize(() => {
    });
  
  return (<View style={[normalStyle, layoutStyle, { overflow: "scroll" }]} {...layoutProps} {...innerProps}>
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ flexDirection: dir === 'x' ? 'row' : 'column' }, animatedStyles]}>
        {arrPages}
        {/*wrapChildren({
          children: arrPages
        }, {
          hasVarDec,
          varContext: varContextRef.current,
          textStyle,
          textProps
        })*/}
      </Animated.View>
    </GestureDetector>
      {showsPagination && renderPagination()}
  </View>)
})
_SwiperWrapper.displayName = 'mpx-swiper'

export default _SwiperWrapper
