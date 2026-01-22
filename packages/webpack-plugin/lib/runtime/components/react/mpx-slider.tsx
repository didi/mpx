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
 * ✘ show-value 是否显示当前 value
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
  useContext,
  useMemo
} from 'react'
import {
  View,
  ViewStyle
} from 'react-native'
import { GestureDetector, Gesture, GestureStateChangeEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated'
import { warn } from '@mpxjs/utils'

import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { useLayout, useTransformStyle, extendObject, useRunOnJSCallback } from './utils'
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

  const thumbPosition = useSharedValue(0)
  const isDragging = useSharedValue(false)
  const startDragPosition = useSharedValue(0) // 记录拖拽开始时的位置
  const startDragValue = useSharedValue(0) // 记录拖拽开始时的值

  let formValuesMap: Map<string, FormFieldValue> | undefined

  const propsRef = useRef(props)
  propsRef.current = props

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

  // 使用 useRunOnJSCallback 处理手势回调
  const runOnJSCallbackRef = useRef({
    triggerChangeEvent: (newValue: number) => {
      setCurrentValue(newValue)
      const currentProps = propsRef.current
      const changeHandler = currentProps.bindchange || currentProps.catchchange
      if (changeHandler) {
        changeHandler(getCustomEvent('change', {}, { layoutRef, detail: { value: newValue } }, currentProps))
      }
    },
    triggerChangingEvent: (newValue: number) => {
      const currentProps = propsRef.current
      const changingHandler = currentProps.bindchanging || currentProps.catchchanging
      if (changingHandler) {
        changingHandler(getCustomEvent('changing', {}, { layoutRef, detail: { value: newValue } }, currentProps))
      }
    }
  })
  const runOnJSCallback = useRunOnJSCallback(runOnJSCallbackRef)

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
  const constrainValue = (val: number, minVal: number = min, maxVal: number = max, stepVal: number = validStep): number => {
    const constrained = Math.max(minVal, Math.min(maxVal, val))
    const steps = Math.round((constrained - minVal) / stepVal)
    return minVal + steps * stepVal
  }

  // 计算滑块位置
  const getThumbPosition = (val: number, trackW: number = trackWidth, minVal: number = min, maxVal: number = max): number => {
    if (trackW === 0) return 0
    const percentage = (val - minVal) / (maxVal - minVal)
    const position = percentage * trackW
    return position
  }

  // 手势处理
  const panGesture = useMemo(() => {
    const getThumbPositionWorklet = (val: number, trackW: number, minVal: number, maxVal: number): number => {
      'worklet'
      if (trackW === 0) return 0
      const percentage = (val - minVal) / (maxVal - minVal)
      return percentage * trackW
    }

    const constrainValueWorklet = (val: number, minVal: number, maxVal: number, stepVal: number): number => {
      'worklet'
      const constrained = Math.max(minVal, Math.min(maxVal, val))
      const steps = Math.round((constrained - minVal) / stepVal)
      return minVal + steps * stepVal
    }

    return Gesture.Pan()
      .enabled(!disabled) // 通过手势启用状态控制是否可拖拽
      .onBegin(() => {
        'worklet'
        if (trackWidth === 0) return
        isDragging.value = true
        // 记录拖拽开始时的位置 - 使用当前的动画位置
        startDragPosition.value = thumbPosition.value
        // 根据当前位置反推值
        const percentage = thumbPosition.value / trackWidth
        const currentVal = min + percentage * (max - min)
        startDragValue.value = constrainValueWorklet(currentVal, min, max, validStep)
      })
      .onUpdate((event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
        'worklet'
        if (trackWidth === 0) return

        // 基于拖拽开始位置计算新位置
        const newX = startDragPosition.value + event.translationX
        const clampedX = Math.max(0, Math.min(trackWidth, newX))

        // 计算新值
        const percentage = clampedX / trackWidth
        const rawValue = min + percentage * (max - min)
        const newValue = constrainValueWorklet(rawValue, min, max, validStep)

        // 更新滑块位置 - 使用约束后的值对应的位置
        const constrainedPosition = getThumbPositionWorklet(newValue, trackWidth, min, max)
        thumbPosition.value = constrainedPosition

        // 只触发 changing 事件，不更新 currentValue（避免干扰拖拽）
        runOnJS(runOnJSCallback)('triggerChangingEvent', newValue)
      })
      .onEnd((event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
        'worklet'
        isDragging.value = false

        // 基于拖拽开始位置计算最终位置
        const newX = startDragPosition.value + event.translationX
        const clampedX = Math.max(0, Math.min(trackWidth, newX))
        const percentage = clampedX / trackWidth
        const rawValue = min + percentage * (max - min)
        const finalValue = constrainValueWorklet(rawValue, min, max, validStep)

        // 确保滑块位置与最终值匹配
        const finalPosition = getThumbPositionWorklet(finalValue, trackWidth, min, max)
        thumbPosition.value = finalPosition

        // 更新 currentValue 并触发 change 事件
        runOnJS(runOnJSCallback)('triggerChangeEvent', finalValue)
      })
  }, [disabled, trackWidth, min, max, validStep, runOnJSCallback])

  // 当 value 属性变化时更新位置
  useEffect(() => {
    const newValue = constrainValue(defaultValue)
    setCurrentValue(newValue)
    // 同时更新动画位置
    thumbPosition.value = getThumbPosition(newValue)
  }, [defaultValue, min, max, validStep])

  // 当 trackWidth 变化时更新滑块位置
  useEffect(() => {
    // 只在非拖拽状态下更新位置
    if (!isDragging.value) {
      thumbPosition.value = getThumbPosition(currentValue)
    }
  }, [trackWidth, currentValue])

  // 动画样式
  const animatedThumbStyle = useAnimatedStyle(() => {
    const blockSizeNum = Math.max(12, Math.min(28, blockSize))
    const trackHeight = 4
    return {
      position: 'absolute',
      top: -((blockSizeNum - trackHeight) / 2),
      left: Math.max(0, Math.min(trackWidth - blockSizeNum, thumbPosition.value - (blockSizeNum / 2))),
      width: blockSizeNum,
      height: blockSizeNum,
      justifyContent: 'center',
      alignItems: 'center'
    }
  })

  // 轨道布局回调
  const onTrackLayout = (event: any) => {
    const { width } = event.nativeEvent.layout
    setTrackWidth(width)
  }

  // 表单相关处理
  const resetValue = () => {
    const currentProps = propsRef.current
    const currentValue = currentProps.value !== undefined ? currentProps.value : currentProps.min || 0
    const parsedValue = typeof currentValue === 'string' ? parseFloat(currentValue) : currentValue
    const currentMin = typeof currentProps.min === 'string' ? parseFloat(currentProps.min) : (currentProps.min || 0)
    const currentMax = typeof currentProps.max === 'string' ? parseFloat(currentProps.max) : (currentProps.max || 100)
    const currentStep = typeof currentProps.step === 'string' ? parseFloat(currentProps.step) : (currentProps.step || 1)
    const resetVal = parsedValue !== undefined ? parsedValue : currentMin
    const validatedStep = validateStep(currentStep, currentMin, currentMax)
    const constrainedVal = constrainValue(resetVal, currentMin, currentMax, validatedStep)
    setCurrentValue(constrainedVal)
    thumbPosition.value = getThumbPosition(constrainedVal, trackWidth, currentMin, currentMax)
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
    paddingHorizontal: 14 // 固定内边距，不受 block-size 影响
  }, normalStyle, layoutStyle)

  const trackStyle: ViewStyle = {
    flex: 1,
    height: trackHeight,
    backgroundColor,
    borderRadius: trackHeight / 2,
    position: 'relative'
  }

  // 动画进度条样式
  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      height: '100%',
      backgroundColor: activeColor,
      borderRadius: trackHeight / 2,
      width: Math.max(0, thumbPosition.value)
    }
  })

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
      'catchchange',
      'bindchanging',
      'catchchanging'
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
      // 进度条 - 使用动画样式
      createElement(Animated.View, {
        style: animatedProgressStyle
      }),
      // 滑块容器
      createElement(
        GestureDetector,
        {
          gesture: panGesture
        },
        createElement(
          Animated.View,
          {
            style: [animatedThumbStyle]
          },
          // 滑块
          createElement(View, {
            style: thumbStyle
          })
        )
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
