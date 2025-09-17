/**
 * ✔ direction
 * ✔ inertia
 * ✔ out-of-bounds
 * ✔ x
 * ✔ y
 * ✔ damping
 * ✔ friction
 * ✔ disabled
 * ✔ scale
 * ✔ scale-min
 * ✔ scale-max
 * ✔ scale-value
 * ✔ animation
 * ✔ bindchange
 * ✔ bindscale
 * ✔ htouchmove
 * ✔ vtouchmove
 */
import { useEffect, forwardRef, ReactNode, useContext, useCallback, useRef, useMemo, createElement } from 'react'
import { StyleSheet, View, LayoutChangeEvent } from 'react-native'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { MovableAreaContext } from './context'
import { useTransformStyle, splitProps, splitStyle, HIDDEN_STYLE, wrapChildren, GestureHandler, flatGesture, extendObject, omit, useNavigation, useRunOnJSCallback } from './utils'
import { GestureDetector, Gesture, GestureTouchEvent, GestureStateChangeEvent, PanGestureHandlerEventPayload, PanGesture } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  runOnUI,
  withTiming,
  Easing
} from 'react-native-reanimated'
import { collectDataset, noop } from '@mpxjs/utils'

// 参考 better-scroll 的缩放阻尼算法
const applyScaleDamping = (
  scale: number,
  min: number,
  max: number
): number => {
  'worklet'

  if (scale < min) {
    // 缩小超出边界时的阻尼效果
    return 0.5 * min * Math.pow(2.0, scale / min)
  } else if (scale > max) {
    // 放大超出边界时的阻尼效果
    return 2.0 * max * Math.pow(0.5, max / scale)
  }
  return scale
}

// 超出边界处理函数，参考微信小程序的超出边界衰减效果
const applyBoundaryDecline = (
  newValue: number,
  range: [min: number, max: number]
): number => {
  'worklet'

  const decline = (distance: number): number => {
    'worklet'
    return Math.sqrt(Math.abs(distance))
  }

  if (newValue < range[0]) {
    const overDistance = range[0] - newValue
    return range[0] - decline(overDistance)
  } else if (newValue > range[1]) {
    const overDistance = newValue - range[1]
    return range[1] + decline(overDistance)
  }
  return newValue
}

// 注意：现在使用Pinch手势的focalX/focalY和scale属性，
// 不再需要手动计算双指中心点和距离

// 参考微信小程序的弹簧阻尼系统实现
const withWechatSpring = (
  toValue: number,
  dampingParam = 20,
  callback?: () => void
) => {
  'worklet'

  // 弹簧参数计算
  const m = 1 // 质量
  const k = 9 * Math.pow(dampingParam, 2) / 40 // 弹簧系数
  const c = dampingParam // 阻尼系数

  // 判别式：r = c² - 4mk
  const discriminant = c * c - 4 * m * k

  // 计算动画持续时间和缓动函数
  let duration: number
  let easingFunction: any

  if (Math.abs(discriminant) < 0.01) {
    // 临界阻尼 (discriminant ≈ 0)
    // 使用cubic-out模拟临界阻尼的平滑过渡
    duration = Math.max(350, Math.min(800, 2000 / dampingParam))
    easingFunction = Easing.out(Easing.cubic)
  } else if (discriminant > 0) {
    // 过阻尼 (discriminant > 0)
    // 使用指数缓动模拟过阻尼的缓慢收敛
    duration = Math.max(450, Math.min(1000, 2500 / dampingParam))
    easingFunction = Easing.out(Easing.exp)
  } else {
    // 欠阻尼 (discriminant < 0) - 会产生振荡
    // 计算振荡频率和衰减率
    const dampingRatio = c / (2 * Math.sqrt(m * k)) // 阻尼比

    // 根据阻尼比调整动画参数
    if (dampingRatio < 0.7) {
      // 明显振荡
      duration = Math.max(600, Math.min(1200, 3000 / dampingParam))
      // 创建带振荡的贝塞尔曲线
      easingFunction = Easing.bezier(0.175, 0.885, 0.32, 1.275)
    } else {
      // 轻微振荡
      duration = Math.max(400, Math.min(800, 2000 / dampingParam))
      easingFunction = Easing.bezier(0.25, 0.46, 0.45, 0.94)
    }
  }

  return withTiming(toValue, {
    duration,
    easing: easingFunction
  }, callback)
}

// 参考微信小程序friction的惯性动画
const withWechatDecay = (
  velocity: number,
  currentPosition: number,
  clampRange: [min: number, max: number],
  frictionValue = 2,
  callback?: () => void
) => {
  'worklet'

  // 微信小程序friction算法: delta = -1.5 * v² / a, 其中 a = -f * v / |v|
  // 如果friction小于等于0，设置为默认值2
  const validFriction = frictionValue <= 0 ? 2 : frictionValue
  const f = 1000 * validFriction
  const acceleration = velocity !== 0 ? -f * velocity / Math.abs(velocity) : 0
  const delta = acceleration !== 0 ? (-1.5 * velocity * velocity) / acceleration : 0

  let finalPosition = currentPosition + delta

  // 边界限制
  if (finalPosition < clampRange[0]) {
    finalPosition = clampRange[0]
  } else if (finalPosition > clampRange[1]) {
    finalPosition = clampRange[1]
  }

  // 计算动画时长
  const distance = Math.abs(finalPosition - currentPosition)
  const duration = Math.min(1500, Math.max(200, distance * 8))

  return withTiming(finalPosition, {
    duration,
    easing: Easing.out(Easing.cubic)
  }, callback)
}

