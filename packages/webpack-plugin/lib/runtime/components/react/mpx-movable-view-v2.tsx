/**
 * ✔ direction
 * ✔ inertia
 * ✔ out-of-bounds
 * ✔ x
 * ✔ y
 * ✔ damping
 * ✘ friction
 * ✔ disabled
 * ✘ scale
 * ✘ scale-min
 * ✘ scale-max
 * ✘ scale-value
 * ✘ animation
 * ✔ bindchange
 * ✘ bindscale
 * ✔ htouchmove
 * ✔ vtouchmove
 */
import { useEffect, forwardRef, ReactNode, useContext, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, NativeSyntheticEvent, View } from 'react-native';
import { getCustomEvent } from './getInnerListeners';
import useNodesRef, { HandlerRef } from './useNodesRef'
import { MovableAreaContext } from './context'
import { GestureDetector, Gesture, GestureTouchEvent, GestureStateChangeEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDecay,
  withSpring,
  runOnJS,
  runOnUI,
  useAnimatedReaction
} from 'react-native-reanimated'

interface MovableViewProps {
  children: ReactNode;
  style?: Record<string, any>;
  direction: 'all' | 'vertical' | 'horizontal' | 'none';
  x?: number;
  y?: number;
  disabled?: boolean;
  bindchange?: (event: unknown) => void;
  bindtouchstart?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  bindtouchmove?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  catchtouchmove?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  bindtouchend?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  bindhtouchmove?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  bindvtouchmove?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  catchhtouchmove?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  catchvtouchmove?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  'out-of-bounds'?: boolean;
  externalGesture?: Array<{ getNodeInstance: () => any }>;
  inertia?: boolean;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0
  },
})

