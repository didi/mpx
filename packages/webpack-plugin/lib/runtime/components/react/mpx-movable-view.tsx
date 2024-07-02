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
 * ✘ animation
 * ✔ bindchange
 * ✔ bindscale
 * ✔ htouchmove
 * ✔ vtouchmove
 */
import { useRef, useEffect, forwardRef, ReactNode, useContext } from 'react';
import { StyleSheet, Animated, NativeSyntheticEvent, PanResponder } from 'react-native';
import useInnerProps, { getCustomEvent } from './getInnerListeners';
import { MovableAreaContext } from './context'

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
    'scale-min': scaleMin = 0.1,
    'scale-max': scaleMax = 10,
    'scale-value': originScaleValue = 1,
    bindscale,
    bindchange
  } = props

  const pan = useRef<any>(new Animated.ValueXY()).current
  const baseScale = useRef<any>(new Animated.Value(1)).current
  const scaleValue = useRef<any>(new Animated.Value(1)).current
  const panResponder: any = useRef({})


  const disabled = useRef(false);

  const nodeRef = useRef(null)
  const layoutRef = useRef<any>({})

  const MovableAreaLayout = useContext(MovableAreaContext)

  const offsetPosition = useRef({ x: 0, y: 0 })

  const movablePosition = useRef({
    x: Number(x),
    y: Number(y)
  })

  let isFirstTouch = true
  let touchEvent = ''
  let initialDistance = 0;
  let isLayoutChanged = false

  const setOffsetPosition = ({ clampedScale, width, height }: { clampedScale: number; width: number; height: number }) => {
    const scaledWidth = width * clampedScale;
    const scaledHeight = height * clampedScale
    offsetPosition.current = {
      x: (scaledWidth - width) / 2 || 0,
      y: (scaledHeight - width) / 2 || 0
    }
    return {
      scaledWidth,
      scaledHeight
    }
  }
  const onLayout = () => {
    nodeRef.current?.measure((x: number, y: number, width: number, height: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft: 0, offsetTop: 0 }
      if (!isLayoutChanged) {
        isLayoutChanged = true
        const clampedScale = Math.min(scaleMax, Math.max(scaleMin, originScaleValue));
        setOffsetPosition({
          clampedScale,
          width,
          height
        })
        Animated.spring(pan, {
          toValue: { x: Number(props.x) + offsetPosition.current.x, y: Number(props.y) + offsetPosition.current.y },
          useNativeDriver: false,
          friction
        }).start(() => {
          movablePosition.current = { x: Number(props.x), y: Number(props.y) }
          bindchange &&
            bindchange(
              getCustomEvent('change', {}, {
                detail: {
                  x: movablePosition.current.x,
                  y: movablePosition.current.y,
                  source: ''
                },
                layoutRef
              }, props)
            );
        })
      }
    })
  }
  const onTouchMove = (e: NativeSyntheticEvent<TouchEvent>) => {
    const { bindhtouchmove, bindvtouchmove, bindtouchmove, catchtouchmove } = props
    if (touchEvent === 'htouchmove') {
      bindhtouchmove && bindhtouchmove(e)
    } else if (touchEvent === 'vtouchmove') {
      bindvtouchmove && bindvtouchmove(e)
    }
    if (bindtouchmove) {
      bindtouchmove(e)
    } else if (catchtouchmove) {
      catchtouchmove(e)
    }
  }
  const onCatchTouchMove = (e: NativeSyntheticEvent<TouchEvent>) => {
    const { catchhtouchmove, catchvtouchmove, bindtouchmove, catchtouchmove } = props
    if (touchEvent === 'htouchmove') {
      catchhtouchmove && catchhtouchmove(e)
    } else if (touchEvent === 'vtouchmove') {
      catchvtouchmove && catchvtouchmove(e)
    }
    if (bindtouchmove) {
      bindtouchmove(e)
    } else if (catchtouchmove) {
      catchtouchmove(e)
    }
  }

  const createPanResponder = () => {
    panResponder.current = PanResponder.create({
      onMoveShouldSetPanResponder: () => !disabled.current,
      onMoveShouldSetPanResponderCapture: () => !disabled.current,
      onPanResponderGrant: (e, gestureState) => {
        if (gestureState.numberActiveTouches === 1) {
          pan.setOffset({
            x: direction === 'all' || direction === 'horizontal' ? pan.x._value : 0,
            y: direction === 'all' || direction === 'vertical' ? pan.y._value : 0
          });
          pan.setValue({ x: 0, y: 0 });
        } else {
          initialDistance = 0;
        }
      },
      onPanResponderMove: (e, gestureState) => {
        if (gestureState.numberActiveTouches === 2 && scale) {
          const touch1 = e.nativeEvent.touches[0];
          const touch2 = e.nativeEvent.touches[1];
          const currentTouchDistance = Math.sqrt(
            Math.pow(touch1.pageX - touch2.pageX, 2) + Math.pow(touch1.pageY - touch2.pageY, 2)
          );

          if (!initialDistance) {
            initialDistance = currentTouchDistance;
          } else {
            const newScale = (baseScale._value * currentTouchDistance) / initialDistance;
            const clampedScale = Math.min(scaleMax, Math.max(scaleMin, newScale));

            Animated.spring(scaleValue, {
              toValue: clampedScale,
              friction: 7,
              useNativeDriver: false
            }).start();
            bindscale && bindscale(getCustomEvent('change', e, {
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

          if (isFirstTouch) {
            touchEvent = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) ? 'htouchmove' : 'vtouchmove';
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
            x: pan.x.__getValue() - offsetPosition.current.x,
            y: pan.y.__getValue() - offsetPosition.current.y,
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
          );
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        pan.flattenOffset();
        isFirstTouch = true;
        initialDistance = 0;

        // Calculate scaled element size
        const { scaledWidth, scaledHeight } = setOffsetPosition({
          clampedScale: scaleValue._value,
          width: layoutRef.current.width,
          height: layoutRef.current.height
        })

        // Calculate the boundary limits
        let x = pan.x._value;
        let y = pan.y._value;

        let needCorrectX = false
        let needCorrectY = false
        // Correct x coordinate
        if (x < 0) {
          x = 0 + offsetPosition.current.x
          needCorrectX = true
        } else if (x > MovableAreaLayout.width - scaledWidth) {
          x = MovableAreaLayout.width - scaledWidth + offsetPosition.current.x
          needCorrectX = true
        }

        // Correct y coordinate
        if (y < 0) {
          y = 0 + offsetPosition.current.x
          needCorrectY = true
        } else if (y > MovableAreaLayout.height - scaledHeight) {
          y = MovableAreaLayout.height - scaledHeight + offsetPosition.current.x
          needCorrectY = true
        }
        movablePosition.current = {
          x: needCorrectX ? x - offsetPosition.current.x : x,
          y: needCorrectY ? y - offsetPosition.current.x : y
        }
        const needChange = x !== pan.x._value || y !== pan.y._value;

        Animated.spring(pan, {
          toValue: { x, y },
          friction: 7,
          useNativeDriver: false
        }).start(() => {
          if (needChange) {
            bindchange && bindchange(
              getCustomEvent('change', e, {
                detail: {
                  x: movablePosition.current.x,
                  y: movablePosition.current.y,
                  source: 'out-of-bounds'
                },
                layoutRef
              }, props)
            );
          }
        });
      }
    });
  }
  createPanResponder()

  useEffect(() => {
    if (disabled.current !== props.disabled) {
      disabled.current = !!props.disabled
      createPanResponder()
    }
  }, [props.disabled]);


  useEffect(() => {
    if (scaleValue._value !== originScaleValue) {
      const clampedScale = Math.min(scaleMax, Math.max(scaleMin, originScaleValue));
      Animated.spring(scaleValue, {
        toValue: clampedScale,
        friction,
        useNativeDriver: false,
      }).start(() => {
        bindscale && bindscale(getCustomEvent('change', {}, {
          detail: {
            x: pan.x._value - offsetPosition.current.x,
            y: pan.y._value - offsetPosition.current.y,
            scale: clampedScale
          },
          layoutRef
        }, props)
        );
      });
    }
  }, [originScaleValue]);

  useEffect(() => {
    if (movablePosition.current.x !== Number(x) || movablePosition.current.y !== Number(y)) {
      movablePosition.current = { x: Number(x), y: Number(y) }
      Animated.spring(pan, {
        toValue: { x: Number(x) + offsetPosition.current.x, y: Number(y) + offsetPosition.current.y },
        useNativeDriver: false,
        friction
      }).start(() => {
        bindchange &&
          bindchange(
            getCustomEvent('change', {}, {
              detail: {
                x: movablePosition.current.x,
                y: movablePosition.current.y,
                source: ''
              },
              layoutRef
            }, props)
          );
      })
    }
  }, [x, y])

  const [translateX, translateY] = [pan.x, pan.y];

  const childrenStyle = { transform: [{ translateX }, { translateY }, { scale: scaleValue }] };

  const hasTouchmove = () => !!props.bindhtouchmove || !!props.bindvtouchmove || !!props.bindtouchmove;

  const hasCatchTouchmove = () => !!props.catchhtouchmove || !!props.catchvtouchmove || !!props.catchtouchmove;

  const innerProps = useInnerProps(props, {
    ref: nodeRef,
    ...panResponder.current.panHandlers,
    onLayout,
    ...(hasTouchmove() ? { 'bindtouchmove': onTouchMove } : {}),
    ...(hasCatchTouchmove() ? { 'catchtouchmove': onCatchTouchMove } : {})
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
  ], { layoutRef });
  return (
    <Animated.View
      {...innerProps}
      style={[styles.container, childrenStyle]}
    >
      {children}
    </Animated.View>
  );
})

_MovableView.displayName = 'mpx-movable-view'

export default _MovableView