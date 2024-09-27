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
  useAnimatedReaction,
  measure
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

  const offsetX = useSharedValue(x)
  const offsetY = useSharedValue(y)

  const startPosition = useSharedValue({
    x: 0,
    y: 0
  })
  const draggableXRange = useSharedValue<[min: number, max: number]>([0, 0])
  const draggableYRange = useSharedValue<[min: number, max: number]>([0, 0])
  const isMoving = useSharedValue(false)
  const isFirstTouch = useSharedValue(true)
  let touchEvent = useSharedValue<string>('')

  const contextValue = useContext(MovableAreaContext)
  const MovableAreaLayout = useSharedValue(contextValue)

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
    MovableAreaLayout.value = contextValue;
  }, [contextValue.width, contextValue.height])

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
            y: newY
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
    return hasOverBoundary ? (isMoving.value ? 'touch-out-of-bounds' : 'out-of-bounds') : (isMoving.value ? 'touch' : '');
  }, [])

  const getBoundary = () => {
    'worklet';
    const top = (style.position === 'absolute' && style.top) || 0;
    const left = (style.position === 'absolute' && style.left) || 0;

    // Calculate scaled element size
    const measureInfo = measure(nodeRef)
    if (!measureInfo) return {
      draggableXRange: [0, 0],
      draggableYRange: [0, 0]
    }

    const scaledWidth = measureInfo?.width
    const scaledHeight = measureInfo?.height

    let maxY = MovableAreaLayout.value.height - scaledHeight - top
    let maxX = MovableAreaLayout.value.width - scaledWidth - left

    let draggableXRange
    let draggableYRange

    if (MovableAreaLayout.value.width < scaledWidth) {
      draggableXRange = [maxX, 0];
    } else {
      draggableXRange = [-left, maxX < 0 ? 0 : maxX]
    }

    if (MovableAreaLayout.value.height < scaledHeight) {
      draggableYRange = [maxY, 0];
    } else {
      draggableYRange = [-top, maxY < 0 ? 0 : maxY]
    }

    return {
      draggableXRange,
      draggableYRange
    }
  }

  const checkBoundaryPosition = ({ positionX, positionY }: { positionX: number; positionY: number }) => {
    'worklet';
    // Calculate the boundary limits
    let x = positionX
    let y = positionY
    const { draggableXRange, draggableYRange } = getBoundary()

    // 计算边界限制
    if (x > draggableXRange[1]) {
      x = draggableXRange[1]
    } else if (x < draggableXRange[0]) {
      x = draggableXRange[0]
    }

    if (y > draggableYRange[1]) {
      y = draggableYRange[1]
    } else if (y < draggableYRange[0]) {
      y = draggableYRange[0]
    }

    return { x, y };
  }

  const onLayout = () => {
    nodeRef.current?.measure((x: number, y: number, width: number, height: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft: 0, offsetTop: 0 }
      runOnUI(() => {
        const range = getBoundary()
        draggableXRange.value = range.draggableXRange as [min: number, max: number]
        draggableYRange.value = range.draggableYRange as [min: number, max: number]
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

  const onTouchMove = useCallback((e: NativeSyntheticEvent<TouchEvent>) => {
    const { bindhtouchmove, bindvtouchmove, bindtouchmove } = props
    if (touchEvent.value === 'htouchmove') {
      bindhtouchmove && bindhtouchmove(e)
    } else if (touchEvent.value === 'vtouchmove') {
      bindvtouchmove && bindvtouchmove(e)
    }
    bindtouchmove && bindtouchmove(e)
  }, [bindhtouchmove, bindvtouchmove, bindtouchmove])

  const onCatchTouchMove = useCallback((e: NativeSyntheticEvent<TouchEvent>) => {
    if (touchEvent.value === 'htouchmove') {
      catchhtouchmove && catchhtouchmove(e)
    } else if (touchEvent.value === 'vtouchmove') {
      catchvtouchmove && catchvtouchmove(e)
    }
    catchtouchmove && catchtouchmove(e)
  }, [catchhtouchmove, catchvtouchmove, catchtouchmove])

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

  function handleTriggerChange({ x, y }: { x: number; y: number; }) {
    const source = getTouchSource(x, y);
    bindchange &&
      bindchange(
        getCustomEvent('change', {}, {
          detail: {
            x,
            y,
            source: source || ''
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
        offsetX.value = withDecay({
          velocity: inertia ? e.velocityX : 0,
          rubberBandEffect: outOfBounds,
          clamp: draggableXRange.value
        });
      }
      if (direction === 'vertical' || direction === 'all') {
        offsetY.value = withDecay({
          velocity: inertia ? e.velocityY : 0,
          rubberBandEffect: outOfBounds,
          clamp: draggableYRange.value
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