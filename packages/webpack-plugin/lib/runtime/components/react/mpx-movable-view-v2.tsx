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

  const propsRef = useRef<any>({})
  const layoutRef = useSharedValue<any>({})
  const direction = useSharedValue<string>(props.direction)

  const offsetX = useSharedValue(props.x);
  const offsetY = useSharedValue(props.y);
  const scaleValue = useSharedValue(1)
  const hasChangeEvent = useSharedValue(props.bindchange)
  const startPostion = useSharedValue({
    x: 0,
    y: 0
  })
  const isFirstTouch = useSharedValue(true)

  const contextValue = useContext(MovableAreaContext)
  const MovableAreaLayout = useSharedValue(contextValue)

  useEffect(() => {
    // 监听上下文变化并更新 SharedValue
    MovableAreaLayout.value = contextValue;
  }, [contextValue])

  const { nodeRef } = useNodesRef(props, ref, {
    defaultStyle: styles.container
  })

  let touchEvent = useSharedValue<string>('')

  propsRef.current = props

  const handleTriggerChange = ({ x, y, source }: { x: number; y: number; source: 'string' }) => {
    bindchange &&
      bindchange(
        getCustomEvent('change', {}, {
          detail: {
            x,
            y,
            source
          },
          layoutRef: {
            current: layoutRef.value
          }
        }, props)
      )
  }

  const onLayout = () => {
    nodeRef.current?.measure((x: number, y: number, width: number, height: number) => {
      layoutRef.value = { x, y, width, height, offsetLeft: 0, offsetTop: 0 }
      offsetX.value = withClamp({ min: 0, max: MovableAreaLayout.value.width - width }, withSpring(offsetX.value))
      offsetY.value = withClamp({ min: 0, max: MovableAreaLayout.value.height - height }, withSpring(offsetY.value))
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

  const hasTouchmove = () => !!props.bindhtouchmove || !!props.bindvtouchmove || !!props.bindtouchmove

  const hasCatchTouchmove = () => !!props.catchhtouchmove || !!props.catchvtouchmove || !!props.catchtouchmove

  useAnimatedReaction(
    () => offsetX.value,
    (currentValue: number, previousValue: number) => {
      if (hasChangeEvent) {
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
      if (hasChangeEvent) {
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

  const gesture = Gesture.Pan()
    .onTouchesDown((e) => {
      const changedTouches = e.changedTouches[0] || { x: 0, y: 0 }
      startPostion.value = {
        x: changedTouches.x,
        y: changedTouches.y
      }
    })
    .onTouchesMove((e) => {
      const changedTouches = e.changedTouches[0] || { x: 0, y: 0 }
      if (isFirstTouch.value) {
        touchEvent.value = Math.abs(changedTouches.x - startPostion.value.x) > Math.abs(changedTouches.y - startPostion.value.y) ? 'htouchmove' : 'vtouchmove'
        isFirstTouch.value = false
      }
      const changeX = changedTouches.x - startPostion.value.x;
      const changeY = changedTouches.y - startPostion.value.y;
      if (direction.value === 'horizontal' || direction.value === 'all') {
        offsetX.value = offsetX.value + changeX
      }
      if (direction.value === 'vertical' || direction.value === 'all') {
        offsetY.value = offsetY.value + changeY
      }
      if (hasTouchmove()) {
        onTouchMove(e)
      }
      if (hasCatchTouchmove()) {
        onCatchTouchMove(e)
      }
    })
    .onTouchesUp(() => {
      isFirstTouch.value = true
    })
    .onChange((event) => {
      // if (direction.value === 'horizontal' || direction.value === 'all') {
      //   offsetX.value = offsetX.value + event.changeX
      // }
      // if (direction.value === 'vertical' || direction.value === 'all') {
      //   offsetY.value = offsetY.value + event.changeY
      // }
      let source = 'touch'
      if (offsetX.value < 0 || offsetY.value < 0 || offsetX.value > (MovableAreaLayout.value.width - layoutRef.value.width) || offsetY.value > MovableAreaLayout.value.height - layoutRef.value.height) {
        source = 'touch-out-of-bounds'
      }
      if (hasChangeEvent) {
        runOnJS(handleTriggerChange)({
          x: offsetX.value,
          y: offsetY.value,
          source
        })
      }
    })
    .onFinalize((event) => {
      if (direction.value === 'horizontal' || direction.value === 'all') {
        offsetX.value = withDecay({
          velocity: event.velocityX,
          rubberBandEffect: true,
          clamp: [
            0,
            MovableAreaLayout.value.width - layoutRef.value.width
          ],
        });
      }
      if (direction.value === 'vertical' || direction.value === 'all') {
        offsetY.value = withDecay({
          velocity: event.velocityY,
          rubberBandEffect: true,
          clamp: [
            0,
            MovableAreaLayout.value.height - layoutRef.value.height
          ],
        });
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