interface MovableViewProps {
  children: ReactNode
  style?: Record<string, any>
  direction: 'all' | 'vertical' | 'horizontal' | 'none'
  x?: number
  y?: number
  disabled?: boolean
  animation?: boolean
  damping?: number
  friction?: number
  scale?: boolean
  'scale-min'?: number
  'scale-max'?: number
  'scale-value'?: number
  'minimal-zoom-distance'?: number
  id?: string
  changeThrottleTime?:number
  bindchange?: (event: unknown) => void
  bindscale?: (event: unknown) => void
  bindtouchstart?: (event: GestureTouchEvent) => void
  catchtouchstart?: (event: GestureTouchEvent) => void
  bindtouchmove?: (event: GestureTouchEvent) => void
  catchtouchmove?: (event: GestureTouchEvent) => void
  catchtouchend?: (event: GestureTouchEvent) => void
  bindtouchend?: (event: GestureTouchEvent) => void
  bindhtouchmove?: (event: GestureTouchEvent) => void
  bindvtouchmove?: (event: GestureTouchEvent) => void
  catchhtouchmove?: (event: GestureTouchEvent) => void
  catchvtouchmove?: (event: GestureTouchEvent) => void
  bindlongpress?: (event: GestureTouchEvent) => void
  catchlongpress?: (event: GestureTouchEvent) => void
  bindtap?: (event: GestureTouchEvent) => void
  catchtap?: (event: GestureTouchEvent) => void
  onLayout?: (event: LayoutChangeEvent) => void
  'out-of-bounds'?: boolean
  'wait-for'?: Array<GestureHandler>
  'simultaneous-handlers'?: Array<GestureHandler>
  inertia?: boolean
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>
  'parent-font-size'?: number
  'parent-width'?: number
  'parent-height'?: number
  'disable-event-passthrough'?: boolean
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0
  }
})

