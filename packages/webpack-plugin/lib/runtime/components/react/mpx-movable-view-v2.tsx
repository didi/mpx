/**
 * ✔ direction
 * ✔ inertia
 * ✔ out-of-bounds
 * ✔ x
 * ✔ y
 * ✘ damping
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
import { useEffect, forwardRef, ReactNode, useContext, useCallback, useRef } from 'react';
import { StyleSheet, NativeSyntheticEvent, View } from 'react-native';
import { getCustomEvent } from './getInnerListeners';
import useNodesRef, { HandlerRef } from './useNodesRef'
import { MovableAreaContext } from './context'
import { GestureDetector, Gesture, GestureTouchEvent, GestureStateChangeEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDecay,
  withTiming,
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
  const {
    children,
    x = 0,
    y = 0,
    style = {},
    inertia,
    disabled,
    'out-of-bounds': outOfBounds,
    direction,
    externalGesture = [],
    bindtouchstart,
    bindhtouchmove,
    catchhtouchmove,
    bindvtouchmove,
    catchvtouchmove,
    bindtouchmove,
    catchtouchmove,
    bindtouchend,
    bindchange,
  } = props

  const propsRef = useRef<any>({})
  const layoutRef = useRef<any>({})
  const changeSource = useRef<any>('')

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

  propsRef.current = props

  useEffect(() => {
    runOnUI(() => {
      if (offsetX.value !== x || offsetY.value !== y) {
        const { x: newX, y: newY } = checkBoundaryPosition({ positionX: Number(x), positionY: Number(y) })
        if (direction === 'horizontal' || direction === 'all') {
          offsetX.value = withTiming(newX)
        }
        if (direction === 'vertical' || direction === 'all') {
          offsetY.value = withTiming(newY)
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

  useAnimatedReaction(
    () => ({
      offsetX: offsetX.value,
      offsetY: offsetY.value
    }),
    (currentValue: { offsetX: any; offsetY: any; }) => {
      if (bindchange) {
        const { offsetX, offsetY } = currentValue
        runOnJS(handleTriggerChange)({
          x: offsetX,
          y: offsetY
        })
      }
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

  const setBoundary = ({ width, height }: { width: number; height: number }) => {
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
  }

  const checkBoundaryPosition = ({ positionX, positionY }: { positionX: number; positionY: number }) => {
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
  }

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

  const onTouchMove = (e: NativeSyntheticEvent<TouchEvent>) => {
    const { bindhtouchmove, bindvtouchmove, bindtouchmove } = props
    if (touchEvent.value === 'htouchmove') {
      bindhtouchmove && bindhtouchmove(e)
    } else if (touchEvent.value === 'vtouchmove') {
      bindvtouchmove && bindvtouchmove(e)
    }
    bindtouchmove && bindtouchmove(e)
  }

  const onCatchTouchMove = (e: NativeSyntheticEvent<TouchEvent>) => {
    if (touchEvent.value === 'htouchmove') {
      catchhtouchmove && catchhtouchmove(e)
    } else if (touchEvent.value === 'vtouchmove') {
      catchvtouchmove && catchvtouchmove(e)
    }
    catchtouchmove && catchtouchmove(e)
  }

  const extendEvent = (e: any) => {
    [e.changedTouches, e.allTouches].map(touches => {
      touches && touches.forEach((item: { absoluteX: number; absoluteY: number; pageX: number; pageY: number }) => {
        item.pageX = item.absoluteX
        item.pageY = item.absoluteY
      })
    })
    e.touches = e.allTouches
  }

  const handleTriggerStart = (e: any) => {
    extendEvent(e)
    bindtouchstart && bindtouchstart(e)
  }

  const handleTriggerMove = (e: any) => {
    extendEvent(e)
    const hasTouchmove = !!bindhtouchmove || !!bindvtouchmove || !!bindtouchmove
    const hasCatchTouchmove = !!catchhtouchmove || !!catchvtouchmove || !!catchtouchmove
    if (hasTouchmove) {
      onTouchMove(e)
    }
    if (hasCatchTouchmove) {
      onCatchTouchMove(e)
    }
  }
  const handleTriggerEnd = (e: any) => {
    extendEvent(e)
    bindtouchend && bindtouchend(e)
  }

  function handleTriggerChange({ x, y, type }: { x: number; y: number; type?: string }) {
    let source = ''
    if (type !== 'setData') {
      source = getTouchSource(x, y);
    } else {
      changeSource.current = ''
    }
    bindchange &&
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
  }

  const gesture = Gesture.Pan()
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
      runOnJS(handleTriggerStart)(e)
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
      runOnJS(handleTriggerMove)(e)
    })
    .onTouchesUp((e: GestureTouchEvent) => {
      'worklet';
      isFirstTouch.value = true
      isMoving.value = false

      runOnJS(handleTriggerEnd)(e)
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

_MovableView.displayName = 'mpx-movable-view'

export default _MovableView