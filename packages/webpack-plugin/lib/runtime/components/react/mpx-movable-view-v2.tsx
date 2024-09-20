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
import { useRef, useEffect, forwardRef, ReactNode, useContext } from 'react';
import { StyleSheet, NativeSyntheticEvent, View } from 'react-native';
import { getCustomEvent } from './getInnerListeners';
import useNodesRef, { HandlerRef } from './useNodesRef'
import { MovableAreaContext } from './context'
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDecay,
  withSpring,
  runOnJS,
  withClamp,
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
  const isFirstTouch = useSharedValue(true)

  const contextValue = useContext(MovableAreaContext)
  const MovableAreaLayout = useSharedValue(contextValue)

  propsShare.value = props

  useEffect(() => {
    // 监听上下文变化并更新 SharedValue
    MovableAreaLayout.value = contextValue;
  }, [contextValue])

  const { nodeRef } = useNodesRef(props, ref, {
    defaultStyle: styles.container
  })

  let touchEvent = useSharedValue<string>('')

  useEffect(() => {
    if (offsetX.value !== x || offsetY.value !== y) {
      if (layoutRef.value.width && layoutRef.value.height) {
        const { x: newX, y: newY } = checkBoundaryPosition({ clampedScale: 1, width: layoutRef.value.width, height: layoutRef.value.height, positionX: x, positionY: y })
        offsetX.value = withSpring(newX)
        offsetY.value = withSpring(newY)
        handleTriggerChange({
          x: newX,
          y: newY
        })
      }
    }
  }, [x, y])

  const handleTriggerChange = ({ x, y, source }: { x: number; y: number; source?: 'string' }) => {
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

  const onLayout = () => {
    nodeRef.current?.measure((x: number, y: number, width: number, height: number) => {
      layoutRef.value = { x, y, width, height, offsetLeft: 0, offsetTop: 0 }
      const { x: newX, y: newY } = checkBoundaryPosition({ clampedScale: 1, width, height, positionX: offsetX.value, positionY: offsetY.value })
      offsetX.value = withSpring(newX)
      offsetY.value = withSpring(newY)
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
    const { catchhtouchmove, catchvtouchmove, catchtouchmove } = props
    if (touchEvent.value === 'htouchmove') {
      catchhtouchmove && catchhtouchmove(e)
    } else if (touchEvent.value === 'vtouchmove') {
      catchvtouchmove && catchvtouchmove(e)
    }
    catchtouchmove && catchtouchmove(e)
  }

  const hasTouchmove = () => !!propsShare.value.bindhtouchmove || !!propsShare.value.bindvtouchmove || !!propsShare.value.bindtouchmove

  const hasCatchTouchmove = () => !!propsShare.value.catchhtouchmove || !!propsShare.value.catchvtouchmove || !!propsShare.value.catchtouchmove

  useAnimatedReaction(
    () => offsetX.value,
    (currentValue: number, previousValue: number) => {
      if (hasChangeEvent.value) {
        if (currentValue < 0 || currentValue > (MovableAreaLayout.value.width - layoutRef.value.width)) {
          runOnJS(handleTriggerChange)({
            x: currentValue,
            y: offsetY.value,
            source: 'out-of-bounds'
          })
        }
      }
    }
  )
  useAnimatedReaction(
    () => offsetY.value,
    (currentValue: number, previousValue: number) => {
      if (hasChangeEvent.value) {
        if (currentValue < 0 || currentValue > (MovableAreaLayout.value.height - layoutRef.value.height)) {
          runOnJS(handleTriggerChange)({
            x: offsetX.value,
            y: currentValue,
            source: 'out-of-bounds'
          })
        }
      }
    }
  )

  const handleTriggerStart = (e) => {
    const touchStartEvent = propsShare.value.bindtouchstart
    if (touchStartEvent) touchStartEvent(e)
  }

  const handleTriggerMove = (e) => {
    if (hasTouchmove()) {
      onTouchMove(e)
    }
    if (hasCatchTouchmove()) {
      onCatchTouchMove(e)
    }
  }
  const checkBoundaryPosition = ({ clampedScale, width, height, positionX, positionY }: { clampedScale: number; width: number; height: number; positionX: number; positionY: number }) => {
    // Calculate scaled element size
    const scaledWidth = width * clampedScale
    const scaledHeight = height * clampedScale

    // Calculate the boundary limits
    let x = positionX
    let y = positionY

    // Correct y coordinate
    if (scaledHeight > MovableAreaLayout.value.height) {
      if (y >= 0) {
        y = 0
      } else if (y < MovableAreaLayout.value.height - scaledHeight) {
        y = MovableAreaLayout.value.height - scaledHeight
      }
    } else {
      if (y < 0) {
        y = 0
      } else if (y > MovableAreaLayout.value.height - scaledHeight) {
        y = MovableAreaLayout.value.height - scaledHeight
      }
    }
    // Correct x coordinate
    if (scaledWidth > MovableAreaLayout.value.width) {
      if (x >= 0) {
        x = 0
      } else if (x < MovableAreaLayout.value.width - scaledWidth) {
        x = MovableAreaLayout.value.width - scaledWidth
      }
    } else {
      if (x < 0) {
        x = 0
      } else if (x > MovableAreaLayout.value.width - scaledWidth) {
        x = MovableAreaLayout.value.width - scaledWidth
      }
    }

    return {
      x,
      y
    }
  }
  const gesture = Gesture.Pan()
    .onTouchesDown((e) => {
      'worklet'
      const changedTouches = e.changedTouches[0] || { x: 0, y: 0 }
      startPosition.value = {
        x: changedTouches.x,
        y: changedTouches.y
      }
      runOnJS(handleTriggerStart)(e)
    })
    .onTouchesMove((e) => {
      'worklet'
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
          const { x } = checkBoundaryPosition({ clampedScale: 1, width: layoutRef.value.width, height: layoutRef.value.height, positionX: newX, positionY: offsetY.value })
          newX = x
        }
        offsetX.value = newX
      }
      if (direction.value === 'vertical' || direction.value === 'all') {
        let newY = offsetY.value + changeY
        if (!propsShare.value['out-of-bounds']) {
          const { y } = checkBoundaryPosition({ clampedScale: 1, width: layoutRef.value.width, height: layoutRef.value.height, positionX: offsetX.value, positionY: newY })
          newY = y
        }
        offsetY.value = newY
      }
      let source = 'touch'
      if (offsetX.value < 0 || offsetY.value < 0 || offsetX.value > (MovableAreaLayout.value.width - layoutRef.value.width) || offsetY.value > MovableAreaLayout.value.height - layoutRef.value.height) {
        source = 'touch-out-of-bounds'
      }
      if (hasChangeEvent.value) {
        runOnJS(handleTriggerChange)({
          x: offsetX.value,
          y: offsetY.value,
          source
        })
      }
      runOnJS(handleTriggerMove)(e)
    })
    .onTouchesUp(() => {
      'worklet'
      isFirstTouch.value = true
    })
    .onFinalize((event) => {
      'worklet'
      if (propsShare.value['out-of-bounds']) {
        if (direction.value === 'horizontal' || direction.value === 'all') {
          const diffWidth = MovableAreaLayout.value.width - layoutRef.value.width
          const clamp = diffWidth > 0 ? [0, diffWidth] : [diffWidth, 0]
          offsetX.value = withDecay({
            velocity: propsShare.value['inertia'] ? event.velocityX : 0,
            rubberBandEffect: true,
            clamp
          });
        }
        if (direction.value === 'vertical' || direction.value === 'all') {
          const diffHeight = MovableAreaLayout.value.height - layoutRef.value.height
          const clamp = diffHeight > 0 ? [0, diffHeight] : [diffHeight, 0]
          offsetY.value = withDecay({
            velocity: propsShare.value['inertia'] ? event.velocityY : 0,
            rubberBandEffect: true,
            clamp
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