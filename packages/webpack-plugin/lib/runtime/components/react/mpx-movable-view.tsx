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
  Easing,
  useAnimatedRef,
  measure
} from 'react-native-reanimated'
import { collectDataset, noop } from '@mpxjs/utils'

const debugLog = (...args: any[]): void => {
  'worklet'
  if (!__DEV__) return
  console.log('[mpx-movable-view]', ...args)
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
  scale?: boolean
  'scale-min'?: number
  'scale-max'?: number
  'scale-value'?: number
  damping?: number
  friction?: number
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
    scale = false,
    'scale-min': scaleMin = 0.1,
    'scale-max': scaleMax = 10,
    'scale-value': scaleValue = 1,
    damping = 20,
    friction = 2,
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
    bindscale,
    bindchange,
    onLayout: propsOnLayout
  } = props

  const {
    hasSelfPercent,
    normalStyle,
    hasVarDec,
    varContextRef,
    setWidth,
    setHeight
  } = useTransformStyle(Object.assign({}, styles.container, style), { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight })

  const navigation = useNavigation()

  const prevSimultaneousHandlersRef = useRef<Array<GestureHandler>>(originSimultaneousHandlers || [])
  const prevWaitForHandlersRef = useRef<Array<GestureHandler>>(waitFor || [])
  const gestureSwitch = useRef(false)
  const { textStyle, innerStyle } = splitStyle(normalStyle)

  const offsetX = useSharedValue(x)
  const offsetY = useSharedValue(y)
  const currentScale = useSharedValue(1)
  const layoutValue = useSharedValue<any>({})
  const pinchOrigin = useSharedValue({
    anchorX: 0,
    anchorY: 0,
    anchorScreenX: 0,
    anchorScreenY: 0,
    baseScale: 1,
    baseOffsetX: 0,
    baseOffsetY: 0,
    basePageX: 0,
    basePageY: 0,
    active: false,
    fallbackToCenter: false
  })
  const areaScaleState = useSharedValue({
    baseScale: 1,
    active: false
  })

  const startPosition = useSharedValue({
    x: 0,
    y: 0
  })

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
  const animatedRef = useAnimatedRef<View>()
  const combinedRef = useCallback((value: View | null) => {
    (nodeRef as any).current = value
    ;(animatedRef as any).current = value
  }, [])

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

  // 提取通用的缩放边界计算函数
  const calculateScaleBoundaryPosition = useCallback(({
    targetOffsetX,
    targetOffsetY,
    newScale,
    width,
    height
  }: {
    targetOffsetX: number
    targetOffsetY: number
    newScale: number
    width: number
    height: number
  }) => {
    'worklet'
    const boundaryEpsilon = 1e-3
    const top = (style.position === 'absolute' && style.top) || 0
    const left = (style.position === 'absolute' && style.left) || 0
    const scaledWidth = width * newScale
    const scaledHeight = height * newScale

    const safeValue = (value: number) => Math.abs(value) <= boundaryEpsilon ? 0 : value

    // 计算新缩放值下的边界限制
    const maxOffsetY = safeValue(MovableAreaLayout.height - scaledHeight - top)
    const maxOffsetX = safeValue(MovableAreaLayout.width - scaledWidth - left)

    let xMin, xMax, yMin, yMax

    if (MovableAreaLayout.width + boundaryEpsilon < scaledWidth) {
      xMin = maxOffsetX
      xMax = -left
    } else {
      // 当内容小于容器时，确保有合理的移动范围
      xMin = Math.min(-left, maxOffsetX)
      xMax = Math.max(-left, maxOffsetX)
    }

    if (MovableAreaLayout.height + boundaryEpsilon < scaledHeight) {
      yMin = maxOffsetY
      yMax = -top
    } else {
      // 当内容小于容器时，确保有合理的移动范围
      yMin = Math.min(-top, maxOffsetY)
      yMax = Math.max(-top, maxOffsetY)
    }

    let nextOffsetX = targetOffsetX
    let nextOffsetY = targetOffsetY

    const xRange: [number, number] = [xMin, xMax]
    const yRange: [number, number] = [yMin, yMax]

    // 修复边界处理逻辑：当内容大小小于等于容器时，应该贴边而不是居中
    if (MovableAreaLayout.width + boundaryEpsilon >= scaledWidth) {
      debugLog('boundary处理: 内容 <= 容器', { scaledWidth, containerWidth: MovableAreaLayout.width, targetOffsetX, xMin, xMax })
      // 内容小于等于容器：保持在边界内，但不强制居中
      if (nextOffsetX < xMin) {
        nextOffsetX = xMin // 贴左边
        debugLog('boundary处理: 贴左边', { oldValue: targetOffsetX, newValue: nextOffsetX })
      } else if (nextOffsetX > xMax) {
        nextOffsetX = xMax // 贴右边或保持在合理范围内
        debugLog('boundary处理: 贴右边', { oldValue: targetOffsetX, newValue: nextOffsetX })
      }
      // 如果在范围内，保持当前位置
    } else {
      debugLog('boundary处理: 内容 > 容器', { scaledWidth, containerWidth: MovableAreaLayout.width, targetOffsetX, xMin, xMax, xRangeSize: Math.abs(xRange[0] - xRange[1]) })
      // 内容大于容器：确保容器区域始终被覆盖
      if (Math.abs(xRange[0] - xRange[1]) <= boundaryEpsilon) {
        // 边界范围很小时，使用平滑处理避免跳跃
        const currentOffset = targetOffsetX
        const centerPos = (xMin + xMax) / 2
        const maxDrift = 5
        nextOffsetX = Math.max(centerPos - maxDrift, Math.min(centerPos + maxDrift, currentOffset))
        debugLog('boundary处理: 平滑处理', { oldValue: targetOffsetX, newValue: nextOffsetX, centerPos, maxDrift })
      } else {
        // 正常边界限制
        const oldValue = nextOffsetX
        nextOffsetX = Math.max(xMin, Math.min(xMax, nextOffsetX))
        debugLog('boundary处理: 正常限制', { oldValue, newValue: nextOffsetX, xMin, xMax })
      }
    }

    if (MovableAreaLayout.height + boundaryEpsilon >= scaledHeight) {
      // 内容小于等于容器：保持在边界内，但不强制居中
      if (nextOffsetY < yMin) {
        nextOffsetY = yMin // 贴上边
      } else if (nextOffsetY > yMax) {
        nextOffsetY = yMax // 贴下边或保持在合理范围内
      }
      // 如果在范围内，保持当前位置
    } else {
      // 内容大于容器：确保容器区域始终被覆盖
      if (Math.abs(yRange[0] - yRange[1]) <= boundaryEpsilon) {
        // 边界范围很小时，使用平滑处理避免跳跃
        const currentOffset = targetOffsetY
        const centerPos = (yMin + yMax) / 2
        const maxDrift = 5
        nextOffsetY = Math.max(centerPos - maxDrift, Math.min(centerPos + maxDrift, currentOffset))
      } else {
        // 正常边界限制
        nextOffsetY = Math.max(yMin, Math.min(yMax, nextOffsetY))
      }
    }

    debugLog('calcScaleBoundary', {
      targetOffsetX,
      targetOffsetY,
      newScale,
      width,
      height,
      scaledWidth,
      scaledHeight,
      maxOffsetX,
      maxOffsetY,
      xMin,
      xMax,
      yMin,
      yMax,
      xRange,
      yRange,
      MovableAreaLayoutWidth: MovableAreaLayout.width,
      MovableAreaLayoutHeight: MovableAreaLayout.height,
      result: { x: nextOffsetX, y: nextOffsetY }
    })

    return { x: nextOffsetX, y: nextOffsetY }
  }, [MovableAreaLayout.height, MovableAreaLayout.width, style.position, style.top, style.left])

  useEffect(() => {
    runOnUI(() => {
      if (currentScale.value !== scaleValue) {
        // 限制缩放值在 scaleMin 和 scaleMax 之间
        const clampedScale = Math.max(scaleMin, Math.min(scaleMax, scaleValue))
        const { width = 0, height = 0 } = layoutValue.value

        if (width > 0 && height > 0) {
          const prevScale = currentScale.value || 1
          const centerX = offsetX.value + (width * prevScale) / 2
          const centerY = offsetY.value + (height * prevScale) / 2
          const { x: targetX, y: targetY } = calculateScaleBoundaryPosition({
            targetOffsetX: centerX - (width * clampedScale) / 2,
            targetOffsetY: centerY - (height * clampedScale) / 2,
            newScale: clampedScale,
            width,
            height
          })

          if (animation) {
            currentScale.value = withTiming(clampedScale, {
              duration: 1000
            }, () => {
              handleRestBoundaryAndCheck()
            })
            offsetX.value = withTiming(targetX, { duration: 1000 })
            offsetY.value = withTiming(targetY, { duration: 1000 })
          } else {
            offsetX.value = targetX
            offsetY.value = targetY
            currentScale.value = clampedScale
            handleRestBoundaryAndCheck()
          }
        } else {
          if (animation) {
            currentScale.value = withTiming(clampedScale, {
              duration: 1000
            }, () => {
              handleRestBoundaryAndCheck()
            })
          } else {
            currentScale.value = clampedScale
            handleRestBoundaryAndCheck()
          }
        }

        if (bindscale) {
          runOnJS(runOnJSCallback)('handleTriggerScale', {
            x: offsetX.value,
            y: offsetY.value,
            scale: clampedScale
          })
        }
      }
    })()
  }, [scaleValue, scaleMin, scaleMax, animation, calculateScaleBoundaryPosition])

  useEffect(() => {
    runOnUI(handleRestBoundaryAndCheck)()
  }, [MovableAreaLayout.height, MovableAreaLayout.width])

  // 提取通用的缩放处理函数
  const handleScaleUpdate = useCallback((targetScale: number, options: { anchor?: {
    anchorX: number
    anchorY: number
    anchorScreenX: number
    anchorScreenY: number
    baseScale: number
    baseOffsetX: number
    baseOffsetY: number
  }; keepCenter?: boolean } = {}) => {
    'worklet'
    if (disabled) return

    const clampedScale = Math.max(scaleMin, Math.min(scaleMax, targetScale))
    const { width = 0, height = 0 } = layoutValue.value

    if (width === 0 || height === 0) {
      currentScale.value = clampedScale
      debugLog('handleScaleUpdate no-dimension', {
        targetScale,
        clampedScale,
        offsetX: offsetX.value,
        offsetY: offsetY.value
      })
      if (bindscale) {
        runOnJS(handleTriggerScale)({
          x: offsetX.value,
          y: offsetY.value,
          scale: clampedScale
        })
      }
      return
    }

    let nextOffsetX = offsetX.value
    let nextOffsetY = offsetY.value
    const prevScale = currentScale.value || 1

    debugLog('handleScaleUpdate input', {
      targetScale,
      clampedScale,
      offsetX: offsetX.value,
      offsetY: offsetY.value,
      width,
      height,
      anchor: options.anchor,
      keepCenter: options.keepCenter
    })

    if (options.anchor) {
      const anchor = options.anchor
      const screenX = anchor.anchorScreenX ?? (anchor.baseOffsetX + anchor.anchorX * anchor.baseScale)
      const screenY = anchor.anchorScreenY ?? (anchor.baseOffsetY + anchor.anchorY * anchor.baseScale)
      nextOffsetX = screenX - anchor.anchorX * clampedScale
      nextOffsetY = screenY - anchor.anchorY * clampedScale
      debugLog('handleScaleUpdate anchor计算', {
        anchor,
        screenX,
        screenY,
        clampedScale,
        nextOffsetX,
        nextOffsetY
      })
    } else if (options.keepCenter) {
      const centerX = offsetX.value + (width * prevScale) / 2
      const centerY = offsetY.value + (height * prevScale) / 2
      nextOffsetX = centerX - (width * clampedScale) / 2
      nextOffsetY = centerY - (height * clampedScale) / 2
    } else {
      // 默认保持当前左上角，避免额外补偿
      nextOffsetX = offsetX.value
      nextOffsetY = offsetY.value
    }

    const { x: clampedOffsetX, y: clampedOffsetY } = calculateScaleBoundaryPosition({
      targetOffsetX: nextOffsetX,
      targetOffsetY: nextOffsetY,
      newScale: clampedScale,
      width,
      height
    })

    offsetX.value = clampedOffsetX
    offsetY.value = clampedOffsetY
    currentScale.value = clampedScale

    debugLog('handleScaleUpdate output', {
      clampedOffsetX,
      clampedOffsetY,
      clampedScale
    })

    if (bindscale) {
      runOnJS(handleTriggerScale)({
        x: offsetX.value,
        y: offsetY.value,
        scale: clampedScale
      })
    }
  }, [disabled, scaleMin, scaleMax, bindscale, calculateScaleBoundaryPosition, layoutValue, handleTriggerScale])

  // 生成唯一 ID
  const viewId = useMemo(() => `movable-view-${Date.now()}-${Math.random()}`, [])

  // 注册到 MovableArea（如果启用了 scale-area）
  useEffect(() => {
    if (MovableAreaLayout.scaleArea && MovableAreaLayout.registerMovableView && MovableAreaLayout.unregisterMovableView) {
      const handleAreaScale = (scaleInfo: { scale: number }) => {
        'worklet'
        if (!areaScaleState.value.active) {
          areaScaleState.value = {
            baseScale: currentScale.value || 1,
            active: true
          }
        }
        const targetScale = areaScaleState.value.baseScale * (scaleInfo.scale || 1)
        handleScaleUpdate(targetScale, { keepCenter: true })
      }

      const handleAreaScaleEnd = () => {
        'worklet'
        areaScaleState.value = {
          baseScale: currentScale.value || 1,
          active: false
        }
        handleRestBoundaryAndCheck()
      }

      MovableAreaLayout.registerMovableView?.(viewId, {
        onScale: scale ? handleAreaScale : noop,
        onScaleEnd: scale ? handleAreaScaleEnd : noop
      })

      return () => {
        MovableAreaLayout.unregisterMovableView?.(viewId)
      }
    }
  }, [MovableAreaLayout.scaleArea, viewId, scale, handleScaleUpdate])

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
    'worklet'
    const top = (style.position === 'absolute' && style.top) || 0
    const left = (style.position === 'absolute' && style.left) || 0

    // 使用左上角缩放，计算offset位置的边界范围
    const currentScaleVal = currentScale.value
    const scaledWidth = (width || 0) * currentScaleVal
    const scaledHeight = (height || 0) * currentScaleVal

    // offset位置的边界：左上角可以移动的范围
    const maxOffsetY = MovableAreaLayout.height - scaledHeight - top
    const maxOffsetX = MovableAreaLayout.width - scaledWidth - left

    let xRange: [min: number, max: number]
    let yRange: [min: number, max: number]

    if (MovableAreaLayout.width < scaledWidth) {
      xRange = [maxOffsetX, -left]
    } else {
      // 当内容小于容器时，确保有合理的移动范围，与calculateScaleBoundaryPosition保持一致
      xRange = [Math.min(-left, maxOffsetX), Math.max(-left, maxOffsetX)]
    }

    if (MovableAreaLayout.height < scaledHeight) {
      yRange = [maxOffsetY, -top]
    } else {
      // 当内容小于容器时，确保有合理的移动范围，与calculateScaleBoundaryPosition保持一致
      yRange = [Math.min(-top, maxOffsetY), Math.max(-top, maxOffsetY)]
    }

    draggableXRange.value = xRange
    draggableYRange.value = yRange
  }, [MovableAreaLayout.height, MovableAreaLayout.width, style.position, style.top, style.left])

  const resetBoundaryAndCheck = ({ width, height }: { width: number; height: number }) => {
    'worklet'
    setBoundary({ width, height })
    const positionX = offsetX.value
    const positionY = offsetY.value
    const { x: newX, y: newY } = checkBoundaryPosition({ positionX, positionY })
    debugLog('resetBoundaryAndCheck', {
      positionX,
      positionY,
      newX,
      newY,
      draggableXRange: draggableXRange.value,
      draggableYRange: draggableYRange.value,
      changed: positionX !== newX || positionY !== newY
    })
    if (positionX !== newX) {
      offsetX.value = newX
    }
    if (positionY !== newY) {
      offsetY.value = newY
    }
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
      // 同时更新 layoutValue，供缩放逻辑使用
      runOnUI(() => {
        layoutValue.value = { width, height }
        resetBoundaryAndCheck({ width: width, height: height })
      })()
    })
    propsOnLayout && propsOnLayout(e)
  }

  const extendEvent = useCallback((e: any, type: 'start' | 'move' | 'end') => {
    const { top: navigationY = 0 } = navigation?.layout || {}
    const touchArr = [e.changedTouches, e.allTouches]
    const currentProps = propsRef.current
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
        id: currentProps.id || '',
        dataset: collectDataset(currentProps),
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
    triggerStartOnJS,
    triggerMoveOnJS,
    triggerEndOnJS,
    handleTriggerScale
  })
  const runOnJSCallback = useRunOnJSCallback(runOnJSCallbackRef)

  const handleRestBoundaryAndCheck = () => {
    'worklet'
    const { width, height } = layoutValue.value
    if (width && height) {
      resetBoundaryAndCheck({ width, height })
    }
  }

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
        isMoving.value = false
        startPosition.value = {
          x: changedTouches.x,
          y: changedTouches.y
        }
        debugLog('pan onTouchesDown', {
          changedTouches,
          offsetX: offsetX.value,
          offsetY: offsetY.value
        })
        if (bindtouchstart || catchtouchstart) {
          runOnJS(runOnJSCallback)('triggerStartOnJS', { e })
        }
      })
      .onStart(() => {
        'worklet'
        initialViewPosition.value = {
          x: offsetX.value,
          y: offsetY.value
        }
        debugLog('pan onStart', {
          initialViewPosition: initialViewPosition.value,
          draggableXRange: draggableXRange.value,
          draggableYRange: draggableYRange.value
        })
      })
      .onTouchesMove((e: GestureTouchEvent) => {
        'worklet'
        const changedTouches = e.changedTouches[0] || { x: 0, y: 0 }
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
        debugLog('pan onUpdate', {
          translationX: e.translationX,
          translationY: e.translationY,
          offsetX: offsetX.value,
          offsetY: offsetY.value
        })
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
        debugLog('pan onEnd', {
          offsetX: offsetX.value,
          offsetY: offsetY.value,
          velocityX: e.velocityX,
          velocityY: e.velocityY
        })
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

    // 添加缩放手势支持
    if (scale && !MovableAreaLayout.scaleArea) {
      const gesturePinch = Gesture.Pinch()
        .onStart((e: any) => {
          'worklet'
          const layout = measure(animatedRef)
          const baseScale = currentScale.value || 1
          const baseOffsetX = offsetX.value
          const baseOffsetY = offsetY.value
          const contentWidth = layoutValue.value.width || 0
          const contentHeight = layoutValue.value.height || 0
          const layoutWidth = layout?.width ?? contentWidth * baseScale
          const layoutHeight = layout?.height ?? contentHeight * baseScale
          const pageX = layout?.pageX
          const pageY = layout?.pageY
          const hasValidPage = Number.isFinite(pageX) && Number.isFinite(pageY)
          const hasLayoutMetrics = hasValidPage && layoutWidth > 0 && layoutHeight > 0

          debugLog('pinch onStart', {
            layoutWidth,
            layoutHeight,
            baseScale,
            baseOffsetX,
            baseOffsetY,
            pageX,
            pageY,
            hasLayoutMetrics
          })

          if (!hasLayoutMetrics) {
            pinchOrigin.value = {
              anchorX: contentWidth / 2,
              anchorY: contentHeight / 2,
              anchorScreenX: baseOffsetX + (contentWidth * baseScale) / 2,
              anchorScreenY: baseOffsetY + (contentHeight * baseScale) / 2,
              baseScale,
              baseOffsetX,
              baseOffsetY,
              basePageX: Number(pageX) || 0,
              basePageY: Number(pageY) || 0,
              active: false,
              fallbackToCenter: true
            }
            return
          }

          const fallbackFocalX = (pageX as number) + layoutWidth / 2
          const fallbackFocalY = (pageY as number) + layoutHeight / 2
          const focalX = typeof e.focalX === 'number' ? e.focalX : fallbackFocalX
          const focalY = typeof e.focalY === 'number' ? e.focalY : fallbackFocalY

          const localScreenX = focalX - (pageX as number)
          const localScreenY = focalY - (pageY as number)
          const scaleSafe = baseScale || 1
          const rawAnchorX = (localScreenX - baseOffsetX) / scaleSafe
          const rawAnchorY = (localScreenY - baseOffsetY) / scaleSafe
          const anchorX = isFinite(rawAnchorX) ? rawAnchorX : 0
          const anchorY = isFinite(rawAnchorY) ? rawAnchorY : 0

          pinchOrigin.value = {
            anchorX,
            anchorY,
            anchorScreenX: localScreenX,
            anchorScreenY: localScreenY,
            baseScale,
            baseOffsetX,
            baseOffsetY,
            basePageX: pageX as number,
            basePageY: pageY as number,
            active: true,
            fallbackToCenter: false
          }

          debugLog('pinch onStart resolved', {
            anchorX,
            anchorY,
            localScreenX,
            localScreenY
          })
        })
        .onUpdate((e: any) => {
          'worklet'
          const origin = pinchOrigin.value
          const baseScale = origin.baseScale || 1
          const scaleFactor = e?.scale
          const targetScale = baseScale * (scaleFactor || 1)

          if (!origin.active) {
            handleScaleUpdate(targetScale, origin.fallbackToCenter ? { keepCenter: true } : {})
            return
          }

          const layout = measure(animatedRef)
          const hasLayoutPageX = typeof layout?.pageX === 'number' && isFinite(layout.pageX)
          const hasLayoutPageY = typeof layout?.pageY === 'number' && isFinite(layout.pageY)
          const pageX = hasLayoutPageX ? (layout?.pageX as number) : origin.basePageX
          const pageY = hasLayoutPageY ? (layout?.pageY as number) : origin.basePageY

          let anchorScreenX = origin.anchorScreenX
          let anchorScreenY = origin.anchorScreenY
          let anchorX = origin.anchorX
          let anchorY = origin.anchorY

          if (typeof e.focalX === 'number' && typeof e.focalY === 'number' && isFinite(pageX) && isFinite(pageY)) {
            anchorScreenX = e.focalX - pageX
            anchorScreenY = e.focalY - pageY
            // 修复anchor计算：使用稳定的基础值而非实时的offsetX.value
            const rawAnchorX = (anchorScreenX - origin.baseOffsetX) / origin.baseScale
            const rawAnchorY = (anchorScreenY - origin.baseOffsetY) / origin.baseScale
            if (isFinite(rawAnchorX)) {
              anchorX = rawAnchorX
            }
            if (isFinite(rawAnchorY)) {
              anchorY = rawAnchorY
            }
          }

          const anchorState = {
            ...origin,
            anchorScreenX,
            anchorScreenY,
            anchorX,
            anchorY,
            baseOffsetX: offsetX.value,
            baseOffsetY: offsetY.value,
            basePageX: pageX,
            basePageY: pageY
          }

          handleScaleUpdate(targetScale, {
            anchor: anchorState
          })

          const resolvedScale = currentScale.value || 1
          pinchOrigin.value = {
            ...anchorState,
            baseOffsetX: offsetX.value,
            baseOffsetY: offsetY.value,
            anchorScreenX: offsetX.value + anchorState.anchorX * resolvedScale,
            anchorScreenY: offsetY.value + anchorState.anchorY * resolvedScale
          }

          debugLog('pinch onUpdate', {
            scaleFactor,
            targetScale,
            anchorState,
            resolvedScale,
            offsetX: offsetX.value,
            offsetY: offsetY.value
          })
        })
        .onEnd(() => {
          'worklet'
          if (disabled) return
          const finalScale = Math.max(scaleMin, Math.min(scaleMax, currentScale.value))
          if (finalScale !== currentScale.value) {
            currentScale.value = finalScale
            if (bindscale) {
              runOnJS(runOnJSCallback)('handleTriggerScale', {
                x: offsetX.value,
                y: offsetY.value,
                scale: finalScale
              })
            }
          }

          const origin = pinchOrigin.value
          const nextScale = currentScale.value || 1
          pinchOrigin.value = {
            anchorX: origin.anchorX,
            anchorY: origin.anchorY,
            anchorScreenX: offsetX.value + origin.anchorX * nextScale,
            anchorScreenY: offsetY.value + origin.anchorY * nextScale,
            baseScale: nextScale,
            baseOffsetX: offsetX.value,
            baseOffsetY: offsetY.value,
            basePageX: origin.basePageX,
            basePageY: origin.basePageY,
            active: false,
            fallbackToCenter: false
          }

          handleRestBoundaryAndCheck()

          debugLog('pinch onEnd', {
            finalScale,
            offsetX: offsetX.value,
            offsetY: offsetY.value,
            draggableXRange: draggableXRange.value,
            draggableYRange: draggableYRange.value
          })
        })

      // 根据手指数量自动区分手势：一指移动，两指缩放
      return Gesture.Race(gesturePan, gesturePinch)
    }

    return gesturePan
  }, [disabled, direction, inertia, outOfBounds, scale, scaleMin, scaleMax, animation, gestureSwitch.current, handleScaleUpdate, MovableAreaLayout.scaleArea])

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: offsetX.value },
        { translateY: offsetY.value },
        { scale: currentScale.value }
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
        ref: combinedRef,
        onLayout: onLayout,
        style: [{ transformOrigin: 'top left' }, innerStyle, animatedStyles, layoutStyle]
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
