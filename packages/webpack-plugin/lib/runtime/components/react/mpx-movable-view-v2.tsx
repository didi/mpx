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
  withSpring,
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
    direction = 'none',
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
  const layoutRef = useRef<any>({})

  const MovableAreaLayout = useContext(MovableAreaContext)

  const movablePosition = useRef({
    x: Number(x),
    y: Number(y)
  })

  const { nodeRef } = useNodesRef(props, ref, {
    defaultStyle: styles.container
  })

  let isFirstTouch = useRef<boolean>(true)
  let touchEvent = useRef<string>('')
  let initialDistance = useRef<number>(0)

  propsRef.current = props

  useEffect(() => {
    if (scale && (scaleValue.value !== originScaleValue)) {
      const clampedScale = Math.min(scaleMax, Math.max(scaleMin, originScaleValue))
      scaleValue.value = withSpring(clampedScale, {

      }, () => {
        bindscale && bindscale(getCustomEvent('scale', {}, {
          detail: {
            x: offset.value.x,
            y: offset.value.y,
            scale: clampedScale
          },
          layoutRef
        }, props)
        )
      })
    }
  }, [originScaleValue]);

  useEffect(() => {
    if (movablePosition.current.x !== Number(x) || movablePosition.current.y !== Number(y)) {
      const { x: newX, y: newY } = checkBoundaryPosition({
        clampedScale: scaleValue.value,
        width: layoutRef.current.width,
        height: layoutRef.current.height,
        positionX: Number(x),
        positionY: Number(y)
      })
      movablePosition.current = { x: newX, y: newY }
      offset.value = withSpring({ x: newX, y: newY }, {}, () => {
        bindchange &&
          bindchange(
            getCustomEvent('change', {}, {
              detail: {
                x: newX,
                y: newY,
                source: ''
              },
              layoutRef
            }, props)
          );
      })
    }
  }, [x, y])

  const handlePanReleaseOrTerminate = () => {
    isFirstTouch.current = true
    initialDistance.current = 0
    const { x, y } = checkBoundaryPosition({
      clampedScale: scaleValue.value,
      width: layoutRef.current.width,
      height: layoutRef.current.height,
      positionX: offset.value.x,
      positionY: offset.value.y
    })
    movablePosition.current = {
      x,
      y
    }
    const needChange = x !== offset.value.x || y !== offset.value.y
    offset.value = withSpring({ x, y }, {}, () => {
      if (needChange) {
        bindchange && bindchange(
          getCustomEvent('change', {}, {
            detail: {
              x,
              y,
              source: 'out-of-bounds'
            },
            layoutRef
          }, propsRef.current)
        )
      }
    })
  }

  const onLayout = () => {
    nodeRef.current?.measure((x: number, y: number, width: number, height: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft: 0, offsetTop: 0 }
      const clampedScale = Math.min(scaleMax, Math.max(scaleMin, originScaleValue))
      const { x: newX, y: newY } = checkBoundaryPosition({
        clampedScale,
        width,
        height,
        positionX: movablePosition.current.x,
        positionY: movablePosition.current.y
      })

      offset.value = withSpring({ x: newX, y: newY }, {}, () => {
        movablePosition.current = { x: newX, y: newY }
        bindchange &&
          bindchange(
            getCustomEvent('change', {}, {
              detail: {
                x: newX,
                y: newY,
                source: ''
              },
              layoutRef
            }, props)
          )
      })
    })
  }

  const onTouchMove = (e: NativeSyntheticEvent<TouchEvent>) => {
    const { bindhtouchmove, bindvtouchmove, bindtouchmove } = props
    if (touchEvent.current === 'htouchmove') {
      bindhtouchmove && bindhtouchmove(e)
    } else if (touchEvent.current === 'vtouchmove') {
      bindvtouchmove && bindvtouchmove(e)
    }
    bindtouchmove && bindtouchmove(e)
  }

  const onCatchTouchMove = (e: NativeSyntheticEvent<TouchEvent>) => {
    const { catchhtouchmove, catchvtouchmove, catchtouchmove } = props
    if (touchEvent.current === 'htouchmove') {
      catchhtouchmove && catchhtouchmove(e)
    } else if (touchEvent.current === 'vtouchmove') {
      catchvtouchmove && catchvtouchmove(e)
    }
    catchtouchmove && catchtouchmove(e)
  }

  const checkBoundaryPosition = ({ clampedScale, width, height, positionX, positionY }: { clampedScale: number; width: number; height: number; positionX: number; positionY: number }) => {
    // Calculate scaled element size
    const scaledWidth = width * clampedScale
    const scaledHeight = height * clampedScale

    // Calculate the boundary limits
    let x = positionX
    let y = positionY

    // Correct y coordinate
    if (scaledHeight > MovableAreaLayout.height) {
      if (y >= 0) {
        y = 0
      } else if (y < MovableAreaLayout.height - scaledHeight) {
        y = MovableAreaLayout.height - scaledHeight
      }
    } else {
      if (y < 0) {
        y = 0
      } else if (y > MovableAreaLayout.height - scaledHeight) {
        y = MovableAreaLayout.height - scaledHeight
      }
    }
    // Correct x coordinate
    if (scaledWidth > MovableAreaLayout.width) {
      if (x >= 0) {
        x = 0
      } else if (x < MovableAreaLayout.width - scaledWidth) {
        x = MovableAreaLayout.width - scaledWidth
      }
    } else {
      if (x < 0) {
        x = 0
      } else if (x > MovableAreaLayout.width - scaledWidth) {
        x = MovableAreaLayout.width - scaledWidth
      }
    }

    return {
      x,
      y
    }
  }

  const hasTouchmove = () => !!props.bindhtouchmove || !!props.bindvtouchmove || !!props.bindtouchmove

  const hasCatchTouchmove = () => !!props.catchhtouchmove || !!props.catchvtouchmove || !!props.catchtouchmove

  const offset = useSharedValue({ x: 0, y: 0 });
  const start = useSharedValue({ x, y })
  const scaleValue = useSharedValue(1)
  const gesture = Gesture.Pan()
    .onTouchesMove((e) => {
      if (hasTouchmove()) {
        onTouchMove(e)
      }
      if (hasCatchTouchmove()) {
        onCatchTouchMove(e)
      }
    })
    .onUpdate((e) => {
      offset.value = {
        x: e.translationX + start.value.x,
        y: e.translationY + start.value.y,
      };
      bindchange && bindchange(
        getCustomEvent('change', e, {
          detail: {
            x: movablePosition.current.x,
            y: movablePosition.current.y,
            source: 'touch'
          },
          layoutRef
        }, propsRef.current)
      )
    })
    .onEnd(() => {
      start.value = {
        x: offset.value.x,
        y: offset.value.y,
      };
      handlePanReleaseOrTerminate()
    })

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: offset.value.x },
        { translateY: offset.value.y },
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