const _MovableView = forwardRef<HandlerRef<View, MovableViewProps>, MovableViewProps>((movableViewProps: MovableViewProps, ref): JSX.Element => {
  const { textProps, innerProps: props = {} } = splitProps(movableViewProps)
  const movableGestureRef = useRef<PanGesture>()
  const layoutRef = useRef<any>({})
  const changeSource = useRef<any>('')
  const hasLayoutRef = useRef(false)
  const propsRef = useRef<any>({})
  propsRef.current = (props || {}) as MovableViewProps

  const {
    x = 0,
    y = 0,
    inertia = false,
    disabled = false,
    animation = true,
    damping = 20,
    friction = 2,
    scale = false,
    'scale-min': scaleMin = 0.1,
    'scale-max': scaleMax = 10,
    'scale-value': scaleValue = 1,
    'minimal-zoom-distance': minimalZoomDistance = 5,
    'out-of-bounds': outOfBounds = false,
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight,
    direction = 'none',
    'disable-event-passthrough': disableEventPassthrough = false,
    'simultaneous-handlers': originSimultaneousHandlers = [],
    'wait-for': waitFor = [],
    style = {},
    changeThrottleTime = 60,
    bindtouchstart,
    catchtouchstart,
    bindhtouchmove,
    bindvtouchmove,
    bindtouchmove,
    catchhtouchmove,
    catchvtouchmove,
    catchtouchmove,
    bindtouchend,
    catchtouchend,
    bindchange,
    bindscale
  } = props

  const {
    hasSelfPercent,
    normalStyle,
    hasVarDec,
    varContextRef,
    setWidth,
    setHeight
  } = useTransformStyle(Object.assign({}, style, styles.container), { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight })

  const navigation = useNavigation()

  const prevSimultaneousHandlersRef = useRef<Array<GestureHandler>>(originSimultaneousHandlers || [])
  const prevWaitForHandlersRef = useRef<Array<GestureHandler>>(waitFor || [])
  const gestureSwitch = useRef(false)
  const { textStyle, innerStyle } = splitStyle(normalStyle)

  const offsetX = useSharedValue(x)
  const offsetY = useSharedValue(y)
  const currentScale = useSharedValue(scaleValue)
  const layoutValue = useSharedValue<{ width: number; height: number }>({ width: 0, height: 0 })

  const startPosition = useSharedValue({
    x: 0,
    y: 0
  })

  // 缩放相关状态
  const scaleOrigin = useSharedValue({ x: 0, y: 0, baseScale: 1 })
  const startScale = useSharedValue(1)
  const isZooming = useSharedValue(false)
  const numberOfFingers = useSharedValue(0)

  const draggableXRange = useSharedValue<[min: number, max: number]>([0, 0])
  const draggableYRange = useSharedValue<[min: number, max: number]>([0, 0])
  const isMoving = useSharedValue(false)
  const xInertialMotion = useSharedValue(false)
  const yInertialMotion = useSharedValue(false)
  const isFirstTouch = useSharedValue(true)
  const touchEvent = useSharedValue<string>('')
  const initialViewPosition = useSharedValue({ x: x || 0, y: y || 0 })
  const lastChangeTime = useSharedValue(0)

  const MovableAreaLayout = useContext(MovableAreaContext)

  const simultaneousHandlers = flatGesture(originSimultaneousHandlers)
  const waitForHandlers = flatGesture(waitFor)

  const nodeRef = useRef<View>(null)

  useNodesRef(props, ref, nodeRef, {
    style: normalStyle,
    gestureRef: movableGestureRef
  })

  const hasSimultaneousHandlersChanged = prevSimultaneousHandlersRef.current.length !== (originSimultaneousHandlers?.length || 0) ||
    (originSimultaneousHandlers || []).some((handler, index) => handler !== prevSimultaneousHandlersRef.current[index])

  const hasWaitForHandlersChanged = prevWaitForHandlersRef.current.length !== (waitFor?.length || 0) ||
    (waitFor || []).some((handler, index) => handler !== prevWaitForHandlersRef.current[index])

  if (hasSimultaneousHandlersChanged || hasWaitForHandlersChanged) {
    gestureSwitch.current = !gestureSwitch.current
  }

  prevSimultaneousHandlersRef.current = originSimultaneousHandlers || []
  prevWaitForHandlersRef.current = waitFor || []

  const handleTriggerChange = useCallback(({ x, y, type }: { x: number; y: number; type?: string }) => {
    const { bindchange } = propsRef.current
    if (!bindchange) return
    let source = ''
    if (type !== 'setData') {
      source = getTouchSource(x, y)
    } else {
      changeSource.current = ''
    }
    bindchange(
      getCustomEvent('change', {}, {
        detail: {
          x,
          y,
          source
        },
        layoutRef
      }, propsRef.current)
    )
  }, [])

  const handleTriggerScale = useCallback(({ x, y, scale }: { x: number; y: number; scale: number }) => {
    const { bindscale } = propsRef.current
    if (!bindscale) return
    bindscale(
      getCustomEvent('scale', {}, {
        detail: {
          x,
          y,
          scale
        },
        layoutRef
      }, propsRef.current)
    )
  }, [])

  // 参考 better-scroll 实现的缩放逻辑
  const handleScaleUpdate = useCallback(({ scale: gestureScale, focalX, focalY }: {
    scale: number;
    focalX?: number;
    focalY?: number;
  }) => {
    'worklet'
    if (disabled || !scale) return

    const { width, height } = layoutValue.value
    if (width === 0 || height === 0) return

    // 使用双指中心点作为缩放原点（如果有的话），否则使用元素中心
    let originX, originY
    if (focalX !== undefined && focalY !== undefined) {
      // 双指缩放时，使用手势中心点
      originX = focalX - offsetX.value
      originY = focalY - offsetY.value
    } else {
      // 程序控制缩放时，使用元素中心点
      originX = width / 2
      originY = height / 2
    }

    const currentDistance = gestureScale
    if (!isZooming.value && Math.abs(currentDistance - 1) < (minimalZoomDistance / 100)) {
      return
    }

    if (!isZooming.value) {
      isZooming.value = true
      startScale.value = currentScale.value
      scaleOrigin.value = { x: originX, y: originY, baseScale: currentScale.value }
    }

    // 计算新的缩放值
    const newScale = applyScaleDamping(
      startScale.value * gestureScale,
      scaleMin,
      scaleMax
    )

    // 计算位置补偿（参考 better-scroll 算法）
    const ratio = newScale / scaleOrigin.value.baseScale
    const newX = scaleOrigin.value.x - scaleOrigin.value.x * ratio + offsetX.value
    const newY = scaleOrigin.value.y - scaleOrigin.value.y * ratio + offsetY.value

    // 更新缩放和位置
    currentScale.value = newScale
    offsetX.value = newX
    offsetY.value = newY

    // 触发缩放事件
    if (bindscale) {
      runOnJS(handleTriggerScale)({
        x: newX,
        y: newY,
        scale: newScale
      })
    }
  }, [disabled, scale, scaleMin, scaleMax, minimalZoomDistance, bindscale, handleTriggerScale])

  const handleScaleEnd = useCallback(() => {
    'worklet'
    if (disabled || !scale) return

    // 检查是否需要回弹到有效范围
    const { width, height } = layoutValue.value
    if (width === 0 || height === 0) return

    const validScale = Math.max(scaleMin, Math.min(scaleMax, currentScale.value))
    const needsScaleRebound = Math.abs(currentScale.value - validScale) > 0.01

    if (needsScaleRebound) {
      // 缩放回弹，使用better-scroll算法
      const ratio = validScale / scaleOrigin.value.baseScale
      const newX = scaleOrigin.value.x - scaleOrigin.value.x * ratio + initialViewPosition.value.x
      const newY = scaleOrigin.value.y - scaleOrigin.value.y * ratio + initialViewPosition.value.y

      if (animation) {
        currentScale.value = withWechatSpring(validScale, damping)
        offsetX.value = withWechatSpring(newX, damping, () => {
          'worklet'
          // X轴动画结束后更新初始位置
          initialViewPosition.value = {
            x: offsetX.value,
            y: offsetY.value
          }
        })
        offsetY.value = withWechatSpring(newY, damping)
      } else {
        currentScale.value = validScale
        offsetX.value = newX
        offsetY.value = newY
        // 立即更新初始位置
        initialViewPosition.value = {
          x: newX,
          y: newY
        }
      }

      if (bindscale) {
        runOnJS(handleTriggerScale)({
          x: newX,
          y: newY,
          scale: validScale
        })
      }
    }

    // 检查位置边界
    runOnUI(() => {
      // 重新计算边界（在UI线程中）
      const scaledWidth = width * currentScale.value
      const scaledHeight = height * currentScale.value
      const top = (style.position === 'absolute' && style.top) || 0
      const left = (style.position === 'absolute' && style.left) || 0

      const maxY = MovableAreaLayout.height - scaledHeight - top
      const maxX = MovableAreaLayout.width - scaledWidth - left

      let xRange: [min: number, max: number]
      let yRange: [min: number, max: number]

      if (MovableAreaLayout.width < scaledWidth) {
        xRange = [maxX, -left]
      } else {
        xRange = [left === 0 ? 0 : -left, maxX < 0 ? (left === 0 ? 0 : -left) : maxX]
      }

      if (MovableAreaLayout.height < scaledHeight) {
        yRange = [maxY, -top]
      } else {
        yRange = [top === 0 ? 0 : -top, maxY < 0 ? (top === 0 ? 0 : -top) : maxY]
      }

      draggableXRange.value = xRange
      draggableYRange.value = yRange

      const { x: boundedX, y: boundedY } = checkBoundaryPosition({
        positionX: offsetX.value,
        positionY: offsetY.value
      })

      if (Math.abs(offsetX.value - boundedX) > 0.1 || Math.abs(offsetY.value - boundedY) > 0.1) {
        if (animation) {
          offsetX.value = withWechatSpring(boundedX, damping, () => {
            'worklet'
            // 边界动画结束后更新初始位置
            initialViewPosition.value = {
              x: offsetX.value,
              y: offsetY.value
            }
          })
          offsetY.value = withWechatSpring(boundedY, damping)
        } else {
          offsetX.value = boundedX
          offsetY.value = boundedY
          // 立即更新初始位置
          initialViewPosition.value = {
            x: boundedX,
            y: boundedY
          }
        }
      }

      // 如果没有任何位置变化，确保初始位置同步
      if (!needsScaleRebound && Math.abs(offsetX.value - boundedX) <= 0.1 && Math.abs(offsetY.value - boundedY) <= 0.1) {
        initialViewPosition.value = {
          x: offsetX.value,
          y: offsetY.value
        }
      }
    })()
  }, [disabled, scale, scaleMin, scaleMax, animation, damping, bindscale, handleTriggerScale])

  useEffect(() => {
    runOnUI(() => {
      if (offsetX.value !== x || offsetY.value !== y) {
        const { x: newX, y: newY } = checkBoundaryPosition({ positionX: Number(x), positionY: Number(y) })
        if (direction === 'horizontal' || direction === 'all') {
          offsetX.value = animation
            ? withWechatSpring(newX, damping)
            : newX
        }
        if (direction === 'vertical' || direction === 'all') {
          offsetY.value = animation
            ? withWechatSpring(newY, damping)
            : newY
        }
        if (bindchange) {
          runOnJS(runOnJSCallback)('handleTriggerChange', {
            x: newX,
            y: newY,
            type: 'setData'
          })
        }
      }
    })()
  }, [x, y])

  useEffect(() => {
    if (scale && currentScale.value !== scaleValue) {
      runOnUI(() => {
        const validScale = Math.max(scaleMin, Math.min(scaleMax, scaleValue))
        const { width, height } = layoutValue.value

        if (width > 0 && height > 0) {
          // 使用元素中心点作为缩放原点
          const centerX = width / 2
          const centerY = height / 2

          // 计算位置补偿
          const ratio = validScale / currentScale.value
          const newX = centerX - centerX * ratio + offsetX.value
          const newY = centerY - centerY * ratio + offsetY.value

          if (animation) {
            currentScale.value = withWechatSpring(validScale, damping)
            offsetX.value = withWechatSpring(newX, damping)
            offsetY.value = withWechatSpring(newY, damping)
          } else {
            currentScale.value = validScale
            offsetX.value = newX
            offsetY.value = newY
          }

          // 更新边界和初始位置
          const scaledWidth = width * validScale
          const scaledHeight = height * validScale
          const top = (style.position === 'absolute' && style.top) || 0
          const left = (style.position === 'absolute' && style.left) || 0

          const maxY = MovableAreaLayout.height - scaledHeight - top
          const maxX = MovableAreaLayout.width - scaledWidth - left

          let xRange: [min: number, max: number]
          let yRange: [min: number, max: number]

          if (MovableAreaLayout.width < scaledWidth) {
            xRange = [maxX, -left]
          } else {
            xRange = [left === 0 ? 0 : -left, maxX < 0 ? (left === 0 ? 0 : -left) : maxX]
          }

          if (MovableAreaLayout.height < scaledHeight) {
            yRange = [maxY, -top]
          } else {
            yRange = [top === 0 ? 0 : -top, maxY < 0 ? (top === 0 ? 0 : -top) : maxY]
          }

          draggableXRange.value = xRange
          draggableYRange.value = yRange

          // 更新初始位置
          initialViewPosition.value = {
            x: offsetX.value,
            y: offsetY.value
          }

          if (bindscale) {
            runOnJS(handleTriggerScale)({
              x: newX,
              y: newY,
              scale: validScale
            })
          }
        } else {
          currentScale.value = validScale
        }
      })()
    }
  }, [scaleValue, scale, scaleMin, scaleMax, animation, damping, bindscale, handleTriggerScale])

  useEffect(() => {
    const { width, height } = layoutRef.current
    if (width && height) {
      resetBoundaryAndCheck({ width, height })
    }
  }, [MovableAreaLayout.height, MovableAreaLayout.width])

  const getTouchSource = useCallback((offsetX: number, offsetY: number) => {
    const hasOverBoundary = offsetX < draggableXRange.value[0] || offsetX > draggableXRange.value[1] ||
      offsetY < draggableYRange.value[0] || offsetY > draggableYRange.value[1]
    let source = changeSource.current
    if (hasOverBoundary) {
      if (isMoving.value) {
        source = 'touch-out-of-bounds'
      } else {
        source = 'out-of-bounds'
      }
    } else {
      if (isMoving.value) {
        source = 'touch'
      } else if ((xInertialMotion.value || yInertialMotion.value) && (changeSource.current === 'touch' || changeSource.current === 'friction')) {
        source = 'friction'
      }
    }
    changeSource.current = source
    return source
  }, [])

  const setBoundary = useCallback(({ width, height }: { width: number; height: number }) => {
    const top = (style.position === 'absolute' && style.top) || 0
    const left = (style.position === 'absolute' && style.left) || 0

    // 考虑当前缩放值的实际尺寸
    const currentScaleValue = scale ? currentScale.value : 1
    const scaledWidth = (width || 0) * currentScaleValue
    const scaledHeight = (height || 0) * currentScaleValue

    const maxY = MovableAreaLayout.height - scaledHeight - top
    const maxX = MovableAreaLayout.width - scaledWidth - left

    let xRange: [min: number, max: number]
    let yRange: [min: number, max: number]

    if (MovableAreaLayout.width < scaledWidth) {
      xRange = [maxX, -left]
    } else {
      xRange = [left === 0 ? 0 : -left, maxX < 0 ? (left === 0 ? 0 : -left) : maxX]
    }

    if (MovableAreaLayout.height < scaledHeight) {
      yRange = [maxY, -top]
    } else {
      yRange = [top === 0 ? 0 : -top, maxY < 0 ? (top === 0 ? 0 : -top) : maxY]
    }

    draggableXRange.value = xRange
    draggableYRange.value = yRange
  }, [MovableAreaLayout.height, MovableAreaLayout.width, style.position, style.top, style.left, scale])

  const checkBoundaryPosition = useCallback(({ positionX, positionY }: { positionX: number; positionY: number }) => {
    'worklet'
    let x = positionX
    let y = positionY
    // 计算边界限制
    if (x > draggableXRange.value[1]) {
      x = draggableXRange.value[1]
    } else if (x < draggableXRange.value[0]) {
      x = draggableXRange.value[0]
    }

    if (y > draggableYRange.value[1]) {
      y = draggableYRange.value[1]
    } else if (y < draggableYRange.value[0]) {
      y = draggableYRange.value[0]
    }

    return { x, y }
  }, [])

  const resetBoundaryAndCheck = ({ width, height }: { width: number; height: number }) => {
    setBoundary({ width, height })
    runOnUI(() => {
      const positionX = offsetX.value
      const positionY = offsetY.value
      const { x: newX, y: newY } = checkBoundaryPosition({ positionX, positionY })
      if (positionX !== newX) {
        offsetX.value = newX
      }
      if (positionY !== newY) {
        offsetY.value = newY
      }
    })()
  }

  const onLayout = (e: LayoutChangeEvent) => {
    hasLayoutRef.current = true
    if (hasSelfPercent) {
      const { width, height } = e?.nativeEvent?.layout || {}
      setWidth(width || 0)
      setHeight(height || 0)
    }
    nodeRef.current?.measure((x: number, y: number, width: number, height: number) => {
      const { top: navigationY = 0 } = navigation?.layout || {}
      layoutRef.current = { x, y: y - navigationY, width, height, offsetLeft: 0, offsetTop: 0 }

      // 更新布局信息供缩放逻辑使用
      runOnUI(() => {
        layoutValue.value = { width, height }
      })()

      resetBoundaryAndCheck({ width, height })
    })
    props.onLayout && props.onLayout(e)
  }

  const extendEvent = useCallback((e: any, type: 'start' | 'move' | 'end') => {
    const { top: navigationY = 0 } = navigation?.layout || {}
    const touchArr = [e.changedTouches, e.allTouches]
    touchArr.forEach(touches => {
      touches && touches.forEach((item: { absoluteX: number; absoluteY: number; pageX: number; pageY: number; clientX: number; clientY: number }) => {
        item.pageX = item.absoluteX
        item.pageY = item.absoluteY - navigationY
        item.clientX = item.absoluteX
        item.clientY = item.absoluteY - navigationY
      })
    })
    Object.assign(e, {
      touches: type === 'end' ? [] : e.allTouches,
      currentTarget: {
        id: props.id || '',
        dataset: collectDataset(props),
        offsetLeft: 0,
        offsetTop: 0
      },
      detail: {}
    })
  }, [])

  const triggerStartOnJS = ({ e }: { e: GestureTouchEvent }) => {
    const { bindtouchstart, catchtouchstart } = propsRef.current
    extendEvent(e, 'start')
    bindtouchstart && bindtouchstart(e)
    catchtouchstart && catchtouchstart(e)
  }

  const triggerMoveOnJS = ({ e, hasTouchmove, hasCatchTouchmove, touchEvent }: { e: GestureTouchEvent; hasTouchmove: boolean; hasCatchTouchmove: boolean; touchEvent: string }) => {
    const { bindhtouchmove, bindvtouchmove, bindtouchmove, catchhtouchmove, catchvtouchmove, catchtouchmove } = propsRef.current
    extendEvent(e, 'move')
    if (hasTouchmove) {
      if (touchEvent === 'htouchmove') {
        bindhtouchmove && bindhtouchmove(e)
      } else if (touchEvent === 'vtouchmove') {
        bindvtouchmove && bindvtouchmove(e)
      }
      bindtouchmove && bindtouchmove(e)
    }

    if (hasCatchTouchmove) {
      if (touchEvent === 'htouchmove') {
        catchhtouchmove && catchhtouchmove(e)
      } else if (touchEvent === 'vtouchmove') {
        catchvtouchmove && catchvtouchmove(e)
      }
      catchtouchmove && catchtouchmove(e)
    }
  }

  const triggerEndOnJS = ({ e }: { e: GestureTouchEvent }) => {
    const { bindtouchend, catchtouchend } = propsRef.current
    extendEvent(e, 'end')
    bindtouchend && bindtouchend(e)
    catchtouchend && catchtouchend(e)
  }

  const runOnJSCallbackRef = useRef({
    handleTriggerChange,
    handleTriggerScale,
    triggerStartOnJS,
    triggerMoveOnJS,
    triggerEndOnJS
  })
  const runOnJSCallback = useRunOnJSCallback(runOnJSCallbackRef)

  // 节流版本的change事件触发
  const handleTriggerChangeThrottled = useCallback(({ x, y, type }: { x: number; y: number; type?: string }) => {
    'worklet'
    const now = Date.now()
    if (now - lastChangeTime.value >= changeThrottleTime) {
      lastChangeTime.value = now
      runOnJS(runOnJSCallback)('handleTriggerChange', { x, y, type })
    }
  }, [changeThrottleTime])

  const gesture = useMemo(() => {
    const handleTriggerMove = (e: GestureTouchEvent) => {
      'worklet'
      const hasTouchmove = !!bindhtouchmove || !!bindvtouchmove || !!bindtouchmove
      const hasCatchTouchmove = !!catchhtouchmove || !!catchvtouchmove || !!catchtouchmove
      if (hasTouchmove || hasCatchTouchmove) {
        runOnJS(runOnJSCallback)('triggerMoveOnJS', {
          e,
          touchEvent: touchEvent.value,
          hasTouchmove,
          hasCatchTouchmove
        })
      }
    }

    const gesturePan = Gesture.Pan()
      .onTouchesDown((e: GestureTouchEvent) => {
        'worklet'
        const changedTouches = e.changedTouches[0] || { x: 0, y: 0 }
        const fingerCount = e.allTouches?.length || 0

        numberOfFingers.value = fingerCount
        isMoving.value = false

        startPosition.value = {
          x: changedTouches.x,
          y: changedTouches.y
        }

        // 如果之前在缩放，现在开始单指操作，需要重置初始位置
        if (scale && fingerCount === 1 && isZooming.value) {
          isZooming.value = false
          initialViewPosition.value = {
            x: offsetX.value,
            y: offsetY.value
          }
        }

        if (bindtouchstart || catchtouchstart) {
          runOnJS(runOnJSCallback)('triggerStartOnJS', { e })
        }
      })
      .onStart(() => {
        'worklet'
        // 只有在非缩放状态下才更新初始位置
        // 缩放时的位置更新在缩放结束时处理
        if (!scale || !isZooming.value) {
          initialViewPosition.value = {
            x: offsetX.value,
            y: offsetY.value
          }
        }
      })
      .onTouchesMove((e: GestureTouchEvent) => {
        'worklet'
        const changedTouches = e.changedTouches[0] || { x: 0, y: 0 }
        const fingerCount = e.allTouches?.length || 0

        numberOfFingers.value = fingerCount

        // Race手势会自动处理缩放和拖拽的互斥，这里不需要手动检查

        // 单指拖拽处理
        isMoving.value = true
        if (isFirstTouch.value) {
          touchEvent.value = Math.abs(changedTouches.x - startPosition.value.x) > Math.abs(changedTouches.y - startPosition.value.y) ? 'htouchmove' : 'vtouchmove'
          isFirstTouch.value = false
        }
        handleTriggerMove(e)
      })
      .onUpdate((e: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
        'worklet'
        if (disabled) return

        // Race手势会自动处理缩放和拖拽的互斥

        if (direction === 'horizontal' || direction === 'all') {
          const newX = initialViewPosition.value.x + e.translationX
          if (!outOfBounds) {
            const { x } = checkBoundaryPosition({ positionX: newX, positionY: offsetY.value })
            offsetX.value = x
          } else {
            offsetX.value = applyBoundaryDecline(newX, draggableXRange.value)
          }
        }
        if (direction === 'vertical' || direction === 'all') {
          const newY = initialViewPosition.value.y + e.translationY
          if (!outOfBounds) {
            const { y } = checkBoundaryPosition({ positionX: offsetX.value, positionY: newY })
            offsetY.value = y
          } else {
            offsetY.value = applyBoundaryDecline(newY, draggableYRange.value)
          }
        }
        if (bindchange) {
          // 使用节流版本减少 runOnJS 调用
          handleTriggerChangeThrottled({
            x: offsetX.value,
            y: offsetY.value
          })
        }
      })
      .onTouchesUp((e: GestureTouchEvent) => {
        'worklet'
        const fingerCount = e.allTouches?.length || 0
        numberOfFingers.value = fingerCount

        // 注意：缩放结束逻辑现在由Pinch手势处理

        isFirstTouch.value = true
        isMoving.value = false
        if (bindtouchend || catchtouchend) {
          runOnJS(runOnJSCallback)('triggerEndOnJS', { e })
        }
      })
      .onEnd((e: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
        'worklet'
        isMoving.value = false
        if (disabled) return

        // Race手势会自动处理缩放和拖拽的互斥
        // 处理没有惯性且超出边界的回弹
        if (!inertia && outOfBounds) {
          const { x, y } = checkBoundaryPosition({ positionX: offsetX.value, positionY: offsetY.value })
          if (x !== offsetX.value || y !== offsetY.value) {
            if (x !== offsetX.value) {
              offsetX.value = animation
                ? withWechatSpring(x, damping)
                : x
            }
            if (y !== offsetY.value) {
              offsetY.value = animation
                ? withWechatSpring(y, damping)
                : y
            }
            if (bindchange) {
              runOnJS(runOnJSCallback)('handleTriggerChange', {
                x,
                y
              })
            }
          }
        } else if (inertia) {
          // 惯性处理 - 使用微信小程序friction算法
          if (direction === 'horizontal' || direction === 'all') {
            xInertialMotion.value = true
            offsetX.value = withWechatDecay(
              e.velocityX / 10,
              offsetX.value,
              draggableXRange.value,
              friction,
              () => {
                xInertialMotion.value = false
                if (bindchange) {
                  runOnJS(runOnJSCallback)('handleTriggerChange', {
                    x: offsetX.value,
                    y: offsetY.value
                  })
                }
              }
            )
          }
          if (direction === 'vertical' || direction === 'all') {
            yInertialMotion.value = true
            offsetY.value = withWechatDecay(
              e.velocityY / 10,
              offsetY.value,
              draggableYRange.value,
              friction,
              () => {
                yInertialMotion.value = false
                if (bindchange) {
                  runOnJS(runOnJSCallback)('handleTriggerChange', {
                    x: offsetX.value,
                    y: offsetY.value
                  })
                }
              }
            )
          }
        }
      })
      .withRef(movableGestureRef)

    if (!disableEventPassthrough) {
      if (direction === 'horizontal') {
        gesturePan.activeOffsetX([-5, 5]).failOffsetY([-5, 5])
      } else if (direction === 'vertical') {
        gesturePan.activeOffsetY([-5, 5]).failOffsetX([-5, 5])
      }
    }

    if (simultaneousHandlers && simultaneousHandlers.length) {
      gesturePan.simultaneousWithExternalGesture(...simultaneousHandlers)
    }

    if (waitForHandlers && waitForHandlers.length) {
      gesturePan.requireExternalGestureToFail(...waitForHandlers)
    }

    // 添加Pinch缩放手势支持
    if (scale) {
      const gesturePinch = Gesture.Pinch()
        .onStart((e) => {
          'worklet'
          if (disabled) return

          isZooming.value = true
          startScale.value = currentScale.value

          // 获取焦点位置作为缩放原点
          const { width, height } = layoutValue.value
          if (width > 0 && height > 0) {
            // 使用Pinch手势的focal point作为缩放中心
            scaleOrigin.value = {
              x: e.focalX - offsetX.value,
              y: e.focalY - offsetY.value,
              baseScale: currentScale.value
            }
          }

          // 更新初始位置记录
          initialViewPosition.value = {
            x: offsetX.value,
            y: offsetY.value
          }
        })
        .onUpdate((e) => {
          'worklet'
          if (disabled) return

          // 使用Pinch手势的scale值，应用阻尼
          const newScale = applyScaleDamping(
            startScale.value * e.scale,
            scaleMin,
            scaleMax
          )

          // 使用better-scroll的位置补偿算法
          const ratio = newScale / scaleOrigin.value.baseScale
          let newX = scaleOrigin.value.x - scaleOrigin.value.x * ratio + initialViewPosition.value.x
          let newY = scaleOrigin.value.y - scaleOrigin.value.y * ratio + initialViewPosition.value.y

          // 🔥 实时边界约束：根据当前缩放值计算边界
          const { width, height } = layoutValue.value
          if (width > 0 && height > 0) {
            const top = (style.position === 'absolute' && style.top) || 0
            const left = (style.position === 'absolute' && style.left) || 0
            const scaledWidth = width * newScale
            const scaledHeight = height * newScale

            // 计算当前缩放值下的边界限制
            const maxY = MovableAreaLayout.height - scaledHeight - top
            const maxX = MovableAreaLayout.width - scaledWidth - left

            let xMin, xMax, yMin, yMax

            if (MovableAreaLayout.width < scaledWidth) {
              xMin = maxX
              xMax = -left
            } else {
              xMin = left === 0 ? 0 : -left
              xMax = maxX < 0 ? (left === 0 ? 0 : -left) : maxX
            }

            if (MovableAreaLayout.height < scaledHeight) {
              yMin = maxY
              yMax = -top
            } else {
              yMin = top === 0 ? 0 : -top
              yMax = maxY < 0 ? (top === 0 ? 0 : -top) : maxY
            }

            // 根据 out-of-bounds 设置应用边界约束
            if (!outOfBounds) {
              // 严格边界模式：不允许超出边界
              if (newX < xMin) newX = xMin
              else if (newX > xMax) newX = xMax

              if (newY < yMin) newY = yMin
              else if (newY > yMax) newY = yMax
            } else {
              // 弹性边界模式：允许超出但有阻尼
              if (newX < xMin || newX > xMax) {
                newX = applyBoundaryDecline(newX, [xMin, xMax])
              }
              if (newY < yMin || newY > yMax) {
                newY = applyBoundaryDecline(newY, [yMin, yMax])
              }
            }
          }

          currentScale.value = newScale
          offsetX.value = newX
          offsetY.value = newY

          if (bindscale) {
            runOnJS(runOnJSCallback)('handleTriggerScale', {
              x: newX,
              y: newY,
              scale: newScale
            })
          }
        })
        .onEnd(() => {
          'worklet'
          if (disabled) return

          // 🔥 立即标记缩放结束，防止新的手势干扰
          isZooming.value = false

          // 执行缩放结束处理，但不在其中更新initialViewPosition
          // 而是在这里最后更新，确保时序正确
          handleScaleEnd()
        })

      // 组合Pan和Pinch手势：竞争执行，优先识别到的手势获胜
      return Gesture.Race(gesturePan, gesturePinch)
    }

    return gesturePan
  }, [disabled, direction, inertia, outOfBounds, scale, scaleMin, scaleMax, bindscale, handleScaleEnd, runOnJSCallback, gestureSwitch.current, MovableAreaLayout.height, MovableAreaLayout.width, style.position, style.top, style.left])

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: offsetX.value },
        { translateY: offsetY.value },
        { scale: scale ? currentScale.value : 1 }
      ]
    }
  })

  const rewriteCatchEvent = () => {
    const handlers: Record<string, typeof noop> = {}

    const events = [
      { type: 'touchstart' },
      { type: 'touchmove', alias: ['vtouchmove', 'htouchmove'] },
      { type: 'touchend' }
    ]
    events.forEach(({ type, alias = [] }) => {
      const hasCatchEvent =
        props[`catch${type}` as keyof typeof props] ||
        alias.some(name => props[`catch${name}` as keyof typeof props])
      if (hasCatchEvent) handlers[`catch${type}`] = noop
    })

    return handlers
  }

  const layoutStyle = !hasLayoutRef.current && hasSelfPercent ? HIDDEN_STYLE : {}

  // bind 相关 touch 事件直接由 gesture 触发，无须重复挂载
  // catch 相关 touch 事件需要重写并通过 useInnerProps 注入阻止冒泡逻辑
  const filterProps = omit(props, [
    'bindtouchstart',
    'bindtouchmove',
    'bindvtouchmove',
    'bindhtouchmove',
    'bindtouchend',
    'catchtouchstart',
    'catchtouchmove',
    'catchvtouchmove',
    'catchhtouchmove',
    'catchtouchend'
  ])

  const innerProps = useInnerProps(
    extendObject(
      {},
      filterProps,
      {
        ref: nodeRef,
        onLayout: onLayout,
        style: [innerStyle, animatedStyles, layoutStyle]
      },
      rewriteCatchEvent()
    )
  )

  return createElement(GestureDetector, { gesture: gesture }, createElement(
    Animated.View,
    innerProps,
    wrapChildren(
      props,
      {
        hasVarDec,
        varContext: varContextRef.current,
        textStyle,
        textProps
      }
    )
  ))
})

_MovableView.displayName = 'MpxMovableView'

export default _MovableView
