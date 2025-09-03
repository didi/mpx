/**
 * ✔ direction
 * ✔ inertia
 * ✔ out-of-bounds
 * ✔ x
 * ✔ y
 * ✔ damping
 * ✔ friction
 * ✔ disabled
 * ✘ scale
 * ✘ scale-min
 * ✘ scale-max
 * ✘ scale-value
 * ✔ animation
 * ✔ bindchange
 * ✘ bindscale
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
  damping?: number
  friction?: number
  id?: string
  changeThrottleTime?:number
  bindchange?: (event: unknown) => void
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
    bindchange
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

    const scaledWidth = width || 0
    const scaledHeight = height || 0

    const maxY = MovableAreaLayout.height - scaledHeight - top
    const maxX = MovableAreaLayout.width - scaledWidth - left

    let xRange: [min: number, max: number]
    let yRange: [min: number, max: number]

    if (MovableAreaLayout.width < scaledWidth) {
      xRange = [maxX, 0]
    } else {
      xRange = [left === 0 ? 0 : -left, maxX < 0 ? 0 : maxX]
    }

    if (MovableAreaLayout.height < scaledHeight) {
      yRange = [maxY, 0]
    } else {
      yRange = [top === 0 ? 0 : -top, maxY < 0 ? 0 : maxY]
    }
    draggableXRange.value = xRange
    draggableYRange.value = yRange
  }, [MovableAreaLayout.height, MovableAreaLayout.width, style.position, style.top, style.left])

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
        isMoving.value = false
        startPosition.value = {
          x: changedTouches.x,
          y: changedTouches.y
        }
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
    return gesturePan
  }, [disabled, direction, inertia, outOfBounds, gestureSwitch.current])

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: offsetX.value },
        { translateY: offsetY.value }
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
