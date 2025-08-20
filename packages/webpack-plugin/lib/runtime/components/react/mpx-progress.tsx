/**
 * ✔ percent 进度百分比 0-100
 * ✘ show-info 在进度条右侧显示百分比
 * ✘ border-radius 圆角大小  
 * ✘ font-size 右侧百分比字体大小
 * ✔ stroke-width 进度条线的宽度
 * ✔ color 进度条颜色（请使用activeColor）
 * ✔ activeColor 已选择的进度条的颜色
 * ✔ backgroundColor 未选择的进度条的颜色
 * ✔ active 进度条从左往右的动画
 * ✘ active-mode backwards: 动画从头播；forwards：动画从上次结束点接着播
 * ✘ duration 进度增加1%所需毫秒数
 * ✘ bindactiveend 动画完成事件
 */
import {
  JSX,
  useRef,
  forwardRef,
  useEffect,
  useState,
  createElement,
  ForwardedRef
} from 'react'
import {
  View,
  ViewStyle,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing
} from 'react-native-reanimated'

import useInnerProps from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { useLayout, useTransformStyle, extendObject } from './utils'
import Portal from './mpx-portal'

export interface ProgressProps {
  percent?: number
  'stroke-width'?: number | string
  color?: string
  activeColor?: string
  backgroundColor?: string
  active?: boolean
  style?: ViewStyle & Record<string, any>
  'enable-offset'?: boolean
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>
  'parent-font-size'?: number
  'parent-width'?: number
  'parent-height'?: number
}

const Progress = forwardRef<
  HandlerRef<View, ProgressProps>,
  ProgressProps
>((props: ProgressProps, ref: ForwardedRef<HandlerRef<View, ProgressProps>>): JSX.Element => {
  const {
    percent = 0,
    'stroke-width': strokeWidth = 6,
    color,
    activeColor = color || '#09BB07',
    backgroundColor = '#EBEBEB',
    active = false,
    style = {},
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight
  } = props

  const nodeRef = useRef(null)
  const propsRef = useRef({})
  propsRef.current = props

  // 进度值状态
  const [currentPercent, setCurrentPercent] = useState(percent)
  const progressWidth = useSharedValue(percent)

  const {
    normalStyle,
    hasSelfPercent,
    setWidth,
    setHeight,
    hasPositionFixed
  } = useTransformStyle(style, {
    enableVar,
    externalVarContext,
    parentFontSize,
    parentWidth,
    parentHeight
  })

  const { layoutRef, layoutStyle, layoutProps } = useLayout({
    props,
    hasSelfPercent,
    setWidth,
    setHeight,
    nodeRef
  })

  useNodesRef(props, ref, nodeRef, {
    style: normalStyle
  })

  // 进度变化时的动画效果
  useEffect(() => {
    const targetPercent = Math.max(0, Math.min(100, percent))
    
    if (active) {
      progressWidth.value = withTiming(
        targetPercent,
        {
          duration: 1000,
          easing: Easing.linear
        }
      )
    } else {
      progressWidth.value = targetPercent
    }
    setCurrentPercent(targetPercent)
  }, [percent, active])

  // 进度条动画样式
  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value}%`
    }
  })

  // 确保数值类型正确
  const strokeWidthNum = typeof strokeWidth === 'number' ? strokeWidth : parseInt(strokeWidth as string, 10) || 6

  // 容器样式
  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: Math.max(strokeWidthNum, 20),
    ...normalStyle,
    ...layoutStyle
  }

  // 进度条背景样式
  const progressBgStyle: ViewStyle = {
    width: '100%',
    height: strokeWidthNum,
    backgroundColor,
    overflow: 'hidden'
  }

  // 进度条填充样式
  const progressFillStyle: ViewStyle = {
    height: '100%',
    backgroundColor: activeColor
  }



  const innerProps = useInnerProps(
    extendObject({}, props, layoutProps, {
      ref: nodeRef
    }),
    [
      'percent',
      'stroke-width',
      'color',
      'activeColor',
      'backgroundColor',
      'active'
    ],
    { layoutRef }
  )

  const progressComponent = createElement(
    View,
    { ...innerProps, style: containerStyle },
    // 进度条背景
    createElement(
      View,
      { style: progressBgStyle },
      // 进度条填充
      createElement(Animated.View, {
        style: [progressFillStyle, animatedProgressStyle]
      })
    )
  )

  if (hasPositionFixed) {
    return createElement(Portal, null, progressComponent)
  }

  return progressComponent
})

Progress.displayName = 'MpxProgress'
export default Progress
