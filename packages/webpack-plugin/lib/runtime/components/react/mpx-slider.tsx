/**
 * ✔ min 最小值
 * ✔ max 最大值
 * ✔ step 步长
 * ✔ disabled 是否禁用
 * ✔ value 当前取值
 * ✔ color 背景条的颜色（已废弃，使用 backgroundColor）
 * ✔ selected-color 已选择的颜色（已废弃，使用 activeColor）
 * ✔ activeColor 已选择的颜色
 * ✔ backgroundColor 背景条的颜色
 * ✔ block-size 滑块的大小
 * ✔ block-color 滑块的颜色
 * ✘ show-value 是否显示当前 value (不实现)
 * ✔ bindchange 完成一次拖动后触发的事件
 * ✔ bindchanging 拖动过程中触发的事件
 */
import {
  JSX,
  useRef,
  forwardRef,
  useEffect,
  useState,
  createElement,
  ForwardedRef,
  useContext
} from 'react'
import {
  View,
  ViewStyle,
  PanResponder,
  PanResponderGestureState,
  GestureResponderEvent
} from 'react-native'
import { warn } from '@mpxjs/utils'

import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { useLayout, useTransformStyle, extendObject } from './utils'
import Portal from './mpx-portal'
import { FormContext, FormFieldValue } from './context'

export interface SliderProps {
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  value?: number
  color?: string
  'selected-color'?: string
  activeColor?: string
  backgroundColor?: string
  'block-size'?: number
  'block-color'?: string
  name?: string
  bindchange?: (event: any) => void
  catchchange?: (event: any) => void
  bindchanging?: (event: any) => void
  catchchanging?: (event: any) => void
  style?: ViewStyle & Record<string, any>
  'enable-offset'?: boolean
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>
  'parent-font-size'?: number
  'parent-width'?: number
  'parent-height'?: number
}

const Slider = forwardRef<
  HandlerRef<View, SliderProps>,
  SliderProps
