/**
 * ✔ direction
 * ✘ inertia
 * ✘ out-of-bounds
 * ✔ x
 * ✔ y
 * ✘ damping
 * ✔ friction
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
import { useEffect, forwardRef, ReactNode, useContext } from 'react';
import { StyleSheet, NativeSyntheticEvent, View } from 'react-native';
import { getCustomEvent } from './getInnerListeners';
import useNodesRef, { HandlerRef } from './useNodesRef'
import { MovableAreaContext } from './context'
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDecay,
  withTiming,
  runOnJS,
  useAnimatedReaction
} from 'react-native-reanimated'

interface MovableViewProps {
  children: ReactNode;
  style?: Record<string, any>;
  direction: 'all' | 'vertical' | 'horizontal' | 'none';
  x?: string | number;
  y?: string | number;
  scale?: boolean;
  disabled?: boolean;
  friction?: number;
  'scale-value'?: number;
  'scale-min'?: number;
  'scale-max'?: number;
  bindchange?: (event: unknown) => void;
  bindscale?: (event: unknown) => void;
  bindtouchstart?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  bindtouchmove?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  catchtouchmove?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  bindtouchend?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  bindhtouchmove?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  bindvtouchmove?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  catchhtouchmove?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  catchvtouchmove?: (event: NativeSyntheticEvent<TouchEvent>) => void;
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
    friction = 7,
    x = 0,
    y = 0,
    style = {},
    bindchange
  } = props

  const layoutRef = useSharedValue<any>({})
  const propsShare = useSharedValue<any>({})
  const direction = useSharedValue<string>(props.direction)

  const offsetX = useSharedValue(x);
  const offsetY = useSharedValue(y);

  const hasChangeEvent = useSharedValue(props.bindchange)
  const startPosition = useSharedValue({
    x: 0,
    y: 0
  })

  const draggableXRange = useSharedValue([])
  const draggableYRange = useSharedValue([])
  const isMoving = useSharedValue(false)

  const isFirstTouch = useSharedValue(true)
  let touchEvent = useSharedValue<string>('')

  const contextValue = useContext(MovableAreaContext)
  const MovableAreaLayout = useSharedValue(contextValue)


  propsShare.value = props

  const externalGesture = propsShare.value.externalGesture?.getNodeInstance()

  const { nodeRef } = useNodesRef(props, ref, {
    defaultStyle: styles.container
  })

  useEffect(() => {
    // 监听上下文变化并更新 SharedValue
    MovableAreaLayout.value = contextValue;
  }, [contextValue.width, contextValue.height])

  useEffect(() => {
    if (offsetX.value !== x || offsetY.value !== y) {
      if (layoutRef.value.width && layoutRef.value.height) {
        const { x: newX, y: newY } = checkBoundaryPosition({ clampedScale: 1, positionX: Number(x), positionY: Number(y) })
        offsetX.value = withTiming(newX)
        offsetY.value = withTiming(newY)
        if (hasChangeEvent.value) {
          handleTriggerChange({
            x: newX,
            y: newY
          })
        }
      }
    }
  }, [x, y])

  useAnimatedReaction(
    () => ({
      offsetX: offsetX.value,
      offsetY: offsetY.value
    }),
    (currentValue, previousValue) => {
      if (hasChangeEvent.value) {
        const { offsetX, offsetY } = currentValue
        runOnJS(handleTriggerChange)({
          x: offsetX,
          y: offsetY
        })
      }
    })

  function getTouchSource(offsetX, offsetY) {
    const hasOverBoundary = offsetX < draggableXRange.value[0] || offsetX > draggableXRange.value[1] || offsetY < draggableYRange.value[0] || offsetY > draggableYRange.value[1]
    return hasOverBoundary ? (isMoving.value ? 'touch-out-of-bounds' : 'out-of-bounds') : (isMoving.value ? 'touch' : '');
  }

  function getBoundary({ clampedScale, width, height }: { clampedScale: number; width?: number; height?: number; }) {
    'worklet';
    const top = (style.position === 'absolute' && style.top) || 0;
    const left = (style.position === 'absolute' && style.left) || 0;
    // Calculate scaled element size
    const scaledWidth = (width || layoutRef.value.width) * clampedScale
    const scaledHeight = (height || layoutRef.value.height) * clampedScale

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

  function checkBoundaryPosition({ clampedScale, width, height, positionX, positionY }: { clampedScale: number; width?: number; height?: number; positionX: number; positionY: number }) {
    'worklet';
    // Calculate scaled element size
    const defaultWidth = layoutRef.value.width || 0
    const defaultHeight = layoutRef.value.height || 0
    const scaledWidth = (width || defaultWidth) * clampedScale
    const scaledHeight = (height || defaultHeight) * clampedScale

    // Calculate the boundary limits
    let x = positionX
    let y = positionY
    const { draggableXRange, draggableYRange } = getBoundary({ clampedScale: 1, width: scaledWidth, height: scaledHeight })

    // 计算边界限制
    if (x > draggableXRange[1]) {
      x = draggableXRange[1]
    } else if (y < draggableXRange[0]) {
      x = draggableXRange[0]
    }

    if (y > draggableYRange[1]) {
      y = draggableYRange[1]
    } else if (y < draggableYRange[0]) {
      y = draggableYRange[0]
    }

    return { x, y };
  }

  function onLayout() {
    nodeRef.current?.measure((x: number, y: number, width: number, height: number) => {
      layoutRef.value = { x, y, width, height, offsetLeft: 0, offsetTop: 0 }
      const { x: newX, y: newY } = checkBoundaryPosition({ clampedScale: 1, width, height, positionX: offsetX.value, positionY: offsetY.value })
      offsetX.value = newX
      offsetY.value = newY
      const range = getBoundary({ clampedScale: 1, width, height })
      draggableXRange.value = range.draggableXRange
      draggableYRange.value = range.draggableYRange
    })
  }

  function onTouchMove(e: NativeSyntheticEvent<TouchEvent>) {
    const { bindhtouchmove, bindvtouchmove, bindtouchmove } = props
    if (touchEvent.value === 'htouchmove') {
      bindhtouchmove && bindhtouchmove(e)
    } else if (touchEvent.value === 'vtouchmove') {
      bindvtouchmove && bindvtouchmove(e)
    }
    bindtouchmove && bindtouchmove(e)
  }

  function onCatchTouchMove(e: NativeSyntheticEvent<TouchEvent>) {
    const { catchhtouchmove, catchvtouchmove, catchtouchmove } = props
    if (touchEvent.value === 'htouchmove') {
      catchhtouchmove && catchhtouchmove(e)
    } else if (touchEvent.value === 'vtouchmove') {
      catchvtouchmove && catchvtouchmove(e)
    }
    catchtouchmove && catchtouchmove(e)
  }

  function handleTriggerStart(e) {
    extendEvent(e)
    const touchStartEvent = propsShare.value.bindtouchstart
    if (touchStartEvent) touchStartEvent(e)
  }

  function handleTriggerMove(e) {
    extendEvent(e)
    const hasTouchmove = !!propsShare.value.bindhtouchmove || !!propsShare.value.bindvtouchmove || !!propsShare.value.bindtouchmove
    const hasCatchTouchmove = !!propsShare.value.catchhtouchmove || !!propsShare.value.catchvtouchmove || !!propsShare.value.catchtouchmove
    if (hasTouchmove) {
      onTouchMove(e)
    }
    if (hasCatchTouchmove) {
      onCatchTouchMove(e)
    }
  }
  function handleTriggerEnd(e) {
    extendEvent(e)
    const touchEndEvent = propsShare.value.bindtouchend
    if (touchEndEvent) touchEndEvent(e)
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
          layoutRef: {
            current: layoutRef.value
          }
        }, propsShare.value)
      )
  }

  function extendEvent(e) {
    e.changedTouches.forEach(item => {
      item.pageX = item.absoluteX
      item.pageY = item.absoluteY
    })
    e.allTouches.forEach(item => {
      item.pageX = item.absoluteX
      item.pageY = item.absoluteY
    })
    e.touches = e.allTouches
  }

  const gesture = Gesture.Pan()
    .onTouchesDown((e) => {
      'worklet';

      if (!propsShare.value.disabled) {
        const changedTouches = e.changedTouches[0] || { x: 0, y: 0 }
        isMoving.value = false
        startPosition.value = {
          x: changedTouches.x,
          y: changedTouches.y
        }
      }
      runOnJS(handleTriggerStart)(e)
    })
    .onTouchesMove((e) => {
      'worklet';
      if (propsShare.value.disabled) return
      isMoving.value = true
      const changedTouches = e.changedTouches[0] || { x: 0, y: 0 }
      if (isFirstTouch.value) {
        touchEvent.value = Math.abs(changedTouches.x - startPosition.value.x) > Math.abs(changedTouches.y - startPosition.value.y) ? 'htouchmove' : 'vtouchmove'
        isFirstTouch.value = false
      }
      const changeX = changedTouches.x - startPosition.value.x;
      const changeY = changedTouches.y - startPosition.value.y;
      if (direction.value === 'horizontal' || direction.value === 'all') {
        let newX = offsetX.value + changeX
        if (!propsShare.value['out-of-bounds']) {
          const { x } = checkBoundaryPosition({ clampedScale: 1, positionX: newX, positionY: offsetY.value })
          offsetX.value = x
        } else {
          offsetX.value = newX
        }
      }
      if (direction.value === 'vertical' || direction.value === 'all') {
        let newY = offsetY.value + changeY
        if (!propsShare.value['out-of-bounds']) {
          const { y } = checkBoundaryPosition({ clampedScale: 1, positionX: offsetX.value, positionY: newY });
          offsetY.value = y; // 确保 x 有值
        } else {
          offsetY.value = newY
        }
      }
      runOnJS(handleTriggerMove)(e)
    })
    .onTouchesUp((e) => {
      'worklet';
      isFirstTouch.value = true
      isMoving.value = false

      runOnJS(handleTriggerEnd)(e)
    })
    .onFinalize((event) => {
      'worklet';
      if (propsShare.value.disabled) return
      isMoving.value = false
      const inertia = propsShare.value['inertia']
      const outOfBounds = propsShare.value['out-of-bounds']
      if (direction.value === 'horizontal' || direction.value === 'all') {
        offsetX.value = withDecay({
          velocity: inertia ? event.velocityX : 0,
          rubberBandEffect: outOfBounds,
          clamp: draggableXRange.value
        });
      }
      if (direction.value === 'vertical' || direction.value === 'all') {
        offsetY.value = withDecay({
          velocity: inertia ? event.velocityY : 0,
          rubberBandEffect: outOfBounds,
          clamp: draggableYRange.value
        })
      }
    })
  if (externalGesture?.nodeRef) {
    gesture.simultaneousWithExternalGesture(externalGesture.nodeRef)
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