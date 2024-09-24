/**
 * ✔ direction
 * ✘ inertia
 * ✘ out-of-bounds
 * ✔ x
 * ✔ y
 * ✘ damping
 * ✔ friction
 * ✔ disabled
 * ✔ scale
 * ✔ scale-min
 * ✔ scale-max
 * ✔ scale-value
 * ✘ animation
 * ✔ bindchange
 * ✔ bindscale
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
    scale = false,
    x = 0,
    y = 0,
    style = {},
    'scale-min': scaleMin = 0.1,
    'scale-max': scaleMax = 10,
    'scale-value': originScaleValue = 1,
    bindscale,
    bindchange
  } = props


  const layoutRef = useSharedValue<any>({})
  const propsShare = useSharedValue<any>({})
  const direction = useSharedValue<string>(props.direction)

  const offsetX = useSharedValue(props.x);
  const offsetY = useSharedValue(props.y);
  const scaleValue = useSharedValue(1)
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

  const { nodeRef } = useNodesRef(props, ref, {
    defaultStyle: styles.container
  })

  useEffect(() => {
    // 监听上下文变化并更新 SharedValue
    MovableAreaLayout.value = contextValue;
  }, [contextValue])

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
        const hasOverBoundary = offsetX < draggableXRange.value[0] || offsetX > draggableXRange.value[1] || offsetY < draggableYRange.value[0] || offsetY > draggableYRange.value[1]
        let source = ''
        if (hasOverBoundary) {
          if (isMoving.value) {
            source = 'touch-out-of-bounds'
          } else {
            source = 'out-of-bounds'
          }
        } else {
          if (isMoving.value) {
            source = 'touch'
          } else {
            source = ''
          }
        }
        runOnJS(handleTriggerChange)({
          x: offsetX,
          y: offsetY,
          source
        })
      }
    })

  function getBoundary({ clampedScale, width, height }: { clampedScale: number; width?: number; height?: number; }) {
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
    // Calculate scaled element size
    const defaultWidth = layoutRef.value.width || 0
    const defaultHeight = layoutRef.value.height || 0
    const scaledWidth = (width || defaultWidth) * clampedScale
    const scaledHeight = (height || defaultHeight) * clampedScale

    // Calculate the boundary limits
    let x = positionX
    let y = positionY

    // 获取样式中的top和left值
    const top = (style.position === 'absolute' && style.top) || 0
    const left = (style.position === 'absolute' && style.left) || 0

    // 计算边界限制
    if (scaledHeight + top > MovableAreaLayout.value.height) {
      y = Math.max(Math.min(y, MovableAreaLayout.value.height - scaledHeight - top), top)
    } else {
      y = Math.max(Math.min(y, MovableAreaLayout.value.height - scaledHeight - top), 0)
    }

    if (scaledWidth + left > MovableAreaLayout.value.width) {
      x = Math.max(Math.min(x, MovableAreaLayout.value.width - scaledWidth - left), left)
    } else {
      x = Math.max(Math.min(x, MovableAreaLayout.value.width - scaledWidth - left), 0)
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
    const touchStartEvent = propsShare.value.bindtouchstart
    if (touchStartEvent) touchStartEvent(e)
  }

  function handleTriggerMove(e) {
    const hasTouchmove = !!propsShare.value.bindhtouchmove || !!propsShare.value.bindvtouchmove || !!propsShare.value.bindtouchmove
    const hasCatchTouchmove = !!propsShare.value.catchhtouchmove || !!propsShare.value.catchvtouchmove || !!propsShare.value.catchtouchmove
    if (hasTouchmove) {
      onTouchMove(e)
    }
    if (hasCatchTouchmove) {
      onCatchTouchMove(e)
    }
  }

  function handleTriggerChange({ x, y, source }: { x: number; y: number; source?: 'string' }) {
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

  const gesture = Gesture.Pan()
    .onTouchesDown((e) => {
      const changedTouches = e.changedTouches[0] || { x: 0, y: 0 }
      isMoving.value = false
      startPosition.value = {
        x: changedTouches.x,
        y: changedTouches.y
      }
      runOnJS(handleTriggerStart)(e)
    })
    .onTouchesMove((e) => {
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
          newX = x
        }
        offsetX.value = newX
      }
      if (direction.value === 'vertical' || direction.value === 'all') {
        let newY = offsetY.value + changeY
        if (!propsShare.value['out-of-bounds']) {
          const { y } = checkBoundaryPosition({ clampedScale: 1, positionX: offsetX.value, positionY: newY })
          newY = y
        }
        offsetY.value = newY
      }
      runOnJS(handleTriggerMove)(e)
    })
    .onTouchesUp(() => {
      isFirstTouch.value = true
      isMoving.value = false
    })
    .onFinalize((event) => {
      isMoving.value = false
      if (propsShare.value['out-of-bounds']) {
        if (direction.value === 'horizontal' || direction.value === 'all') {
          offsetX.value = withDecay({
            velocity: propsShare.value['inertia'] ? event.velocityX : 0,
            rubberBandEffect: true,
            clamp: draggableXRange.value
          });
        }
        if (direction.value === 'vertical' || direction.value === 'all') {
          offsetY.value = withDecay({
            velocity: propsShare.value['inertia'] ? event.velocityY : 0,
            rubberBandEffect: true,
            clamp: draggableYRange.value
          });
        }
      }
    });

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: offsetX.value },
        { translateY: offsetY.value },
        { scale: scaleValue.value }
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