>((props: SliderProps, ref: ForwardedRef<HandlerRef<View, SliderProps>>): JSX.Element => {
  const {
    min: rawMin = 0,
    max: rawMax = 100,
    step: rawStep = 1,
    disabled = false,
    value: rawValue,
    color,
    'selected-color': selectedColor,
    activeColor = selectedColor || color || '#1aad19',
    backgroundColor = color || '#e9e9e9',
    'block-size': rawBlockSize = 28,
    'block-color': blockColor = '#ffffff',
    name,
    bindchange,
    catchchange,
    bindchanging,
    catchchanging,
    style = {},
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight
  } = props

  // 确保数值类型正确
  const min = typeof rawMin === 'string' ? parseFloat(rawMin) : rawMin
  const max = typeof rawMax === 'string' ? parseFloat(rawMax) : rawMax
  const step = typeof rawStep === 'string' ? parseFloat(rawStep) : rawStep
  const value = rawValue !== undefined ? (typeof rawValue === 'string' ? parseFloat(rawValue) : rawValue) : undefined
  const blockSize = typeof rawBlockSize === 'string' ? parseFloat(rawBlockSize) : rawBlockSize

  // 如果没有提供 value，则使用 min 作为默认值
  const defaultValue = value !== undefined ? value : min
  
  const nodeRef = useRef(null)
  const trackRef = useRef(null)
  const [currentValue, setCurrentValue] = useState(defaultValue)
  const [trackWidth, setTrackWidth] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const changeHandler = bindchange || catchchange
  const changingHandler = bindchanging || catchchanging

  let formValuesMap: Map<string, FormFieldValue> | undefined

  const formContext = useContext(FormContext)

  if (formContext) {
    formValuesMap = formContext.formValuesMap
  }

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

  // 限制步长，确保 step 大于 0，并且可被 (max - min) 整除
  const validateStep = (step: number, min: number, max: number): number => {
    if (step <= 0) return 1
    if ((max - min) % step !== 0) {
      warn(`Step ${step} is not a divisor of range ${max - min}`)
    }
    return step
  }

  const validStep = validateStep(step, min, max)

  // 将值约束在 min-max 范围内，并按步长对齐
  const constrainValue = (val: number): number => {
    const constrained = Math.max(min, Math.min(max, val))
    const steps = Math.round((constrained - min) / validStep)
    return min + steps * validStep
  }

  // 触发 change 事件
  const triggerChangeEvent = (newValue: number) => {
    if (changeHandler) {
      changeHandler(getCustomEvent('change', {}, { layoutRef, detail: { value: newValue } }, props))
    }
  }

  // 触发 changing 事件
  const triggerChangingEvent = (newValue: number) => {
    if (changingHandler) {
      changingHandler(getCustomEvent('changing', {}, { layoutRef, detail: { value: newValue } }, props))
    }
  }

  // 计算滑块位置
  const getThumbPosition = (val: number): number => {
    if (trackWidth === 0) return 0
    const percentage = (val - min) / (max - min)
    const position = percentage * trackWidth
    return position
  }

  // PanResponder 手势处理
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: () => {
      setIsDragging(true)
    },
    onPanResponderMove: (event: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      if (disabled || trackWidth === 0) return

      // 计算新位置
      const startPosition = getThumbPosition(currentValue)
      const newX = startPosition + gestureState.dx
      const clampedX = Math.max(0, Math.min(trackWidth, newX))

      // 计算新值
      const percentage = clampedX / trackWidth
      const rawValue = min + percentage * (max - min)
      const newValue = constrainValue(rawValue)

      setCurrentValue(newValue)

      // 触发 changing 事件
      if (changingHandler) {
        triggerChangingEvent(newValue)
      }
    },
    onPanResponderRelease: () => {
      setIsDragging(false)
      // 触发 change 事件
      if (changeHandler) {
        triggerChangeEvent(currentValue)
      }
    }
  })

  // 当 value 属性变化时更新位置
  useEffect(() => {
    const newValue = constrainValue(defaultValue)
    setCurrentValue(newValue)
  }, [defaultValue, min, max, validStep])

  // 轨道布局回调
  const onTrackLayout = (event: any) => {
    const { width } = event.nativeEvent.layout
    setTrackWidth(width)
  }

  // 表单相关处理
  const resetValue = () => {
    const resetVal = value !== undefined ? value : min
    setCurrentValue(constrainValue(resetVal))
  }

  const getValue = () => {
    return currentValue
  }

  if (formValuesMap) {
    if (!name) {
      warn('If a form component is used, the name attribute is required.')
    } else {
      formValuesMap.set(name, { getValue, resetValue })
    }
  }

  useEffect(() => {
    return () => {
      if (formValuesMap && name) {
        formValuesMap.delete(name)
      }
    }
  }, [])

  // 样式定义
  const blockSizeNum = Math.max(12, Math.min(28, blockSize))
  const trackHeight = 4

  const containerStyle: ViewStyle = extendObject({} as ViewStyle, {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    minHeight: Math.max(blockSizeNum + 8, 40),
    paddingHorizontal: blockSizeNum / 2
  }, normalStyle, layoutStyle)

  const trackStyle: ViewStyle = {
    flex: 1,
    height: trackHeight,
    backgroundColor,
    borderRadius: trackHeight / 2,
    position: 'relative'
  }

  const progressWidth = getThumbPosition(currentValue)
  const thumbPosition = getThumbPosition(currentValue)
  
  const progressStyle: ViewStyle = {
    height: '100%',
    backgroundColor: activeColor,
    borderRadius: trackHeight / 2,
    width: Math.max(0, progressWidth)
  }

  const thumbContainerStyle: ViewStyle = {
    position: 'absolute',
    top: -((blockSizeNum - trackHeight) / 2),
    left: thumbPosition - (blockSizeNum / 2),
    width: blockSizeNum,
    height: blockSizeNum,
    justifyContent: 'center',
    alignItems: 'center'
  }

  const thumbStyle: ViewStyle = {
    width: blockSizeNum,
    height: blockSizeNum,
    backgroundColor: blockColor,
    borderRadius: blockSizeNum / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4
  }

  const innerProps = useInnerProps(
    extendObject({}, props, layoutProps, {
      ref: nodeRef
    }),
    [
      'min',
      'max',
      'step',
      'disabled',
      'value',
      'color',
      'selected-color',
      'activeColor',
      'backgroundColor',
      'block-size',
      'block-color',
      'bindchange',
      'bindchanging'
    ],
    { layoutRef }
  )

  const sliderContent = createElement(
    View,
    extendObject({}, innerProps, { style: containerStyle }),
    // 轨道容器
    createElement(
      View,
      {
        style: trackStyle,
        onLayout: onTrackLayout,
        ref: trackRef
      },
      // 进度条
      createElement(View, {
        style: progressStyle
      }),
      // 滑块容器
      createElement(
        View,
        {
          style: thumbContainerStyle,
          ...(disabled ? {} : panResponder.panHandlers)
        },
        // 滑块
        createElement(View, {
          style: thumbStyle
        })
      )
    )
  )

  if (hasPositionFixed) {
    return createElement(Portal, null, sliderContent)
  }

  return sliderContent
})

Slider.displayName = 'MpxSlider'
export default Slider