const _MovableView = forwardRef<HandlerRef<View, MovableViewProps>, MovableViewProps>((props: MovableViewProps, ref): JSX.Element => {
  const layoutRef = useRef<any>({})
  const changeSource = useRef<any>('')

  const propsRef = useRef({} as MovableViewProps)
  propsRef.current = props

  const {
    children,
    x = 0,
    y = 0,
    inertia,
    disabled,
    damping,
    'out-of-bounds': outOfBounds,
    direction,
    externalGesture = [],
    style = {},
    bindtouchstart,
    bindhtouchmove,
    bindvtouchmove,
    bindtouchmove,
    catchhtouchmove,
    catchvtouchmove,
    catchtouchmove,
    bindtouchend
  } = props

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
  let touchEvent = useSharedValue<string>('')

  const MovableAreaLayout = useContext(MovableAreaContext)

  const externalComponentGesture = externalGesture.map(gesture => {
    const instance = gesture?.getNodeInstance?.() || {}
    return instance.nodeRef
  }).filter(Boolean)

  const { nodeRef } = useNodesRef(props, ref, {
    defaultStyle: styles.container
  }, {
    isAnimatedRef: true
  })

  const handleTriggerChange = useCallback(({ x, y, type }: { x: number; y: number; type?: string }) {
    const { bindchange } = propsRef.current
    if (!bindchange) return
    let source = ''
    if (type !== 'setData') {
      source = getTouchSource(x, y);
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
        const springDamping = damping * 5 || 100,
        if (direction === 'horizontal' || direction === 'all') {
          offsetX.value = withSpring(newX, {
            mass: 0.5,
            damping: springDamping
          })
        }
        if (direction === 'vertical' || direction === 'all') {
          offsetY.value = withSpring(newY, {
            mass: 0.5,
            damping: springDamping
          })
        }
        runOnJS(handleTriggerChange)({
          x: newX,
          y: newY,
          type: 'setData'
        })
      }
    })()
  }, [x, y])

  useAnimatedReaction(
    () => ({
      offsetX: offsetX.value,
      offsetY: offsetY.value
    }),
    (currentValue: { offsetX: any; offsetY: any; }) => {
      const { offsetX, offsetY } = currentValue
      runOnJS(handleTriggerChange)({
        x: offsetX,
        y: offsetY
      })
    })

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
    const top = (style.position === 'absolute' && style.top) || 0;
    const left = (style.position === 'absolute' && style.left) || 0;

    const scaledWidth = width || 0
    const scaledHeight = height || 0

    let maxY = MovableAreaLayout.height - scaledHeight - top
    let maxX = MovableAreaLayout.width - scaledWidth - left

    let xRange
    let yRange

    if (MovableAreaLayout.width < scaledWidth) {
      xRange = [maxX, 0];
    } else {
      xRange = [-left, maxX < 0 ? 0 : maxX]
    }

    if (MovableAreaLayout.height < scaledHeight) {
      yRange = [maxY, 0];
    } else {
      yRange = [-top, maxY < 0 ? 0 : maxY]
    }
    draggableXRange.value = xRange
    draggableYRange.value = yRange
  }, [MovableAreaLayout.height, MovableAreaLayout.width])

  const checkBoundaryPosition = useCallback(({ positionX, positionY }: { positionX: number; positionY: number }) => {
    'worklet';
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

    return { x, y };
  }, [])

  const onLayout = () => {
    nodeRef.current?.measure((x: number, y: number, width: number, height: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft: 0, offsetTop: 0 }
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
    })
  }

  const extendEvent = useCallback((e: any) => {
    'worklet';
    [e.changedTouches, e.allTouches].map(touches => {
      touches && touches.forEach((item: { absoluteX: number; absoluteY: number; pageX: number; pageY: number }) => {
        item.pageX = item.absoluteX
        item.pageY = item.absoluteY
      })
    })
    e.touches = e.allTouches
  }, [])

  const handleTriggerStart = (e: any) => {
    'worklet';
    extendEvent(e)
    bindtouchstart && runOnJS(bindtouchstart)(e)
  }

  const handleTriggerMove = (e: any) => {
    'worklet';
    extendEvent(e)
    const hasTouchmove = !!bindhtouchmove || !!bindvtouchmove || !!bindtouchmove;
    const hasCatchTouchmove = !!catchhtouchmove || !!catchvtouchmove || !!catchtouchmove;

    if (hasTouchmove) {
      if (touchEvent.value === 'htouchmove') {
        bindhtouchmove && runOnJS(bindhtouchmove)(e);
      } else if (touchEvent.value === 'vtouchmove') {
        bindvtouchmove && runOnJS(bindvtouchmove)(e);
      }
      bindtouchmove && runOnJS(bindtouchmove)(e);
    }

    if (hasCatchTouchmove) {
      if (touchEvent.value === 'htouchmove') {
        catchhtouchmove && runOnJS(catchhtouchmove)(e);
      } else if (touchEvent.value === 'vtouchmove') {
        catchvtouchmove && runOnJS(catchvtouchmove)(e);
      }
      catchtouchmove && runOnJS(catchtouchmove)(e);
    }
  };

  const handleTriggerEnd = (e: any) => {
    'worklet';
    extendEvent(e)
    bindtouchend && runOnJS(bindtouchend)(e)
  }

  const gesture = useMemo(() => {
    return Gesture.Pan()
      .onTouchesDown((e: GestureTouchEvent) => {
        'worklet';
        if (!disabled) {
          const changedTouches = e.changedTouches[0] || { x: 0, y: 0 }
          isMoving.value = false
          startPosition.value = {
            x: changedTouches.x,
            y: changedTouches.y
          }
        }
        handleTriggerStart(e)
      })
      .onTouchesMove((e: GestureTouchEvent) => {
        'worklet';
        if (disabled) return
        isMoving.value = true
        const changedTouches = e.changedTouches[0] || { x: 0, y: 0 }
        if (isFirstTouch.value) {
          touchEvent.value = Math.abs(changedTouches.x - startPosition.value.x) > Math.abs(changedTouches.y - startPosition.value.y) ? 'htouchmove' : 'vtouchmove'
          isFirstTouch.value = false
        }
        const changeX = changedTouches.x - startPosition.value.x;
        const changeY = changedTouches.y - startPosition.value.y;
        if (direction === 'horizontal' || direction === 'all') {
          let newX = offsetX.value + changeX
          if (!outOfBounds) {
            const { x } = checkBoundaryPosition({ positionX: newX, positionY: offsetY.value })
            offsetX.value = x
          } else {
            offsetX.value = newX
          }
        }
        if (direction === 'vertical' || direction === 'all') {
          let newY = offsetY.value + changeY
          if (!outOfBounds) {
            const { y } = checkBoundaryPosition({ positionX: offsetX.value, positionY: newY });
            offsetY.value = y
          } else {
            offsetY.value = newY
          }
        }
        handleTriggerMove(e)
      })
      .onTouchesUp((e: GestureTouchEvent) => {
        'worklet';
        isFirstTouch.value = true
        isMoving.value = false

        handleTriggerEnd(e)
      })
      .onFinalize((e: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
        'worklet';
        if (disabled) return
        isMoving.value = false
        if (direction === 'horizontal' || direction === 'all') {
          if (inertia) {
            xInertialMotion.value = true
          }
          offsetX.value = withDecay({
            velocity: inertia ? e.velocityX : 0,
            rubberBandEffect: outOfBounds,
            clamp: draggableXRange.value
          }, () => {
            xInertialMotion.value = false
          });
        }
        if (direction === 'vertical' || direction === 'all') {
          if (inertia) {
            yInertialMotion.value = true
          }
          offsetY.value = withDecay({
            velocity: inertia ? e.velocityY : 0,
            rubberBandEffect: outOfBounds,
            clamp: draggableYRange.value
          }, () => {
            yInertialMotion.value = false
          })
        }
      })
  }, [disabled, direction, inertia, outOfBounds, handleTriggerMove, handleTriggerStart, handleTriggerEnd])

  if (externalComponentGesture && externalComponentGesture.length) {
    gesture.simultaneousWithExternalGesture(...externalComponentGesture)
  }
  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: offsetX.value },
        { translateY: offsetY.value }
      ]
    }
  })
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        ref={nodeRef}
        onLayout={onLayout}
        style={[styles.container, style, animatedStyles]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
})

_MovableView.displayName = '_mpxMovableView'

export default _MovableView