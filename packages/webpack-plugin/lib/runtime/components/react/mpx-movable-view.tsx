/**
 * ✔ direction
 * ✔ inertia
 * ✔ out-of-bounds
 * ✔ x
 * ✔ y
 * ✘ damping
 * ✘ friction
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
import { useTransformStyle, splitProps, splitStyle, HIDDEN_STYLE, wrapChildren, GestureHandler, flatGesture, extendObject, omit, useNavigation } from './utils'
import { GestureDetector, Gesture, GestureTouchEvent, GestureStateChangeEvent, PanGestureHandlerEventPayload, PanGesture } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDecay,
  runOnJS,
  runOnUI,
  withSpring,
  withTiming
} from 'react-native-reanimated'
import { collectDataset, noop } from '@mpxjs/utils'

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
    'out-of-bounds': outOfBounds = false,
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight,
    direction = 'none',
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

  // 节流版本的 change 事件触发
  const handleTriggerChangeThrottled = useCallback(({ x, y, type }: { x: number; y: number; type?: string }) => {
    'worklet'
    const now = Date.now()
    if (now - lastChangeTime.value >= changeThrottleTime) {
      lastChangeTime.value = now
      runOnJS(handleTriggerChange)({ x, y, type })
    }
  }, [changeThrottleTime])

  useEffect(() => {
    runOnUI(() => {
      if (offsetX.value !== x || offsetY.value !== y) {
        const { x: newX, y: newY } = checkBoundaryPosition({ positionX: Number(x), positionY: Number(y) })
        if (direction === 'horizontal' || direction === 'all') {
          offsetX.value = animation
            ? withSpring(newX, {
              duration: 1500,
              dampingRatio: 0.8
            })
            : newX
        }
        if (direction === 'vertical' || direction === 'all') {
          offsetY.value = animation
            ? withSpring(newY, {
              duration: 1500,
              dampingRatio: 0.8
            })
            : newY
        }
        if (bindchange) {
          runOnJS(handleTriggerChange)({
            x: newX,
            y: newY,
            type: 'setData'
          })
        }
      }
    })()
  }, [x, y])

  // 提取通用的缩放处理函数
  const handleScaleUpdate = useCallback((scaleInfo: { scale: number }) => {
    'worklet'
    if (disabled) return

    // 判断缩放方向并计算新的缩放值
    const isZoomingIn = scaleInfo.scale > 1
    const isZoomingOut = scaleInfo.scale < 1

    let newScale
    if (isZoomingIn) {
      // 放大：增加缩放值
      newScale = currentScale.value + (scaleInfo.scale - 1) * 0.5
    } else if (isZoomingOut) {
      // 缩小：减少缩放值
      newScale = currentScale.value - (1 - scaleInfo.scale) * 0.5
    } else {
      // 没有缩放变化
      newScale = currentScale.value
    }

    // 限制缩放值在 scaleMin 和 scaleMax 之间
    newScale = Math.max(scaleMin, Math.min(scaleMax, newScale))

    // 更新缩放值
    currentScale.value = newScale

    if (bindscale) {
      runOnJS(handleTriggerScale)({
        x: offsetX.value,
        y: offsetY.value,
        scale: newScale
      })
    }
  }, [disabled, scaleMin, scaleMax, bindscale, handleTriggerScale])

  useEffect(() => {
    runOnUI(() => {
      if (currentScale.value !== scaleValue) {
        // 限制缩放值在 scaleMin 和 scaleMax 之间
        const clampedScale = Math.max(scaleMin, Math.min(scaleMax, scaleValue))

        // 使用 center center 作为 transform-origin，缩放时中心点自动保持不变
        // 只需要更新缩放值，不需要调整位置
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

        if (bindscale) {
          runOnJS(handleTriggerScale)({
            x: offsetX.value,
            y: offsetY.value,
            scale: clampedScale
          })
        }
      }
    })()
  }, [scaleValue, scaleMin, scaleMax, animation])

  useEffect(() => {
    runOnUI(handleRestBoundaryAndCheck)()
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
    'worklet'
    const top = (style.position === 'absolute' && style.top) || 0
    const left = (style.position === 'absolute' && style.left) || 0

    // 使用 center center 作为 transform-origin 时的关键理解：
    // 1. translateX/translateY 仍然指定原始左上角位置
    // 2. 但缩放围绕中心点进行，导致视觉左上角位置偏移
    const currentScaleVal = currentScale.value
    const originalWidth = width || 0
    const originalHeight = height || 0
    const scaledWidth = originalWidth * currentScaleVal
    const scaledHeight = originalHeight * currentScaleVal

    // 计算缩放导致的视觉偏移
    const scaleOffsetX = (scaledWidth - originalWidth) / 2
    const scaleOffsetY = (scaledHeight - originalHeight) / 2

    // 视觉左上角位置 = translateX - scaleOffsetX
    // 边界限制：视觉左上角应该在 [-left, MovableAreaLayout.width - scaledWidth - left] 范围内
    // 转换为对 translateX 的限制：
    const visualMinX = -left
    const visualMaxX = MovableAreaLayout.width - scaledWidth - left
    const translateMinX = visualMinX + scaleOffsetX
    const translateMaxX = visualMaxX + scaleOffsetX

    const visualMinY = -top
    const visualMaxY = MovableAreaLayout.height - scaledHeight - top
    const translateMinY = visualMinY + scaleOffsetY
    const translateMaxY = visualMaxY + scaleOffsetY

    let xRange: [min: number, max: number]
    let yRange: [min: number, max: number]

    if (MovableAreaLayout.width < scaledWidth) {
      xRange = [translateMaxX, translateMinX] // 元素比容器大，范围反转
    } else {
      xRange = [translateMinX, translateMaxX < translateMinX ? translateMinX : translateMaxX]
    }

    if (MovableAreaLayout.height < scaledHeight) {
      yRange = [translateMaxY, translateMinY] // 元素比容器大，范围反转
    } else {
      yRange = [translateMinY, translateMaxY < translateMinY ? translateMinY : translateMaxY]
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

  const handleRestBoundaryAndCheck = () => {
    'worklet'
    const { width, height } = layoutValue.value
    if (width && height) {
      resetBoundaryAndCheck({ width, height })
    }
  }

  const gesture = useMemo(() => {
    const handleTriggerMove = (e: GestureTouchEvent) => {
      'worklet'
      const hasTouchmove = !!bindhtouchmove || !!bindvtouchmove || !!bindtouchmove
      const hasCatchTouchmove = !!catchhtouchmove || !!catchvtouchmove || !!catchtouchmove
      if (hasTouchmove || hasCatchTouchmove) {
        runOnJS(triggerMoveOnJS)({
          e,
          touchEvent: touchEvent.value,
          hasTouchmove,
          hasCatchTouchmove
        })
      }
    }

    const gesturePan = Gesture.Pan()
      .minPointers(1)
      .maxPointers(1)
      .onTouchesDown((e: GestureTouchEvent) => {
        'worklet'
        const changedTouches = e.changedTouches[0] || { x: 0, y: 0 }
        isMoving.value = false
        startPosition.value = {
          x: changedTouches.x,
          y: changedTouches.y
        }
        if (bindtouchstart || catchtouchstart) {
          runOnJS(triggerStartOnJS)({ e })
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
            offsetX.value = newX
          }
        }
        if (direction === 'vertical' || direction === 'all') {
          const newY = initialViewPosition.value.y + e.translationY
          if (!outOfBounds) {
            const { y } = checkBoundaryPosition({ positionX: offsetX.value, positionY: newY })
            offsetY.value = y
          } else {
            offsetY.value = newY
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
          runOnJS(triggerEndOnJS)({ e })
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
                ? withSpring(x, {
                  duration: 1500,
                  dampingRatio: 0.8
                })
                : x
            }
            if (y !== offsetY.value) {
              offsetY.value = animation
                ? withSpring(y, {
                  duration: 1500,
                  dampingRatio: 0.8
                })
                : y
            }
            if (bindchange) {
              runOnJS(handleTriggerChange)({
                x,
                y
              })
            }
          }
        } else if (inertia) {
          // 惯性处理
          if (direction === 'horizontal' || direction === 'all') {
            xInertialMotion.value = true
            offsetX.value = withDecay({
              velocity: e.velocityX / 10,
              rubberBandEffect: outOfBounds,
              clamp: draggableXRange.value
            }, () => {
              xInertialMotion.value = false
              if (bindchange) {
                runOnJS(handleTriggerChange)({
                  x: offsetX.value,
                  y: offsetY.value
                })
              }
            })
          }
          if (direction === 'vertical' || direction === 'all') {
            yInertialMotion.value = true
            offsetY.value = withDecay({
              velocity: e.velocityY / 10,
              rubberBandEffect: outOfBounds,
              clamp: draggableYRange.value
            }, () => {
              yInertialMotion.value = false
              if (bindchange) {
                runOnJS(handleTriggerChange)({
                  x: offsetX.value,
                  y: offsetY.value
                })
              }
            })
          }
        }
      })
      .withRef(movableGestureRef)

    if (direction === 'horizontal') {
      gesturePan.activeOffsetX([-5, 5]).failOffsetY([-5, 5])
    } else if (direction === 'vertical') {
      gesturePan.activeOffsetY([-5, 5]).failOffsetX([-5, 5])
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
        .onUpdate((e: any) => {
          'worklet'
          handleScaleUpdate({ scale: e.scale })
        })
        .onEnd((e: any) => {
          'worklet'
          if (disabled) return
          // 确保最终缩放值在有效范围内
          const finalScale = Math.max(scaleMin, Math.min(scaleMax, currentScale.value))
          if (finalScale !== currentScale.value) {
            currentScale.value = finalScale
            if (bindscale) {
              runOnJS(handleTriggerScale)({
                x: offsetX.value,
                y: offsetY.value,
                scale: finalScale
              })
            }
          }
          // 缩放结束后重新检查边界
          handleRestBoundaryAndCheck()
        })

      // 根据手指数量自动区分手势：一指移动，两指缩放
      return Gesture.Exclusive(gesturePan, gesturePinch)
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
        ref: nodeRef,
        onLayout: onLayout,
        style: [{ transformOrigin: 'center center' }, innerStyle, animatedStyles, layoutStyle]
      },
      rewriteCatchEvent()
    )
  )

  // 生成唯一 ID
  const viewId = useMemo(() => `movable-view-${Date.now()}-${Math.random()}`, [])

  // 注册到 MovableArea（如果启用了 scale-area）
  useEffect(() => {
    if (MovableAreaLayout.scaleArea && MovableAreaLayout.registerMovableView && MovableAreaLayout.unregisterMovableView) {
      const handleAreaScale = (scaleInfo: { scale: number }) => {
        'worklet'
        handleScaleUpdate({ scale: scaleInfo.scale })
      }

      const handleAreaScaleEnd = () => {
        'worklet'
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
  }, [MovableAreaLayout.scaleArea, MovableAreaLayout.registerMovableView, MovableAreaLayout.unregisterMovableView, viewId, scale, handleScaleUpdate, handleRestBoundaryAndCheck])

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
