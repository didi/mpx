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
import { useRef, useState, useEffect, forwardRef, ReactNode, useContext } from 'react';
import { StyleSheet, Animated, NativeSyntheticEvent, PanResponder, View } from 'react-native';
import useInnerProps, { getCustomEvent } from './getInnerListeners';
import useNodesRef, { HandlerRef } from './useNodesRef'
import { MovableAreaContext } from './context'
import { recordPerformance } from './performance'

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
  const startTime = new Date().getTime()
  
  const {
    children,
    friction = 7,
    scale = false,
    direction = 'none',
    x = 0,
    y = 0,
    'scale-min': scaleMin = 0.1,
    'scale-max': scaleMax = 10,
    'scale-value': originScaleValue = 1,
    bindscale,
    bindchange
  } = props

  const pan = useRef<any>(new Animated.ValueXY()).current
  const baseScale = useRef<any>(new Animated.Value(1)).current
  const scaleValue = useRef<any>(new Animated.Value(1)).current
  const [transformOrigin, setTransformOrigin] = useState('0% 0%')
  const panResponder: any = useRef({})


  const disabled = useRef(false);

  const layoutRef = useRef<any>({})
  const MovableAreaLayout = useContext(MovableAreaContext)

  const movablePosition = useRef({
    x: Number(x),
    y: Number(y)
  })

  const { nodeRef } = useNodesRef(props, ref, {
    defaultStyle: styles.container
  })

  let isFirstTouch = true
  let touchEvent = ''
  let initialDistance = 0

  useEffect(() => {
    if (disabled.current !== props.disabled) {
      disabled.current = !!props.disabled
      createPanResponder()
    }
  }, [props.disabled])

  useEffect(() => {
    if (scale && (scaleValue._value !== originScaleValue)) {
      const clampedScale = Math.min(scaleMax, Math.max(scaleMin, originScaleValue))
      Animated.spring(scaleValue, {
        toValue: clampedScale,
        friction,
        useNativeDriver: false,
      }).start(() => {
        bindscale && bindscale(getCustomEvent('scale', {}, {
          detail: {
            x: pan.x._value,
            y: pan.y._value,
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
        clampedScale: scaleValue._value,
        width: layoutRef.current.width,
        height: layoutRef.current.height,
        positionX: Number(x),
        positionY: Number(y)
      })
      movablePosition.current = { x: newX, y: newY }
      Animated.spring(pan, {
        toValue: { x: newX, y: newY },
        useNativeDriver: false,
        friction
      }).start(() => {
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

  const createPanResponder = () => {
    panResponder.current = PanResponder.create({
      onMoveShouldSetPanResponder: () => !disabled.current,
      onMoveShouldSetPanResponderCapture: () => !disabled.current,
      onPanResponderGrant: (e, gestureState) => {
        if (gestureState.numberActiveTouches === 1) {
          setTransformOrigin('0% 0%')
          pan.setOffset({
            x: direction === 'all' || direction === 'horizontal' ? pan.x._value : 0,
            y: direction === 'all' || direction === 'vertical' ? pan.y._value : 0
          });
          pan.setValue({ x: 0, y: 0 });
        } else {
          initialDistance = 0;
          setTransformOrigin('50% 50%')
        }
      },
      onPanResponderMove: (e, gestureState) => {
        if (gestureState.numberActiveTouches === 2 && scale) {
          setTransformOrigin('50% 50%')
          const touch1 = e.nativeEvent.touches[0];
          const touch2 = e.nativeEvent.touches[1];
          const currentTouchDistance = Math.sqrt(
            Math.pow(touch1.pageX - touch2.pageX, 2) + Math.pow(touch1.pageY - touch2.pageY, 2)
          )

          if (!initialDistance) {
            initialDistance = currentTouchDistance;
          } else {
            const newScale = (baseScale._value * currentTouchDistance) / initialDistance
            const clampedScale = Math.min(scaleMax, Math.max(scaleMin, newScale))


            Animated.spring(scaleValue, {
              toValue: clampedScale,
              friction: 7,
              useNativeDriver: false
            }).start();
            bindscale && bindscale(getCustomEvent('scale', e, {
              detail: {
                x: pan.x._value,
                y: pan.y._value,
                scale: clampedScale
              },
              layoutRef
            }, props));
          }
        } else if (gestureState.numberActiveTouches === 1) {
          if (initialDistance) {
            return; // Skip processing if it's switching from a double touch
          }
          setTransformOrigin('0% 0%')
          if (isFirstTouch) {
            touchEvent = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) ? 'htouchmove' : 'vtouchmove'
            isFirstTouch = false;
          }
          Animated.event(
            [
              null,
              {
                dx: direction === 'all' || direction === 'horizontal' ? pan.x : new Animated.Value(0),
                dy: direction === 'all' || direction === 'vertical' ? pan.y : new Animated.Value(0),
              }
            ],
            {
              useNativeDriver: false
            }
          )(e, gestureState);

          movablePosition.current = {
            x: pan.x.__getValue(),
            y: pan.y.__getValue()
          }
          bindchange && bindchange(
            getCustomEvent('change', e, {
              detail: {
                x: movablePosition.current.x,
                y: movablePosition.current.y,
                source: 'touch'
              },
              layoutRef
            }, props)
          )
        }
      },
      onPanResponderRelease: () => {
        pan.flattenOffset()
        isFirstTouch = true
        initialDistance = 0
        const { x, y } = checkBoundaryPosition({
          clampedScale: scaleValue._value,
          width: layoutRef.current.width,
          height: layoutRef.current.height,
          positionX: pan.x._value,
          positionY: pan.y._value
        })
        movablePosition.current = {
          x,
          y
        }
        const needChange = x !== pan.x._value || y !== pan.y._value

        Animated.spring(pan, {
          toValue: { x, y },
          friction: 7,
          useNativeDriver: false
        }).start(() => {
          if (needChange) {
            bindchange && bindchange(
              getCustomEvent('change', {}, {
                detail: {
                  x,
                  y,
                  source: 'out-of-bounds'
                },
                layoutRef
              }, props)
            )
          }
        })
      }
    })
  }

  createPanResponder()
  
  const onLayout = () => {
    nodeRef.current?.measure((x: number, y: number, width: number, height: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft: 0, offsetTop: 0 }
      const clampedScale = Math.min(scaleMax, Math.max(scaleMin, originScaleValue))
      const { x: newX, y: nexY } = checkBoundaryPosition({
        clampedScale,
        width,
        height,
        positionX: movablePosition.current.x,
        positionY: movablePosition.current.y
      })

      Animated.spring(pan, {
        toValue: { x: newX, y: nexY },
        useNativeDriver: false,
        friction
      }).start(() => {
        movablePosition.current = { x: newX, y: nexY }
        bindchange &&
          bindchange(
            getCustomEvent('change', {}, {
              detail: {
                x: newX,
                y: nexY,
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
    if (touchEvent === 'htouchmove') {
      bindhtouchmove && bindhtouchmove(e)
    } else if (touchEvent === 'vtouchmove') {
      bindvtouchmove && bindvtouchmove(e)
    }
    bindtouchmove && bindtouchmove(e)
  }

  const onCatchTouchMove = (e: NativeSyntheticEvent<TouchEvent>) => {
    const { catchhtouchmove, catchvtouchmove, catchtouchmove } = props
    if (touchEvent === 'htouchmove') {
      catchhtouchmove && catchhtouchmove(e)
    } else if (touchEvent === 'vtouchmove') {
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

  const [translateX, translateY] = [pan.x, pan.y];

  const childrenStyle = { transform: [{ translateX }, { translateY }, { scale: scaleValue }], transformOrigin: transformOrigin }

  const hasTouchmove = () => !!props.bindhtouchmove || !!props.bindvtouchmove || !!props.bindtouchmove

  const hasCatchTouchmove = () => !!props.catchhtouchmove || !!props.catchvtouchmove || !!props.catchtouchmove

  const innerProps = useInnerProps(props, {
    ref: nodeRef,
    ...panResponder.current.panHandlers,
    onLayout,
    ...(hasTouchmove() ? { 'bindtouchmove': onTouchMove } : {}),
    ...(hasCatchTouchmove() ? { 'catchtouchmove': onCatchTouchMove } : {}),
  }, [
    'children',
    'style',
    'direction',
    'x',
    'y',
    'scale',
    'disabled',
    'scale-value',
    'scale-min',
    'scale-max',
    'bindchange',
    'bindscale',
    'htouchmove',
    'vtouchmove'
  ], { layoutRef })

  const content = (
    <Animated.View
      {...innerProps}
      style={[styles.container, props.style, childrenStyle]}
    >
      {children}
    </Animated.View>
  );

  recordPerformance(startTime, 'mpx-movable-view')
  
  return content
})

_MovableView.displayName = 'mpx-movable-view'

export default _MovableView